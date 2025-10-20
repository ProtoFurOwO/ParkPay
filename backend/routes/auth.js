const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const sgMail = require('@sendgrid/mail');

// JWT Secret (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'parkpay_secret_key_muy_segura_2025';
const JWT_EXPIRES_IN = '24h'; // Token expira en 24 horas

// Función para generar JWT token
function generarJWT(usuario) {
  return jwt.sign(
    { 
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Middleware para verificar JWT
function verificarJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Configurar SendGrid con la API Key desde variable de entorno
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Almacenamiento temporal de códigos de recuperación (en producción usar Redis o base de datos)
const codigosRecuperacion = new Map();

// Generar código de 6 dígitos
function generarCodigoRecuperacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Función para enviar email con SendGrid
async function enviarEmailRecuperacion(email, nombre, codigo) {
  // Si no hay API Key configurada, solo mostrar en consola (modo desarrollo)
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`📧 [MODO DESARROLLO] Código para ${email}: ${codigo}`);
    return { success: true, modo: 'desarrollo' };
  }

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@parkpay.com', // Email verificado en SendGrid
    subject: '🔐 Código de Recuperación - ParkPay',
    text: `Hola ${nombre},\n\nTu código de recuperación es: ${codigo}\n\nEste código expirará en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.\n\nSaludos,\nEquipo ParkPay`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚗 ParkPay</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sistema de Estacionamiento Inteligente</p>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Recuperación de Contraseña</h2>
          <p style="color: #666; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 14px;">Tu código de recuperación es:</p>
            <h1 style="color: white; margin: 0; font-size: 48px; letter-spacing: 8px; font-weight: bold;">${codigo}</h1>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⏱️ <strong>Este código expirará en 10 minutos.</strong>
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este mensaje de forma segura. Tu contraseña no será cambiada.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 ParkPay - Sistema de Estacionamiento Inteligente<br>
            Este es un mensaje automático, por favor no respondas a este correo.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email de recuperación enviado a ${email}`);
    return { success: true, modo: 'produccion' };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    // Aún en caso de error, mostramos el código en consola para desarrollo
    console.log(`📧 [FALLBACK] Código para ${email}: ${codigo}`);
    return { success: false, error: error.message };
  }
}

// REGISTRO - Crear usuario y su vehículo
router.post('/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, apellido, email, password, tipo, placa, marca, modelo, color } = req.body;

    // Validaciones
    if (!nombre || !apellido || !email || !password || !placa || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos (incluye tipo de vehículo)' });
    }
    
    // Validar que el tipo sea válido
    const tiposValidos = ['Automóvil', 'Motocicleta', 'Eléctrico'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de vehículo inválido' });
    }

    // Verificar si el email ya existe
    const emailCheck = await client.query(
      'SELECT id_usuario FROM Usuarios WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Verificar si la placa ya existe
    const placaCheck = await client.query(
      'SELECT id_vehiculo FROM Vehiculos WHERE placa = $1',
      [placa]
    );

    if (placaCheck.rows.length > 0) {
      return res.status(400).json({ error: 'La placa ya está registrada' });
    }

    await client.query('BEGIN');

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar usuario
    const usuarioResult = await client.query(
      'INSERT INTO Usuarios (nombre, apellido, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre, apellido, email',
      [nombre, apellido, email, password_hash]
    );

    const usuario = usuarioResult.rows[0];

    // Insertar vehículo con tipo
    const vehiculoResult = await client.query(
      'INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_vehiculo, placa, marca, modelo, color, tipo',
      [usuario.id_usuario, placa, marca || null, modelo || null, color || null, tipo]
    );

    await client.query('COMMIT');

    // Generar JWT token para el nuevo usuario
    const token = generarJWT(usuario);

    res.status(201).json({
      message: 'Usuario y vehículo registrados exitosamente',
      usuario: usuario,
      vehiculo: vehiculoResult.rows[0],
      token: token,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  } finally {
    client.release();
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Obtener vehículos del usuario (con tipo)
    const vehiculos = await pool.query(
      'SELECT id_vehiculo, placa, marca, modelo, color, tipo FROM Vehiculos WHERE id_usuario = $1',
      [usuario.id_usuario]
    );

    // No enviar el password_hash al cliente
    delete usuario.password_hash;

    // Generar JWT token
    const token = generarJWT(usuario);

    res.json({
      message: 'Login exitoso',
      usuario: usuario,
      vehiculos: vehiculos.rows,
      token: token,
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
router.post('/solicitar-recuperacion', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Verificar que el email existe
    const result = await pool.query(
      'SELECT id_usuario, nombre, email FROM Usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Por seguridad, no revelar que el email no existe
      return res.status(200).json({ 
        message: 'Si el email existe, recibirás un código de recuperación',
        codigo: '000000' // No revelar el código real
      });
    }

    const usuario = result.rows[0];

    // Generar código de 6 dígitos
    const codigo = generarCodigoRecuperacion();

    // Guardar código con expiración de 10 minutos
    const expiracion = Date.now() + (10 * 60 * 1000); // 10 minutos
    codigosRecuperacion.set(email, {
      codigo: codigo,
      expiracion: expiracion,
      intentos: 0
    });

    // Enviar email con SendGrid
    const resultadoEmail = await enviarEmailRecuperacion(email, usuario.nombre, codigo);

    // En modo desarrollo, devolver el código (solo si no hay SendGrid configurado)
    if (resultadoEmail.modo === 'desarrollo') {
      return res.json({ 
        message: 'Código de recuperación generado',
        codigo: codigo, // Solo en desarrollo
        modo: 'desarrollo'
      });
    }

    // En producción, no revelar el código
    res.json({ 
      message: 'Código de recuperación enviado a tu email',
      modo: 'produccion'
    });

  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// VERIFICAR CÓDIGO DE RECUPERACIÓN
router.post('/verificar-codigo', async (req, res) => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      return res.status(400).json({ error: 'Email y código requeridos' });
    }

    const datosRecuperacion = codigosRecuperacion.get(email);

    if (!datosRecuperacion) {
      return res.status(400).json({ error: 'Código no encontrado o expirado' });
    }

    // Verificar expiración
    if (Date.now() > datosRecuperacion.expiracion) {
      codigosRecuperacion.delete(email);
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    // Verificar código
    if (datosRecuperacion.codigo !== codigo) {
      datosRecuperacion.intentos++;
      
      if (datosRecuperacion.intentos >= 3) {
        codigosRecuperacion.delete(email);
        return res.status(400).json({ error: 'Demasiados intentos fallidos' });
      }

      return res.status(400).json({ 
        error: 'Código incorrecto',
        intentosRestantes: 3 - datosRecuperacion.intentos
      });
    }

    // Código válido
    res.json({ message: 'Código verificado correctamente' });

  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ error: 'Error al verificar código' });
  }
});

// CAMBIAR CONTRASEÑA CON CÓDIGO VERIFICADO
router.post('/cambiar-password', async (req, res) => {
  try {
    const { email, nueva_password } = req.body;

    if (!email || !nueva_password) {
      return res.status(400).json({ error: 'Email y nueva contraseña requeridos' });
    }

    // Verificar que existe un código válido para este email
    const datosRecuperacion = codigosRecuperacion.get(email);
    if (!datosRecuperacion) {
      return res.status(400).json({ error: 'Sesión de recuperación no válida' });
    }

    // Validar contraseña fuerte
    if (nueva_password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!/[A-Z]/.test(nueva_password)) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos una mayúscula' });
    }

    if (!/[0-9]/.test(nueva_password)) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos un número' });
    }

    // Hashear la nueva contraseña
    const password_hash = await bcrypt.hash(nueva_password, 10);

    // Actualizar contraseña en la base de datos
    await pool.query(
      'UPDATE Usuarios SET password_hash = $1 WHERE email = $2',
      [password_hash, email]
    );

    // Eliminar código de recuperación
    codigosRecuperacion.delete(email);

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// Endpoint para verificar si token es válido
router.get('/verificar-token', verificarJWT, (req, res) => {
  res.json({ 
    message: 'Token válido',
    usuario: req.usuario
  });
});

// Endpoint para refrescar token
router.post('/refresh-token', verificarJWT, (req, res) => {
  const nuevoToken = generarJWT(req.usuario);
  res.json({
    token: nuevoToken,
    expiresIn: JWT_EXPIRES_IN
  });
});

module.exports = { router, verificarJWT };
