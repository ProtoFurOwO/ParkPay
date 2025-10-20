const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ============================================================================
// ENDPOINT 1: BUSCAR CAJONES DISPONIBLES
// ============================================================================
// GET /api/reservas/disponibles?fecha_inicio=...&fecha_fin=...&tipo_vehiculo=...
router.get('/disponibles', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, tipo_vehiculo } = req.query;

        if (!fecha_inicio || !fecha_fin || !tipo_vehiculo) {
            return res.status(400).json({
                error: 'Faltan parámetros requeridos: fecha_inicio, fecha_fin, tipo_vehiculo'
            });
        }

        // Llamar a la función de PostgreSQL
        const result = await pool.query(
            `SELECT * FROM obtener_cajones_disponibles($1::TIMESTAMP, $2::TIMESTAMP, $3::VARCHAR)`,
            [fecha_inicio, fecha_fin, tipo_vehiculo]
        );

        res.json({
            cajones_disponibles: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al buscar cajones disponibles:', error);
        res.status(500).json({ error: 'Error al buscar cajones disponibles' });
    }
});


// ============================================================================
// ENDPOINT 2: CREAR RESERVA "AL INSTANTE"
// ============================================================================
// POST /api/reservas/instante
// Body: { id_usuario, id_vehiculo, id_cajon, duracion_minutos, monto_total }
router.post('/instante', async (req, res) => {
    try {
        const { id_usuario, id_vehiculo, id_cajon, duracion_minutos, monto_total } = req.body;

        if (!id_usuario || !id_vehiculo || !id_cajon || !duracion_minutos || !monto_total) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Crear reserva con ventana de 30 minutos desde AHORA (el trigger generará el código)
        const result = await pool.query(
            `INSERT INTO reservasanticipadas (
                id_usuario, 
                id_vehiculo, 
                id_cajon, 
                fecha_inicio_reserva, 
                fecha_fin_reserva, 
                duracion_comprada_minutos, 
                monto_total
            ) VALUES (
                $1, $2, $3, 
                NOW(), 
                NOW() + INTERVAL '30 minutes', 
                $4, $5
            ) RETURNING *`,
            [id_usuario, id_vehiculo, id_cajon, duracion_minutos, monto_total]
        );

        const reserva = result.rows[0];

        res.status(201).json({
            message: 'Reserva creada exitosamente',
            reserva: {
                id_reserva: reserva.id_reserva,
                codigo_acceso: reserva.codigo_acceso,
                fecha_inicio_reserva: reserva.fecha_inicio_reserva,
                fecha_fin_reserva: reserva.fecha_fin_reserva,
                duracion_comprada_minutos: reserva.duracion_comprada_minutos,
                monto_total: reserva.monto_total,
                estado: reserva.estado
            },
            instrucciones: 'Tienes 30 minutos para escanear el QR en la entrada'
        });
    } catch (error) {
        console.error('Error al crear reserva instantánea:', error);
        res.status(500).json({ error: 'Error al crear reserva' });
    }
});


// ============================================================================
// ENDPOINT 3: CREAR RESERVA "FUTURA"
// ============================================================================
// POST /api/reservas/futura
// Body: { id_usuario, id_vehiculo, id_cajon, fecha_inicio, fecha_fin, duracion_minutos, monto_total }
router.post('/futura', async (req, res) => {
    try {
        const { 
            id_usuario, 
            id_vehiculo, 
            id_cajon, 
            fecha_inicio, 
            fecha_fin, 
            duracion_minutos, 
            monto_total 
        } = req.body;

        if (!id_usuario || !id_vehiculo || !id_cajon || !fecha_inicio || !fecha_fin || !duracion_minutos || !monto_total) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Validar que la fecha de inicio sea en el futuro
        const inicioDate = new Date(fecha_inicio);
        const now = new Date();
        
        if (inicioDate <= now) {
            return res.status(400).json({ 
                error: 'La fecha de inicio debe ser en el futuro (mínimo 1 hora desde ahora)' 
            });
        }

        // Verificar disponibilidad del cajón
        const disponible = await pool.query(
            `SELECT cajon_disponible($1, $2::TIMESTAMP, $3::TIMESTAMP) AS disponible`,
            [id_cajon, fecha_inicio, fecha_fin]
        );

        if (!disponible.rows[0].disponible) {
            return res.status(409).json({ 
                error: 'El cajón no está disponible en ese horario',
                sugerencia: 'Intenta con otro cajón u otro horario'
            });
        }

        // Crear reserva futura (el trigger generará el código automáticamente)
        const result = await pool.query(
            `INSERT INTO reservasanticipadas (
                id_usuario, 
                id_vehiculo, 
                id_cajon, 
                fecha_inicio_reserva, 
                fecha_fin_reserva, 
                duracion_comprada_minutos, 
                monto_total
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
            ) RETURNING *`,
            [id_usuario, id_vehiculo, id_cajon, fecha_inicio, fecha_fin, duracion_minutos, monto_total]
        );

        const reserva = result.rows[0];

        res.status(201).json({
            message: 'Reserva futura creada exitosamente',
            reserva: {
                id_reserva: reserva.id_reserva,
                codigo_acceso: reserva.codigo_acceso,
                fecha_inicio_reserva: reserva.fecha_inicio_reserva,
                fecha_fin_reserva: reserva.fecha_fin_reserva,
                duracion_comprada_minutos: reserva.duracion_comprada_minutos,
                monto_total: reserva.monto_total,
                estado: reserva.estado
            }
        });
    } catch (error) {
        console.error('Error al crear reserva futura:', error);
        res.status(500).json({ error: 'Error al crear reserva futura' });
    }
});


// ============================================================================
// ENDPOINT 4: VALIDAR Y ESCANEAR RESERVA (CREAR TICKET)
// ============================================================================
// POST /api/reservas/escanear
// Body: { codigo_acceso }
router.post('/escanear', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { codigo_acceso } = req.body;

        if (!codigo_acceso) {
            return res.status(400).json({ error: 'Falta el código de acceso' });
        }

        await client.query('BEGIN');

        // 1. Buscar la reserva por código
        const reservaResult = await client.query(
            `SELECT * FROM reservasanticipadas WHERE codigo_acceso = $1`,
            [codigo_acceso]
        );

        if (reservaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Código de reserva no encontrado' });
        }

        const reserva = reservaResult.rows[0];

        // 2. Validar estado
        if (reserva.estado !== 'PENDIENTE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: `La reserva ya está ${reserva.estado.toLowerCase()}`,
                estado_actual: reserva.estado
            });
        }

        // 3. Validar que estamos en la ventana de tiempo
        const now = new Date();
        const inicio = new Date(reserva.fecha_inicio_reserva);
        const fin = new Date(reserva.fecha_fin_reserva);

        if (now < inicio) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Aún no puedes escanear esta reserva',
                fecha_inicio: reserva.fecha_inicio_reserva,
                mensaje: 'Debes esperar hasta la fecha de inicio'
            });
        }

        if (now > fin) {
            await client.query('ROLLBACK');
            // Marcar como expirada
            await client.query(
                `UPDATE reservasanticipadas SET estado = 'EXPIRADA' WHERE id_reserva = $1`,
                [reserva.id_reserva]
            );
            await client.query('COMMIT');
            return res.status(400).json({ 
                error: 'La reserva ha expirado',
                fecha_fin: reserva.fecha_fin_reserva
            });
        }

        // 4. Crear el ticket de estancia
        const ticketResult = await client.query(
            `INSERT INTO ticketsestancia (
                id_vehiculo,
                id_cajon,
                codigo_acceso,
                fecha_hora_entrada,
                fecha_salida_estimada,
                horas_estimadas,
                estado,
                monto_cobrado
            ) VALUES (
                $1, $2, $3, NOW(), 
                NOW() + ($4 || ' minutes')::INTERVAL,
                ($4 / 60.0)::NUMERIC,
                'ACTIVO',
                $5
            ) RETURNING *`,
            [
                reserva.id_vehiculo,
                reserva.id_cajon,
                'TKT-' + codigo_acceso,  // Código de ticket diferente al de reserva
                reserva.duracion_comprada_minutos,
                reserva.monto_total
            ]
        );

        const ticket = ticketResult.rows[0];

        // 5. Actualizar la reserva
        await client.query(
            `UPDATE reservasanticipadas 
             SET estado = 'ACTIVA', 
                 id_ticket = $1,
                 fecha_escaneado = NOW()
             WHERE id_reserva = $2`,
            [ticket.id_ticket, reserva.id_reserva]
        );

        // 6. Actualizar estado del cajón
        await client.query(
            `UPDATE cajonesestacionamiento SET estado = 'Ocupado' WHERE id_cajon = $1`,
            [reserva.id_cajon]
        );

        await client.query('COMMIT');

        res.json({
            message: '¡Bienvenido! Tu estancia ha comenzado',
            ticket: {
                id_ticket: ticket.id_ticket,
                codigo_acceso: ticket.codigo_acceso,
                fecha_hora_entrada: ticket.fecha_hora_entrada,
                fecha_salida_estimada: ticket.fecha_salida_estimada,
                duracion_minutos: reserva.duracion_comprada_minutos,
                monto_cobrado: ticket.monto_cobrado
            },
            cajon: {
                id_cajon: reserva.id_cajon
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al escanear reserva:', error);
        res.status(500).json({ error: 'Error al procesar escaneo de reserva' });
    } finally {
        client.release();
    }
});


// ============================================================================
// ENDPOINT 5: VER MIS RESERVAS
// ============================================================================
// GET /api/reservas/usuario/:id_usuario
router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const result = await pool.query(
            `SELECT 
                r.id_reserva,
                r.id_usuario,
                r.id_vehiculo,
                r.id_cajon,
                r.fecha_inicio_reserva,
                r.fecha_fin_reserva,
                r.duracion_comprada_minutos,
                r.monto_total,
                r.estado,
                r.codigo_acceso,
                r.id_ticket,
                r.fecha_creacion,
                r.fecha_escaneado,
                v.placa,
                v.tipo AS tipo_vehiculo,
                c.numero_cajon,
                c.ubicacion_piso,
                c.tipo AS tipo_cajon
             FROM reservasanticipadas r
             JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
             JOIN cajonesestacionamiento c ON r.id_cajon = c.id_cajon
             WHERE r.id_usuario = $1 
             ORDER BY r.fecha_inicio_reserva DESC`,
            [id_usuario]
        );

        // Devolver array directo (no objeto)
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener reservas del usuario:', error);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});


// ============================================================================
// ENDPOINT 6: CANCELAR RESERVA
// ============================================================================
// PUT /api/reservas/:id_reserva/cancelar
router.put('/:id_reserva/cancelar', async (req, res) => {
    try {
        const { id_reserva } = req.params;
        const { id_usuario } = req.body;

        // Verificar que la reserva existe y pertenece al usuario
        const reservaCheck = await pool.query(
            `SELECT * FROM reservasanticipadas WHERE id_reserva = $1 AND id_usuario = $2`,
            [id_reserva, id_usuario]
        );

        if (reservaCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = reservaCheck.rows[0];

        if (reserva.estado !== 'PENDIENTE') {
            return res.status(400).json({ 
                error: `No se puede cancelar una reserva en estado ${reserva.estado}` 
            });
        }

        // Cancelar reserva
        const result = await pool.query(
            `UPDATE reservasanticipadas 
             SET estado = 'CANCELADA', 
                 fecha_modificacion = NOW()
             WHERE id_reserva = $1
             RETURNING *`,
            [id_reserva]
        );

        res.json({
            message: 'Reserva cancelada exitosamente',
            reserva: result.rows[0]
        });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ error: 'Error al cancelar reserva' });
    }
});


// ============================================================================
// ENDPOINT 7: OBTENER DETALLE DE RESERVA
// ============================================================================
// GET /api/reservas/:id_reserva
router.get('/:id_reserva', async (req, res) => {
    try {
        const { id_reserva } = req.params;

        const result = await pool.query(
            `SELECT 
                r.*,
                u.nombre AS nombre_usuario,
                u.apellido,
                u.email,
                v.placa,
                v.tipo AS tipo_vehiculo,
                c.numero_cajon,
                c.ubicacion_piso
             FROM reservasanticipadas r
             JOIN usuarios u ON r.id_usuario = u.id_usuario
             JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
             JOIN cajonesestacionamiento c ON r.id_cajon = c.id_cajon
             WHERE r.id_reserva = $1`,
            [id_reserva]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener detalle de reserva:', error);
        res.status(500).json({ error: 'Error al obtener detalle de reserva' });
    }
});


// ============================================================================
// ENDPOINT 8: ESTADÍSTICAS (ADMIN)
// ============================================================================
// GET /api/reservas/admin/estadisticas
router.get('/admin/estadisticas', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM v_estadisticas_reservas`);
        
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});


// ============================================================================
// ENDPOINT 9: EXTENDER TIEMPO DE VENTANA DE ESCANEO
// ============================================================================
// PUT /api/reservas/:id_reserva/extender
// Body: { minutos: 10 }
router.put('/:id_reserva/extender', async (req, res) => {
    try {
        const { id_reserva } = req.params;
        const { minutos } = req.body;

        if (!minutos || minutos < 1 || minutos > 30) {
            return res.status(400).json({ 
                error: 'Los minutos deben estar entre 1 y 30' 
            });
        }

        // Verificar que la reserva exista y esté pendiente
        const checkReserva = await pool.query(
            `SELECT * FROM reservasanticipadas WHERE id_reserva = $1`,
            [id_reserva]
        );

        if (checkReserva.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        const reserva = checkReserva.rows[0];

        if (reserva.estado !== 'PENDIENTE') {
            return res.status(400).json({ 
                error: 'Solo se puede extender el tiempo de reservas pendientes' 
            });
        }

        // Extender la fecha_fin_reserva (ventana de escaneo)
        const result = await pool.query(
            `UPDATE reservasanticipadas 
             SET fecha_fin_reserva = fecha_fin_reserva + ($1 || ' minutes')::INTERVAL
             WHERE id_reserva = $2
             RETURNING *`,
            [minutos, id_reserva]
        );

        const reservaActualizada = result.rows[0];

        res.json({
            message: `Ventana de escaneo extendida ${minutos} minutos`,
            reserva: {
                id_reserva: reservaActualizada.id_reserva,
                fecha_inicio_reserva: reservaActualizada.fecha_inicio_reserva,
                fecha_fin_reserva: reservaActualizada.fecha_fin_reserva,
                estado: reservaActualizada.estado
            }
        });
    } catch (error) {
        console.error('Error al extender tiempo de reserva:', error);
        res.status(500).json({ error: 'Error al extender tiempo de reserva' });
    }
});


module.exports = router;
