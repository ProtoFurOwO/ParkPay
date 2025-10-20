const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Almacenamiento temporal de códigos de recuperación (en producción usar Redis o base de datos)
const codigosRecuperacion = new Map();

// Generar código de 6 dígitos
function generarCodigoRecuperacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    res.status(201).json({
      message: 'Usuario y vehículo registrados exitosamente',
      usuario: usuario,
      vehiculo: vehiculoResult.rows[0]
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

    res.json({
      message: 'Login exitoso',
      usuario: usuario,
      vehiculos: vehiculos.rows
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

    // Aquí deberías enviar el email con el código
    // Por ahora lo devolvemos en la respuesta (solo para desarrollo/demo)
    console.log(`Código de recuperación para ${email}: ${codigo}`);

    // En producción, elimina 'codigo' de la respuesta
    res.json({ 
      message: 'Código de recuperación enviado',
      codigo: codigo // ⚠️ SOLO PARA DEMO - ELIMINAR EN PRODUCCIÓN
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

module.exports = router;
