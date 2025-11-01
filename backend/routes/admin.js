const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { verificarToken, verificarAdmin, rateLimitByIP, generarToken } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// AUTENTICACIÓN DE ADMINISTRADOR (usando email @parkpay.com)
// ═══════════════════════════════════════════════════════════════

// Verificar si ya existe un administrador
router.get('/check-admin', async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) as total FROM Usuarios WHERE email LIKE '%@parkpay.com'");
    const hayAdmin = parseInt(result.rows[0].total) > 0;
    
    res.json({ 
      existe_admin: hayAdmin,
      mensaje: hayAdmin ? 'Ya existe un administrador' : 'No hay administradores, debe registrarse'
    });
  } catch (error) {
    console.error('Error al verificar admin:', error);
    res.status(500).json({ error: 'Error al verificar administrador' });
  }
});

// Registro de administrador (solo si no existe ninguno)
router.post('/register', async (req, res) => {
  try {
    const { username, password, nombre_completo } = req.body;

    if (!username || !password || !nombre_completo) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar que no exista ya un admin
    const checkAdmin = await pool.query("SELECT COUNT(*) as total FROM Usuarios WHERE email LIKE '%@parkpay.com'");
    if (parseInt(checkAdmin.rows[0].total) > 0) {
      return res.status(403).json({ error: 'Ya existe un administrador registrado' });
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Separar nombre y apellido
    const nombres = nombre_completo.split(' ');
    const nombre = nombres[0];
    const apellido = nombres.slice(1).join(' ') || 'Admin';
    
    // Usar el username como email (formato: username@parkpay.com)
    const email = `${username}@parkpay.com`;

    // Insertar administrador como usuario normal (el @parkpay.com lo identifica como admin)
    const result = await pool.query(
      `INSERT INTO Usuarios (nombre, apellido, email, password_hash) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_usuario, nombre, apellido, email, fecha_registro`,
      [nombre, apellido, email, password_hash]
    );

    res.status(201).json({
      message: 'Administrador registrado exitosamente',
      admin: result.rows[0]
    });

  } catch (error) {
    console.error('Error en registro de admin:', error);
    if (error.code === '23505') { // Violación de unique constraint
      res.status(400).json({ error: 'El correo electrónico ya existe' });
    } else {
      res.status(500).json({ error: 'Error al registrar administrador' });
    }
  }
});

// Login de administrador - 🔐 PROTEGIDO CON RATE LIMITING
router.post('/login', rateLimitByIP(3, 10 * 60 * 1000), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar admin por email (usando username@parkpay.com)
    const email = `${username}@parkpay.com`;
    const result = await pool.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = result.rows[0];

    // Verificar que sea admin (email @parkpay.com)
    if (!admin.email.endsWith('@parkpay.com')) {
      return res.status(401).json({ error: 'No es administrador' });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, admin.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Retornar datos sin contraseña
    const { password_hash, ...adminData } = admin;

    // 🔐 GENERAR TOKEN JWT PARA ADMIN
    const token = generarToken(adminData);

    console.log(`✅ Login de admin exitoso: ${adminData.email}`);

    res.json({
      message: 'Login exitoso',
      token: token, // ← NUEVO: Token JWT para admin
      admin: adminData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ESTADÍSTICAS DEL DASHBOARD
// ═══════════════════════════════════════════════════════════════
// 🔐 ESTADÍSTICAS PROTEGIDAS (Solo admins con JWT)
router.get('/stats', verificarToken, verificarAdmin, async (req, res) => {
  try {
    // Total usuarios (sin contar admins - excluir @parkpay.com)
    const usuarios = await pool.query("SELECT COUNT(*) as total FROM Usuarios WHERE email NOT LIKE '%@parkpay.com'");
    
    // Total vehículos
    const vehiculos = await pool.query('SELECT COUNT(*) as total FROM Vehiculos');
    
    // Cajones ocupados
    const cajonesOcupados = await pool.query("SELECT COUNT(*) as total FROM CajonesEstacionamiento WHERE estado = 'Ocupado'");
    
    // Tickets activos
    const ticketsActivos = await pool.query("SELECT COUNT(*) as total FROM TicketsEstancia WHERE estado = 'ACTIVO'");
    
    // Total recaudado
    const recaudado = await pool.query("SELECT COALESCE(SUM(monto_cobrado), 0) as total FROM TicketsEstancia WHERE estado = 'FINALIZADO'");

    res.json({
      total_usuarios: parseInt(usuarios.rows[0].total),
      total_vehiculos: parseInt(vehiculos.rows[0].total),
      cajones_ocupados: parseInt(cajonesOcupados.rows[0].total),
      tickets_activos: parseInt(ticketsActivos.rows[0].total),
      total_recaudado: parseFloat(recaudado.rows[0].total)
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD USUARIOS
// ═══════════════════════════════════════════════════════════════

// 🔐 Obtener todos los usuarios (PROTEGIDO - Solo admins con JWT)
router.get('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.email,
        u.fecha_registro,
        COUNT(v.id_vehiculo) as total_vehiculos
      FROM Usuarios u
      LEFT JOIN Vehiculos v ON u.id_usuario = v.id_usuario
      WHERE u.email NOT LIKE '%@parkpay.com'
      GROUP BY u.id_usuario
      ORDER BY u.fecha_registro DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear usuario
// 🔐 Crear nuevo usuario (PROTEGIDO)
router.post('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { nombre, apellido, email, password, vehiculos } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // 🚗 VALIDACIÓN DE PLACAS: Máximo 10 caracteres
    if (vehiculos && Array.isArray(vehiculos)) {
      for (const placa of vehiculos) {
        if (placa.length > 10) {
          return res.status(400).json({ 
            error: `Placa "${placa}" excede 10 caracteres (tiene ${placa.length}). Máximo permitido: 10 caracteres.` 
          });
        }
      }
    }

    await client.query('BEGIN');

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const userResult = await client.query(
      `INSERT INTO Usuarios (nombre, apellido, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre, apellido, email, fecha_registro`,
      [nombre, apellido, email, password_hash]
    );

    const usuario = userResult.rows[0];

    // Si hay vehículos, crearlos
    if (vehiculos && Array.isArray(vehiculos) && vehiculos.length > 0) {
      for (const placa of vehiculos) {
        await client.query(
          `INSERT INTO Vehiculos (placa, id_usuario)
           VALUES ($1, $2)`,
          [placa.toUpperCase(), usuario.id_usuario]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: usuario,
      vehiculos_creados: vehiculos ? vehiculos.length : 0
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear usuario:', error);
    if (error.code === '23505') {
      if (error.constraint && error.constraint.includes('email')) {
        res.status(400).json({ error: 'El correo electrónico ya existe' });
      } else if (error.constraint && error.constraint.includes('placa')) {
        res.status(400).json({ error: 'Una de las placas ya existe' });
      } else {
        res.status(400).json({ error: 'Datos duplicados' });
      }
    } else {
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  } finally {
    client.release();
  }
});

// Eliminar usuario
// 🔐 Eliminar usuario (PROTEGIDO)
router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no sea admin (email @parkpay.com)
    const checkAdmin = await pool.query('SELECT email FROM Usuarios WHERE id_usuario = $1', [id]);
    if (checkAdmin.rows.length > 0 && checkAdmin.rows[0].email.endsWith('@parkpay.com')) {
      return res.status(403).json({ error: 'No se puede eliminar un administrador' });
    }

    // Eliminar usuario (cascade eliminará sus vehículos)
    const result = await pool.query(
      'DELETE FROM Usuarios WHERE id_usuario = $1 RETURNING email',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Usuario eliminado exitosamente',
      usuario_eliminado: result.rows[0].email
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD VEHÍCULOS
// ═══════════════════════════════════════════════════════════════

// Obtener todos los vehículos
// 🔐 Obtener todos los vehículos (PROTEGIDO)
router.get('/vehiculos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id_vehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.id_usuario,
        u.email,
        u.nombre || ' ' || u.apellido as propietario
      FROM Vehiculos v
      JOIN Usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY v.id_vehiculo DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

// Eliminar vehículo
// 🔐 Eliminar vehículo (PROTEGIDO)
router.delete('/vehiculos/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM Vehiculos WHERE id_vehiculo = $1 RETURNING placa',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json({ 
      message: 'Vehículo eliminado exitosamente',
      placa: result.rows[0].placa
    });

  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD CAJONES
// ═══════════════════════════════════════════════════════════════

// Obtener todos los cajones
// 🔐 Obtener todos los cajones (PROTEGIDO)
router.get('/cajones', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id_cajon,
        c.numero_cajon,
        c.ubicacion_piso,
        c.tipo,
        c.estado,
        c.id_tarifa,
        t.descripcion as tarifa_descripcion,
        t.costo_por_hora
      FROM CajonesEstacionamiento c
      LEFT JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
      ORDER BY c.ubicacion_piso, c.numero_cajon
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cajones:', error);
    res.status(500).json({ error: 'Error al obtener cajones' });
  }
});

// Cambiar estado de cajón
router.patch('/cajones/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Disponible', 'Ocupado', 'Mantenimiento', 'Reservado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const result = await pool.query(
      `UPDATE CajonesEstacionamiento 
       SET estado = $1 
       WHERE id_cajon = $2 
       RETURNING numero_cajon, estado`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cajón no encontrado' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      cajon: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Editar cajón completo (tipo y tarifa)
// 🔐 Actualizar estado de cajón (PROTEGIDO)
router.put('/cajones/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, id_tarifa } = req.body;

    console.log('📝 Actualizando cajón:', { id, tipo, id_tarifa });

    // Validar que el cajón existe primero
    const cajonExistente = await pool.query(
      'SELECT * FROM CajonesEstacionamiento WHERE id_cajon = $1',
      [id]
    );

    if (cajonExistente.rows.length === 0) {
      console.log('❌ Cajón no encontrado:', id);
      return res.status(404).json({ error: 'Cajón no encontrado' });
    }

    console.log('✅ Cajón encontrado:', cajonExistente.rows[0]);

    // Validar tipo si se proporciona - VALORES DEL ENUM SIN ACENTOS EN MAYÚSCULAS
    const tiposValidos = ['AUTOMOVIL', 'DISCAPACITADO', 'ELECTRICO', 'MOTOCICLETA'];
    if (tipo && !tiposValidos.includes(tipo)) {
      console.log('❌ Tipo inválido:', tipo);
      return res.status(400).json({ 
        error: `Tipo de cajón inválido. Tipos válidos: ${tiposValidos.join(', ')}`,
        tipo_recibido: tipo
      });
    }

    // Verificar que la tarifa existe si se proporciona
    if (id_tarifa) {
      const checkTarifa = await pool.query(
        'SELECT id_tarifa, descripcion, costo_por_hora FROM Tarifas WHERE id_tarifa = $1',
        [id_tarifa]
      );
      
      if (checkTarifa.rows.length === 0) {
        console.log('❌ Tarifa no encontrada:', id_tarifa);
        return res.status(404).json({ error: 'La tarifa especificada no existe' });
      }
      console.log('✅ Tarifa encontrada:', checkTarifa.rows[0]);
    }

    // Actualizar cajón
    const result = await pool.query(
      `UPDATE CajonesEstacionamiento 
       SET tipo = COALESCE($1::tipo_cajon_enum, tipo),
           id_tarifa = COALESCE($2, id_tarifa)
       WHERE id_cajon = $3 
       RETURNING *`,
      [tipo, id_tarifa, id]
    );

    console.log('✅ Cajón actualizado exitosamente:', result.rows[0]);

    res.json({
      message: 'Cajón actualizado exitosamente',
      cajon: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al actualizar cajón:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al actualizar cajón',
      details: error.message 
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD RESERVAS
// ═══════════════════════════════════════════════════════════════

// Obtener todas las reservas
router.get('/reservas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id_reserva,
        r.codigo_acceso,
        r.fecha_inicio_reserva,
        r.fecha_fin_reserva,
        r.duracion_comprada_minutos,
        r.monto_total,
        r.estado,
        r.fecha_creacion,
        r.fecha_escaneado,
        v.placa,
        v.marca,
        v.modelo,
        u.nombre || ' ' || u.apellido as cliente,
        c.numero_cajon,
        c.ubicacion_piso
      FROM reservasanticipadas r
      JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
      JOIN usuarios u ON v.id_usuario = u.id_usuario
      JOIN cajonesestacionamiento c ON r.id_cajon = c.id_cajon
      ORDER BY r.fecha_creacion DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD TICKETS
// ═══════════════════════════════════════════════════════════════

// Obtener todos los tickets
router.get('/tickets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id_ticket,
        t.codigo_acceso,
        t.fecha_hora_entrada,
        t.fecha_hora_salida,
        t.monto_cobrado,
        t.estado,
        v.placa,
        v.marca,
        v.modelo,
        u.nombre || ' ' || u.apellido as cliente,
        c.numero_cajon
      FROM TicketsEstancia t
      JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
      JOIN Usuarios u ON v.id_usuario = u.id_usuario
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      ORDER BY t.fecha_hora_entrada DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// Finalizar ticket manualmente
router.patch('/tickets/:id/finalizar', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { monto_cobrado } = req.body;

    await client.query('BEGIN');

    // Actualizar ticket
    const ticketResult = await client.query(
      `UPDATE TicketsEstancia 
       SET fecha_hora_salida = CURRENT_TIMESTAMP,
           monto_cobrado = $1,
           estado = 'FINALIZADO'
       WHERE id_ticket = $2 AND estado = 'ACTIVO'
       RETURNING id_cajon`,
      [monto_cobrado, id]
    );

    if (ticketResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado o ya finalizado' });
    }

    // Liberar cajón
    await client.query(
      "UPDATE CajonesEstacionamiento SET estado = 'Disponible' WHERE id_cajon = $1",
      [ticketResult.rows[0].id_cajon]
    );

    await client.query('COMMIT');

    res.json({ message: 'Ticket finalizado exitosamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al finalizar ticket:', error);
    res.status(500).json({ error: 'Error al finalizar ticket' });
  } finally {
    client.release();
  }
});

// Eliminar ticket
router.delete('/tickets/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Obtener info del ticket
    const ticketInfo = await client.query(
      'SELECT id_cajon, estado FROM TicketsEstancia WHERE id_ticket = $1',
      [id]
    );

    if (ticketInfo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Si el ticket estaba activo, liberar el cajón
    if (ticketInfo.rows[0].estado === 'ACTIVO') {
      await client.query(
        "UPDATE CajonesEstacionamiento SET estado = 'Disponible' WHERE id_cajon = $1",
        [ticketInfo.rows[0].id_cajon]
      );
    }

    // Eliminar ticket
    await client.query('DELETE FROM TicketsEstancia WHERE id_ticket = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Ticket eliminado exitosamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({ error: 'Error al eliminar ticket' });
  } finally {
    client.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// CRUD TARIFAS
// ═══════════════════════════════════════════════════════════════

// Obtener todas las tarifas
router.get('/tarifas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id_tarifa,
        t.descripcion,
        t.costo_por_hora,
        COUNT(c.id_cajon) as cajones_usando
      FROM Tarifas t
      LEFT JOIN CajonesEstacionamiento c ON t.id_tarifa = c.id_tarifa
      GROUP BY t.id_tarifa
      ORDER BY t.id_tarifa
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    res.status(500).json({ error: 'Error al obtener tarifas' });
  }
});

// Crear tarifa
router.post('/tarifas', async (req, res) => {
  try {
    const { descripcion, costo_por_hora } = req.body;

    if (!descripcion || !costo_por_hora) {
      return res.status(400).json({ error: 'Descripción y costo son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO Tarifas (descripcion, costo_por_hora)
       VALUES ($1, $2)
       RETURNING *`,
      [descripcion, costo_por_hora]
    );

    res.status(201).json({
      message: 'Tarifa creada exitosamente',
      tarifa: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear tarifa:', error);
    res.status(500).json({ error: 'Error al crear tarifa' });
  }
});

// Actualizar tarifa
router.put('/tarifas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, costo_por_hora } = req.body;

    const result = await pool.query(
      `UPDATE Tarifas 
       SET descripcion = $1, costo_por_hora = $2
       WHERE id_tarifa = $3
       RETURNING *`,
      [descripcion, costo_por_hora, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarifa no encontrada' });
    }

    res.json({
      message: 'Tarifa actualizada exitosamente',
      tarifa: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    res.status(500).json({ error: 'Error al actualizar tarifa' });
  }
});

// Eliminar tarifa
router.delete('/tarifas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay cajones usando esta tarifa
    const check = await pool.query(
      'SELECT COUNT(*) as total FROM CajonesEstacionamiento WHERE id_tarifa = $1',
      [id]
    );

    if (parseInt(check.rows[0].total) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar: hay cajones usando esta tarifa' 
      });
    }

    const result = await pool.query(
      'DELETE FROM Tarifas WHERE id_tarifa = $1 RETURNING descripcion',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarifa no encontrada' });
    }

    res.json({ 
      message: 'Tarifa eliminada exitosamente',
      tarifa_eliminada: result.rows[0].descripcion
    });

  } catch (error) {
    console.error('Error al eliminar tarifa:', error);
    res.status(500).json({ error: 'Error al eliminar tarifa' });
  }
});

module.exports = router;
