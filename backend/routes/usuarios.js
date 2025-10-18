const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Obtener vehículos de un usuario
router.get('/:id_usuario/vehiculos', async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const result = await pool.query(
      'SELECT id_vehiculo, placa, marca, modelo, color FROM Vehiculos WHERE id_usuario = $1',
      [id_usuario]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

// Agregar un nuevo vehículo a un usuario
router.post('/:id_usuario/vehiculos', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { placa, marca, modelo, color } = req.body;

    if (!placa) {
      return res.status(400).json({ error: 'La placa es requerida' });
    }

    // Verificar si la placa ya existe
    const placaCheck = await pool.query(
      'SELECT id_vehiculo FROM Vehiculos WHERE placa = $1',
      [placa]
    );

    if (placaCheck.rows.length > 0) {
      return res.status(400).json({ error: 'La placa ya está registrada' });
    }

    const result = await pool.query(
      'INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id_usuario, placa, marca || null, modelo || null, color || null]
    );

    res.status(201).json({
      message: 'Vehículo agregado exitosamente',
      vehiculo: result.rows[0]
    });

  } catch (error) {
    console.error('Error al agregar vehículo:', error);
    res.status(500).json({ error: 'Error al agregar vehículo' });
  }
});

module.exports = router;
