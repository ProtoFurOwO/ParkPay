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
      horas_exceso: exceso > 0 ? exceso.toFixed(2) : 0,  // 🔧 ARREGLADO: usar horas_exceso
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
      
      // 🔧 ARREGLADO: Actualizar detallesCobro con la información correcta
      detallesCobro.horas_exceso_cobradas = horasExcesoCompletas;
      detallesCobro.monto_exceso = montoExceso.toFixed(2);
      detallesCobro.multa = multa.toFixed(2);
      detallesCobro.tiene_multa = exceso >= 2;
      
      console.log(`💰 Cobro de tiempo extra calculado:`, {
        exceso_real: exceso.toFixed(2),
        horas_cobradas: horasExcesoCompletas,
        monto_exceso: montoExceso.toFixed(2),
        multa: multa.toFixed(2),
        total_extra: montoExtra.toFixed(2)
      });
    }

    const montoTotal = montoOriginal + montoExtra;
    
    // 🔍 Verificar si el tiempo extra ya fue pagado
    const yaPagado = parseFloat(ticket.monto_extra || 0) >= montoExtra;
    
    if (yaPagado && exceso > 0) {
      console.log(`✅ Tiempo extra ya pagado para ticket ${ticket.codigo_acceso}`);
      detallesCobro.extra_ya_pagado = true;
      detallesCobro.mensaje_pago = 'Tiempo extra ya pagado';
      montoExtra = 0; // No cobrar de nuevo
    }

    // 🔧 NO FINALIZAR EL TICKET AÚN - Solo calcular el costo
    // El ticket se finalizará cuando se confirme el pago y salida

    await client.query('COMMIT');

    res.json({
      message: 'Cálculo de checkout exitoso',
      ticket: {
        codigo_acceso: ticket.codigo_acceso,
        cajon: `${ticket.numero_cajon} - ${ticket.ubicacion_piso}`,
        placa: ticket.placa,
        entrada: ticket.fecha_hora_entrada,
        id_ticket: ticket.id_ticket  // Agregar ID para referencia
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

// 🔍 Calcular tiempo extra actual de un ticket (sin finalizar)
router.get('/calcular-extra/:codigo_acceso', async (req, res) => {
  try {
    const { codigo_acceso } = req.params;

    // Obtener ticket con información de tarifa
    const ticketQuery = await pool.query(`
      SELECT t.*, tar.costo_por_hora, c.numero_cajon, c.ubicacion_piso,
             v.placa,
             EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.fecha_hora_entrada)) / 3600 as horas_reales
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
      JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
      WHERE t.codigo_acceso = $1 AND t.estado = 'ACTIVO'
    `, [codigo_acceso]);

    if (ticketQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o ya finalizado' });
    }

    const ticket = ticketQuery.rows[0];
    const costoPorHora = parseFloat(ticket.costo_por_hora);
    const horasReservadas = parseFloat(ticket.horas_estimadas);
    const horasReales = parseFloat(ticket.horas_reales);
    const exceso = horasReales - horasReservadas;

    let tiempoExtra = {
      tiene_exceso: exceso > 0,
      horas_exceso: exceso > 0 ? exceso.toFixed(2) : 0,
      monto_original: (horasReservadas * costoPorHora).toFixed(2),
      monto_extra: 0,
      multa: 0,
      total_extra: 0
    };

    if (exceso > 0) {
      const horasExcesoCompletas = Math.ceil(exceso);
      const montoExceso = horasExcesoCompletas * costoPorHora;
      let multa = 0;

      if (exceso >= 2) {
        multa = montoExceso * 0.5;
      }

      tiempoExtra.monto_extra = montoExceso.toFixed(2);
      tiempoExtra.multa = multa.toFixed(2);
      tiempoExtra.total_extra = (montoExceso + multa).toFixed(2);
      tiempoExtra.horas_cobradas = horasExcesoCompletas;
    }

    res.json({
      ticket: {
        codigo_acceso: ticket.codigo_acceso,
        cajon: `${ticket.numero_cajon} - ${ticket.ubicacion_piso}`,
        placa: ticket.placa,
        horas_reservadas: horasReservadas,
        horas_reales: horasReales.toFixed(2),
        estado: ticket.estado
      },
      tiempo_extra: tiempoExtra
    });

  } catch (error) {
    console.error('Error al calcular tiempo extra:', error);
    res.status(500).json({ error: 'Error al calcular tiempo extra' });
  }
});

// 💳 Pagar tiempo extra
router.post('/pagar-extra', async (req, res) => {
  const client = await pool.connect();
  try {
    const { codigo_acceso, monto_pagado } = req.body;

    if (!codigo_acceso) {
      return res.status(400).json({ error: 'Código de acceso requerido' });
    }

    await client.query('BEGIN');

    // Verificar ticket
    const ticketQuery = await client.query(`
      SELECT * FROM TicketsEstancia 
      WHERE codigo_acceso = $1 AND estado = 'ACTIVO'
    `, [codigo_acceso]);

    if (ticketQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = ticketQuery.rows[0];

    // 🔧 ACTUALIZAR: Usar campos existentes de la tabla
    // Solo actualizar el monto_extra para registrar que fue pagado
    await client.query(`
      UPDATE TicketsEstancia 
      SET monto_extra = $1
      WHERE id_ticket = $2
    `, [monto_pagado || 0, ticket.id_ticket]);

    await client.query('COMMIT');

    console.log(`💳 Pago extra procesado para ticket ${codigo_acceso}: $${monto_pagado}`);

    res.json({
      message: 'Pago procesado exitosamente',
      monto_pagado: monto_pagado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar pago extra:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  } finally {
    client.release();
  }
});

// �🔐 Finalizar ticket definitivamente (POST /finalizar para frontend)
router.post('/finalizar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { codigo_acceso } = req.body;

    if (!codigo_acceso) {
      return res.status(400).json({ error: 'Código de acceso requerido' });
    }

    await client.query('BEGIN');

    // Verificar que el ticket existe y está activo
    const ticketQuery = await client.query(`
      SELECT t.*, c.id_cajon, c.numero_cajon, c.ubicacion_piso
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      WHERE t.codigo_acceso = $1 AND t.estado = 'ACTIVO'
    `, [codigo_acceso]);

    if (ticketQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket no encontrado o ya finalizado' });
    }

    const ticket = ticketQuery.rows[0];

    // Finalizar el ticket
    await client.query(`
      UPDATE TicketsEstancia 
      SET fecha_hora_salida = CURRENT_TIMESTAMP,
          estado = 'FINALIZADO'
      WHERE id_ticket = $1
    `, [ticket.id_ticket]);

    // Liberar el cajón
    await client.query(`
      UPDATE CajonesEstacionamiento 
      SET estado = 'Disponible' 
      WHERE id_cajon = $1
    `, [ticket.id_cajon]);

    await client.query('COMMIT');

    console.log(`✅ Ticket ${codigo_acceso} finalizado exitosamente. Cajón ${ticket.numero_cajon} liberado.`);

    res.json({
      message: 'Salida procesada exitosamente',
      ticket: {
        codigo_acceso: codigo_acceso,
        cajon: `${ticket.numero_cajon} - ${ticket.ubicacion_piso}`,
        fecha_salida: new Date(),
        estado: 'FINALIZADO'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al finalizar ticket:', error);
    res.status(500).json({ error: 'Error al procesar la salida' });
  } finally {
    client.release();
  }
});

// 🎫 CREAR TICKET PARA USUARIO SIN CUENTA
router.post('/guest', async (req, res) => {
    try {
        console.log('🎫 POST /tickets/guest - Creando ticket para usuario sin cuenta...');
        console.log('📦 Body recibido:', req.body);

        const { tipo_vehiculo, placa, duracion_horas = 2 } = req.body;

        // Validaciones básicas
        if (!tipo_vehiculo || !placa) {
            return res.status(400).json({ 
                error: 'Faltan datos requeridos',
                requeridos: ['tipo_vehiculo', 'placa']
            });
        }

        // Validar tipo de vehículo
        const tiposValidos = ['AUTOMOVIL', 'MOTO', 'ELECTRICO'];
        if (!tiposValidos.includes(tipo_vehiculo.toUpperCase())) {
            return res.status(400).json({ 
                error: 'Tipo de vehículo no válido',
                tipos_validos: tiposValidos
            });
        }

        // Validar placa (básico)
        const placaLimpia = placa.trim().toUpperCase();
        if (placaLimpia.length < 3 || placaLimpia.length > 10) {
            return res.status(400).json({ 
                error: 'Placa debe tener entre 3 y 10 caracteres'
            });
        }

        // Limitar duración máxima (24 horas para guests)
        const duracionFinal = Math.min(Math.max(duracion_horas, 1), 24);
        const duracionMinutos = duracionFinal * 60;

        console.log('📋 Datos procesados:', { 
            tipo_vehiculo: tipo_vehiculo.toUpperCase(), 
            placa: placaLimpia, 
            duracion_horas: duracionFinal,
            duracion_minutos: duracionMinutos
        });

        // 1. Buscar cajón disponible del tipo correcto
        const cajonDisponible = await pool.query(`
            SELECT c.id_cajon, c.numero_cajon, t.costo_por_hora
            FROM cajonesestacionamiento c
            JOIN tarifas t ON c.id_tarifa = t.id_tarifa
            WHERE c.tipo = $1 
            AND c.estado = 'Disponible'
            AND c.id_cajon NOT IN (
                SELECT id_cajon FROM ticketsestancia WHERE estado = 'ACTIVO'
                UNION
                SELECT id_cajon FROM reservasanticipadas 
                WHERE estado = 'PENDIENTE' AND fecha_fin_reserva > NOW()
            )
            ORDER BY c.numero_cajon
            LIMIT 1
        `, [tipo_vehiculo.toUpperCase()]);

        if (cajonDisponible.rows.length === 0) {
            return res.status(409).json({ 
                error: 'No hay cajones disponibles',
                tipo_solicitado: tipo_vehiculo.toUpperCase(),
                mensaje: 'Intenta más tarde o con otro tipo de vehículo'
            });
        }

        const cajon = cajonDisponible.rows[0];
        const costoPorHora = parseFloat(cajon.costo_por_hora);
        const montoTotal = duracionFinal * costoPorHora;

        console.log('🅿️ Cajón asignado:', cajon);
        console.log('💰 Cálculo de precio:', { costoPorHora, duracionFinal, montoTotal });

        // 2. Obtener o crear usuario GUEST
        let idUsuarioGuest = await obtenerUsuarioGuest();
        
        // 3. Crear vehículo temporal para guest
        const vehiculoResult = await pool.query(`
            INSERT INTO vehiculos (
                id_usuario,
                placa, 
                marca, 
                modelo, 
                color, 
                tipo
            ) VALUES (
                $1, $2, 'GUEST', 'GUEST', 'N/A', $3
            ) RETURNING id_vehiculo
        `, [idUsuarioGuest, placaLimpia, tipo_vehiculo.toUpperCase()]);

        const idVehiculo = vehiculoResult.rows[0].id_vehiculo;
        console.log('🚗 Vehículo guest creado:', idVehiculo);

        // 4. Generar código de acceso único
        const codigoAcceso = generarCodigoAccesoGuest();

        // 5. Crear ticket en base de datos
        const ticketResult = await pool.query(`
            INSERT INTO ticketsestancia (
                id_cajon, 
                id_vehiculo,
                codigo_acceso, 
                monto_cobrado,
                fecha_hora_entrada,
                estado
            ) VALUES (
                $1, $2, $3, $4, NOW(), 'ACTIVO'
            ) RETURNING *
        `, [cajon.id_cajon, idVehiculo, codigoAcceso, montoTotal]);

        const ticket = ticketResult.rows[0];

        // 6. Marcar cajón como ocupado
        await pool.query(
            'UPDATE cajonesestacionamiento SET estado = $1 WHERE id_cajon = $2',
            ['Ocupado', cajon.id_cajon]
        );

        console.log('✅ Ticket de huésped creado exitosamente:', ticket.id_ticket);

        // 7. Respuesta exitosa
        res.status(201).json({
            message: 'Ticket de huésped creado exitosamente',
            ticket: {
                id_ticket: ticket.id_ticket,
                codigo_acceso: ticket.codigo_acceso,
                numero_cajon: cajon.numero_cajon,
                placa: placaLimpia,
                tipo_vehiculo: tipo_vehiculo.toUpperCase(),
                duracion_horas: duracionFinal,
                duracion_minutos: duracionMinutos,
                monto_total: montoTotal,
                costo_por_hora: costoPorHora,
                fecha_entrada: ticket.fecha_hora_entrada,
                estado: ticket.estado,
                tipo: 'GUEST'
            },
            instrucciones: [
                'Toma una foto de este ticket',
                `Dirígete al cajón ${cajon.numero_cajon}`,
                'Guarda el código QR y el código de respaldo',
                'Para salir, escanea el QR en la salida'
            ]
        });

    } catch (error) {
        console.error('💥 Error al crear ticket de huésped:', error);
        console.error('📍 Stack trace:', error.stack);
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            mensaje: 'No se pudo crear el ticket',
            details: error.message
        });
    }
});

// 🔧 FUNCIÓN AUXILIAR: Generar código de acceso único para guests
function generarCodigoAccesoGuest() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    
    // Generar código de 8 caracteres
    for (let i = 0; i < 8; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return 'GUEST-' + codigo;
}

// 🔧 FUNCIÓN AUXILIAR: Obtener ID del usuario GUEST
async function obtenerUsuarioGuest() {
    try {
        const result = await pool.query(`
            SELECT id_usuario FROM usuarios WHERE email = 'guest@parkpay.system'
        `);
        
        if (result.rows.length > 0) {
            return result.rows[0].id_usuario;
        }
        
        // Si no existe, crearlo
        const nuevoGuest = await pool.query(`
            INSERT INTO usuarios (
                nombre, apellido, email, password_hash, fecha_registro
            ) VALUES (
                'GUEST', 'USER', 'guest@parkpay.system', 'NO_PASSWORD_REQUIRED', NOW()
            ) RETURNING id_usuario
        `);
        
        console.log('✨ Usuario GUEST creado automáticamente:', nuevoGuest.rows[0].id_usuario);
        return nuevoGuest.rows[0].id_usuario;
        
    } catch (error) {
        console.error('💥 Error obteniendo usuario GUEST:', error);
        throw error;
    }
}

module.exports = router;
