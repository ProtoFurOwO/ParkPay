const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Endpoint para verificar y corregir inconsistencias
router.post('/sync', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Liberar cajones ocupados sin tickets activos
    const liberados = await client.query(`
      UPDATE CajonesEstacionamiento c
      SET estado = 'Disponible'
      WHERE estado = 'Ocupado'
        AND NOT EXISTS (
          SELECT 1 FROM TicketsEstancia t 
          WHERE t.id_cajon = c.id_cajon 
          AND t.estado = 'ACTIVO'
        )
      RETURNING numero_cajon
    `);

    // Ocupar cajones que tienen tickets activos pero están disponibles
    const ocupados = await client.query(`
      UPDATE CajonesEstacionamiento c
      SET estado = 'Ocupado'
      WHERE estado = 'Disponible'
        AND EXISTS (
          SELECT 1 FROM TicketsEstancia t 
          WHERE t.id_cajon = c.id_cajon 
          AND t.estado = 'ACTIVO'
        )
      RETURNING numero_cajon
    `);

    await client.query('COMMIT');

    res.json({
      message: 'Sincronización completada',
      cajones_liberados: liberados.rows.length,
      cajones_ocupados: ocupados.rows.length,
      liberados: liberados.rows,
      ocupados: ocupados.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en sincronización:', error);
    res.status(500).json({ error: 'Error al sincronizar' });
  } finally {
    client.release();
  }
});

// Obtener resumen del estado actual
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) as ocupados,
        SUM(CASE WHEN estado = 'Mantenimiento' THEN 1 ELSE 0 END) as mantenimiento
      FROM CajonesEstacionamiento
    `);

    const tickets = await pool.query(`
      SELECT COUNT(*) as tickets_activos
      FROM TicketsEstancia
      WHERE estado = 'ACTIVO'
    `);

    res.json({
      cajones: result.rows[0],
      tickets_activos: parseInt(tickets.rows[0].tickets_activos)
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

module.exports = router;
