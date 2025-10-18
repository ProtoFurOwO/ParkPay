const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN AUXILIAR: Liberar cajones vencidos automáticamente
// ═══════════════════════════════════════════════════════════════
// NOTA: Libera tickets ACTIVOS que tengan más de 24 horas desde entrada
async function liberarCajonesVencidos() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Buscar tickets activos con más de 24 horas desde entrada
    const ticketsVencidos = await client.query(`
      SELECT 
        t.id_ticket,
        t.id_cajon,
        t.codigo_acceso,
        t.fecha_hora_entrada,
        c.numero_cajon,
        EXTRACT(EPOCH FROM (NOW() - t.fecha_hora_entrada)) / 3600 AS horas_transcurridas
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      WHERE t.estado = 'ACTIVO'
        AND t.fecha_hora_entrada < NOW() - INTERVAL '24 hours'
    `);

    if (ticketsVencidos.rows.length > 0) {
      console.log(`🕐 Liberando ${ticketsVencidos.rows.length} cajones vencidos...`);
      
      for (const ticket of ticketsVencidos.rows) {
        // Finalizar ticket automáticamente
        await client.query(`
          UPDATE TicketsEstancia
          SET estado = 'FINALIZADO',
              fecha_hora_salida = NOW()
          WHERE id_ticket = $1
        `, [ticket.id_ticket]);

        // Liberar cajón
        await client.query(`
          UPDATE CajonesEstacionamiento
          SET estado = 'Disponible'
          WHERE id_cajon = $1
        `, [ticket.id_cajon]);

        const horasTranscurridas = Math.floor(ticket.horas_transcurridas);
        console.log(`   ✅ Cajón ${ticket.numero_cajon} liberado (ticket #${ticket.codigo_acceso}, ${horasTranscurridas}h transcurridas)`);
      }
    }

    await client.query('COMMIT');
    return ticketsVencidos.rows.length;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al liberar cajones vencidos:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Obtener todos los cajones con su estado y tarifa
router.get('/', async (req, res) => {
  try {
    // Primero liberar cajones vencidos
    await liberarCajonesVencidos();

    const result = await pool.query(`
      SELECT 
        c.id_cajon,
        c.numero_cajon,
        c.ubicacion_piso,
        c.tipo,
        c.estado,
        t.id_tarifa,
        t.descripcion as tarifa_descripcion,
        t.costo_por_hora
      FROM CajonesEstacionamiento c
      INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
      ORDER BY c.ubicacion_piso, c.numero_cajon
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cajones:', error);
    res.status(500).json({ error: 'Error al obtener cajones' });
  }
});

// Obtener cajones por piso
router.get('/piso/:piso', async (req, res) => {
  try {
    // Liberar cajones vencidos antes de consultar
    await liberarCajonesVencidos();

    const { piso } = req.params;

    const result = await pool.query(`
      SELECT 
        c.id_cajon,
        c.numero_cajon,
        c.ubicacion_piso,
        c.tipo,
        c.estado,
        t.id_tarifa,
        t.descripcion as tarifa_descripcion,
        t.costo_por_hora
      FROM CajonesEstacionamiento c
      INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.ubicacion_piso = $1
      ORDER BY c.numero_cajon
    `, [piso]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cajones por piso:', error);
    res.status(500).json({ error: 'Error al obtener cajones' });
  }
});

// Obtener un cajón específico
router.get('/:id_cajon', async (req, res) => {
  try {
    const { id_cajon } = req.params;

    const result = await pool.query(`
      SELECT 
        c.id_cajon,
        c.numero_cajon,
        c.ubicacion_piso,
        c.tipo,
        c.estado,
        t.id_tarifa,
        t.descripcion as tarifa_descripcion,
        t.costo_por_hora
      FROM CajonesEstacionamiento c
      INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
      WHERE c.id_cajon = $1
    `, [id_cajon]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cajón no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cajón:', error);
    res.status(500).json({ error: 'Error al obtener cajón' });
  }
});

// Actualizar estado de un cajón
router.patch('/:id_cajon/estado', async (req, res) => {
  try {
    const { id_cajon } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['Disponible', 'Ocupado', 'Reservado', 'Mantenimiento'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const result = await pool.query(
      'UPDATE CajonesEstacionamiento SET estado = $1 WHERE id_cajon = $2 RETURNING *',
      [estado, id_cajon]
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

module.exports = router;
