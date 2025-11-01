const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// Crear un nuevo ticket (entrada al estacionamiento)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_vehiculo, id_cajon, horas_estimadas } = req.body;

    if (!id_vehiculo || !id_cajon) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    await client.query('BEGIN');

    // Verificar que el cajón esté disponible
    const cajonCheck = await client.query(
      'SELECT estado FROM CajonesEstacionamiento WHERE id_cajon = $1',
      [id_cajon]
    );

    if (cajonCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cajón no encontrado' });
    }

    if (cajonCheck.rows[0].estado !== 'Disponible') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El cajón no está disponible' });
    }

    // Generar código de acceso único
    const codigo_acceso = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear el ticket
    const ticketResult = await client.query(`
      INSERT INTO TicketsEstancia 
      (id_vehiculo, id_cajon, codigo_acceso, fecha_hora_entrada, horas_estimadas, fecha_salida_estimada, estado) 
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP + ($4::numeric || ' hours')::INTERVAL, 'ACTIVO') 
      RETURNING *
    `, [id_vehiculo, id_cajon, codigo_acceso, horas_estimadas || 2]);

    // Actualizar estado del cajón a Ocupado
    await client.query(
      'UPDATE CajonesEstacionamiento SET estado = $1 WHERE id_cajon = $2',
      ['Ocupado', id_cajon]
    );

    await client.query('COMMIT');

    // Obtener información completa del ticket creado
    const ticketCompleto = await pool.query(`
      SELECT 
        t.id_ticket,
        t.codigo_acceso,
        t.fecha_hora_entrada,
        t.estado as ticket_estado,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        c.numero_cajon,
        c.ubicacion_piso,
        tar.descripcion as tarifa_descripcion,
        tar.costo_por_hora
      FROM TicketsEstancia t
      INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
      INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      INNER JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      WHERE t.id_ticket = $1
    `, [ticketResult.rows[0].id_ticket]);

    res.status(201).json({
      message: 'Ticket creado exitosamente',
      ticket: ticketCompleto.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear ticket:', error);
    res.status(500).json({ error: 'Error al crear ticket' });
  } finally {
    client.release();
  }
});

// Obtener tickets activos de un usuario
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const result = await pool.query(`
      SELECT 
        t.id_ticket,
        t.codigo_acceso,
        t.fecha_hora_entrada,
        t.fecha_hora_salida,
        t.horas_estimadas,
        t.fecha_salida_estimada,
        t.tiempo_extra_minutos,
        t.monto_cobrado,
        t.monto_extra,
        t.estado,
        v.placa,
        v.marca,
        v.modelo,
        c.numero_cajon,
        c.ubicacion_piso,
        tar.descripcion as tarifa_descripcion,
        tar.costo_por_hora,
        CASE 
          WHEN t.estado = 'ACTIVO' AND t.fecha_salida_estimada IS NOT NULL
          THEN EXTRACT(EPOCH FROM (t.fecha_salida_estimada - CURRENT_TIMESTAMP)) / 60
          ELSE NULL
        END as minutos_restantes
      FROM TicketsEstancia t
      INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
      INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
      INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      INNER JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      WHERE u.id_usuario = $1
      ORDER BY t.fecha_hora_entrada DESC
    `, [id_usuario]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// Finalizar ticket (salida del estacionamiento)
router.patch('/:id_ticket/finalizar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id_ticket } = req.params;

    await client.query('BEGIN');

    // Obtener información del ticket
    const ticketInfo = await client.query(`
      SELECT 
        t.*,
        tar.costo_por_hora,
        c.id_cajon
      FROM TicketsEstancia t
      INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      INNER JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      WHERE t.id_ticket = $1
    `, [id_ticket]);

    if (ticketInfo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = ticketInfo.rows[0];

    if (ticket.estado !== 'ACTIVO') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El ticket ya fue finalizado' });
    }

    // Calcular tiempo transcurrido y monto a cobrar
    const fecha_salida = new Date();
    const fecha_entrada = new Date(ticket.fecha_hora_entrada);
    const horas_transcurridas = Math.ceil((fecha_salida - fecha_entrada) / (1000 * 60 * 60));
    const monto_cobrado = horas_transcurridas * parseFloat(ticket.costo_por_hora);

    // Actualizar ticket
    await client.query(`
      UPDATE TicketsEstancia 
      SET fecha_hora_salida = CURRENT_TIMESTAMP,
          monto_cobrado = $1,
          estado = 'PAGADO'
      WHERE id_ticket = $2
    `, [monto_cobrado, id_ticket]);

    // Liberar el cajón
    await client.query(
      'UPDATE CajonesEstacionamiento SET estado = $1 WHERE id_cajon = $2',
      ['Disponible', ticket.id_cajon]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Ticket finalizado exitosamente',
      horas_transcurridas,
      monto_cobrado: monto_cobrado.toFixed(2),
      fecha_salida
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al finalizar ticket:', error);
    res.status(500).json({ error: 'Error al finalizar ticket' });
  } finally {
    client.release();
  }
});

// Calcular costo estimado
router.post('/calcular-costo', async (req, res) => {
  try {
    const { id_cajon, horas } = req.body;

    if (!id_cajon || !horas) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const result = await pool.query(`
      SELECT tar.costo_por_hora
      FROM CajonesEstacionamiento c
      INNER JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      WHERE c.id_cajon = $1
    `, [id_cajon]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cajón no encontrado' });
    }

    const costo_por_hora = parseFloat(result.rows[0].costo_por_hora);
    const costo_total = (costo_por_hora * horas).toFixed(2);

    res.json({
      horas,
      costo_por_hora: costo_por_hora.toFixed(2),
      costo_total
    });

  } catch (error) {
    console.error('Error al calcular costo:', error);
    res.status(500).json({ error: 'Error al calcular costo' });
  }
});

// Extender tiempo de un ticket activo
router.post('/:id_ticket/extender', async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const { minutos_adicionales } = req.body;

    if (!minutos_adicionales || minutos_adicionales <= 0) {
      return res.status(400).json({ error: 'Minutos adicionales inválidos' });
    }

    // Obtener ticket con información del cajón
    const ticketQuery = await pool.query(`
      SELECT t.*, tar.costo_por_hora, t.fecha_hora_entrada, t.horas_estimadas,
             COALESCE(t.fecha_salida_estimada, 
                      t.fecha_hora_entrada + (t.horas_estimadas || ' hours')::INTERVAL) as salida_estimada_actual
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      WHERE t.id_ticket = $1 AND t.estado = 'ACTIVO'
    `, [id_ticket]);

    if (ticketQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o no está activo' });
    }

    const ticket = ticketQuery.rows[0];
    const costoPorHora = parseFloat(ticket.costo_por_hora);
    
    // Calcular costo de los minutos adicionales
    const horasAdicionales = minutos_adicionales / 60;
    const costoAdicional = horasAdicionales * costoPorHora;

    // Actualizar ticket con tiempo extendido
    const updateResult = await pool.query(`
      UPDATE TicketsEstancia 
      SET tiempo_extra_minutos = COALESCE(tiempo_extra_minutos, 0) + $1,
          fecha_salida_estimada = COALESCE(fecha_salida_estimada, 
                                           fecha_hora_entrada + (horas_estimadas || ' hours')::INTERVAL) 
                                  + ($1 || ' minutes')::INTERVAL
      WHERE id_ticket = $2
      RETURNING *, 
                COALESCE(fecha_salida_estimada, 
                         fecha_hora_entrada + (horas_estimadas || ' hours')::INTERVAL) as nueva_salida_estimada
    `, [minutos_adicionales, id_ticket]);

    res.json({
      message: 'Tiempo extendido exitosamente',
      minutos_agregados: minutos_adicionales,
      costo_adicional: costoAdicional.toFixed(2),
      nueva_hora_salida: updateResult.rows[0].nueva_salida_estimada,
      ticket: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error al extender tiempo:', error);
    res.status(500).json({ error: 'Error al extender tiempo del ticket' });
  }
});

// Checkout - Procesar salida del estacionamiento
router.post('/checkout', async (req, res) => {
  const client = await pool.connect();
  try {
    const { codigo_acceso } = req.body;

    if (!codigo_acceso) {
      return res.status(400).json({ error: 'Código de acceso requerido' });
    }

    await client.query('BEGIN');

    // Obtener ticket con toda la información
    const ticketQuery = await client.query(`
      SELECT t.*, tar.costo_por_hora, c.numero_cajon, c.ubicacion_piso,
             v.placa,
             COALESCE(t.fecha_salida_estimada, 
                      t.fecha_hora_entrada + (t.horas_estimadas || ' hours')::INTERVAL) as salida_estimada,
             EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.fecha_hora_entrada)) / 3600 as horas_reales
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
      WHERE t.codigo_acceso = $1 AND t.estado = 'ACTIVO'
    `, [codigo_acceso]);

    if (ticketQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado o ya procesado' });
    }

    const ticket = ticketQuery.rows[0];
    const costoPorHora = parseFloat(ticket.costo_por_hora);
    const horasReservadas = parseFloat(ticket.horas_estimadas);
    const horasReales = parseFloat(ticket.horas_reales);
    const montoOriginal = horasReservadas * costoPorHora;

    // Calcular exceso y cobro adicional
    const exceso = horasReales - horasReservadas;
    let montoExtra = 0;
    let multa = 0;
    let detallesCobro = {
      horas_reservadas: horasReservadas,
      horas_reales: horasReales.toFixed(2),
      exceso: exceso > 0 ? exceso.toFixed(2) : 0,
      monto_original: montoOriginal.toFixed(2)
    };

    if (exceso > 0) {
      // Redondear exceso a horas completas (hacia arriba)
      const horasExcesoCompletas = Math.ceil(exceso);
      const montoExceso = horasExcesoCompletas * costoPorHora;
      
      // Si el exceso es >= 2 horas, aplicar multa del 50%
      if (exceso >= 2) {
        multa = montoExceso * 0.5;
      }
      
      montoExtra = montoExceso + multa;
      
      detallesCobro.horas_exceso_cobradas = horasExcesoCompletas;
      detallesCobro.monto_exceso = montoExceso.toFixed(2);
      detallesCobro.multa = multa.toFixed(2);
      detallesCobro.tiene_multa = exceso >= 2;
    }

    const montoTotal = montoOriginal + montoExtra;

    // Actualizar ticket con información de salida
    await client.query(`
      UPDATE TicketsEstancia 
      SET fecha_hora_salida = CURRENT_TIMESTAMP,
          estado = 'FINALIZADO',
          monto_cobrado = $1,
          monto_extra = $2
      WHERE id_ticket = $3
    `, [montoTotal, montoExtra, ticket.id_ticket]);

    // Liberar cajón
    await client.query(
      'UPDATE CajonesEstacionamiento SET estado = $1 WHERE id_cajon = $2',
      ['Disponible', ticket.id_cajon]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Checkout exitoso',
      ticket: {
        codigo_acceso: ticket.codigo_acceso,
        cajon: `${ticket.numero_cajon} - ${ticket.ubicacion_piso}`,
        placa: ticket.placa,
        entrada: ticket.fecha_hora_entrada,
        salida: new Date()
      },
      cobro: {
        ...detallesCobro,
        monto_extra: montoExtra.toFixed(2),
        total: montoTotal.toFixed(2)
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en checkout:', error);
    res.status(500).json({ error: 'Error al procesar salida' });
  } finally {
    client.release();
  }
});

module.exports = router;
