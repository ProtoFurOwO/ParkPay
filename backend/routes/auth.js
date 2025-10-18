const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

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

module.exports = router;
