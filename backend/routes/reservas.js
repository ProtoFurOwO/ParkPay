const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

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
// ENDPOINT 2: CREAR RESERVA "AL INSTANTE" - 🔐 PROTEGIDA CON JWT
// ============================================================================
// POST /api/reservas/instante
// Body: { id_usuario, id_vehiculo, id_cajon, duracion_minutos, monto_total }
router.post('/instante', verificarToken, async (req, res) => {
    try {
        const { id_vehiculo, id_cajon, duracion_minutos, monto_total } = req.body;
        const id_usuario = req.usuario.id_usuario; // Usar el ID del token JWT, no del body

        if (!id_vehiculo || !id_cajon || !duracion_minutos || !monto_total) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // 🛡️ VALIDACIÓN DE SEGURIDAD 1: Verificar que el vehículo pertenece al usuario autenticado
        const vehiculoOwnerCheck = await pool.query(`
            SELECT v.id_vehiculo, v.placa, u.nombre, u.apellido
            FROM vehiculos v
            JOIN usuarios u ON v.id_usuario = u.id_usuario
            WHERE v.id_vehiculo = $1 AND v.id_usuario = $2
        `, [id_vehiculo, id_usuario]);

        if (vehiculoOwnerCheck.rows.length === 0) {
            console.warn(`🚨 INTENTO DE SUPLANTACIÓN: Usuario ${id_usuario} intentó usar vehículo ${id_vehiculo} que no le pertenece`);
            return res.status(403).json({ 
                error: 'No puedes reservar con un vehículo que no te pertenece',
                codigo: 'VEHICULO_NO_AUTORIZADO'
            });
        }

        // 🛡️ VALIDACIÓN DE SEGURIDAD 2: Limitar duración máxima (10 días = 240 horas = 14400 minutos)
        const MAX_DURACION_MINUTOS = 14400; // 10 días
        let duracionFinal = duracion_minutos;
        
        if (duracion_minutos > MAX_DURACION_MINUTOS) {
            console.warn(`⚠️ Duración excesiva detectada: ${duracion_minutos} minutos. Limitando a ${MAX_DURACION_MINUTOS} minutos (10 días)`);
            duracionFinal = MAX_DURACION_MINUTOS;
        }

        // 🛡️ VALIDACIÓN DE PRECIO - ANTI BURP SUITE
        // NO confiar en el monto que envía el frontend - obtener tarifa real de BD
        
        // 1. Obtener la tarifa real del cajón desde la base de datos
        const tarifaResult = await pool.query(`
            SELECT c.id_cajon, c.numero_cajon, t.costo_por_hora 
            FROM cajonesestacionamiento c
            JOIN tarifas t ON c.id_tarifa = t.id_tarifa 
            WHERE c.id_cajon = $1
        `, [id_cajon]);

        if (tarifaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cajón no encontrado' });
        }

        const cajonInfo = tarifaResult.rows[0];
        const tarifaPorHora = parseFloat(cajonInfo.costo_por_hora);
        const horas = Math.ceil(duracionFinal / 60);
        const montoReal = horas * tarifaPorHora;

        // Verificar que el monto enviado sea correcto (tolerancia de ±1 peso)
        if (Math.abs(monto_total - montoReal) > 1) {
            console.warn(`🚨 INTENTO DE FRAUDE: Usuario ${id_usuario} intentó pagar $${monto_total} en lugar de $${montoReal} (Tarifa: $${tarifaPorHora}/hora)`);
            return res.status(400).json({ 
                error: 'Monto inválido detectado',
                monto_correcto: montoReal,
                monto_enviado: monto_total,
                tarifa_por_hora: tarifaPorHora,
                mensaje: 'El precio debe calcularse correctamente'
            });
        }

        // Usar el monto calculado por el servidor (NO el del frontend)
        const montoSeguro = montoReal;

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
            [id_usuario, id_vehiculo, id_cajon, duracionFinal, montoSeguro]
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
// ENDPOINT 3: CREAR RESERVA "FUTURA" - 🔐 PROTEGIDA CON JWT
// ============================================================================
// POST /api/reservas/futura
// Body: { id_usuario, id_vehiculo, id_cajon, fecha_inicio, fecha_fin, duracion_minutos, monto_total }
router.post('/futura', verificarToken, async (req, res) => {
    try {
        const { 
            id_vehiculo, 
            id_cajon, 
            fecha_inicio, 
            fecha_fin, 
            duracion_minutos, 
            monto_total 
        } = req.body;
        const id_usuario = req.usuario.id_usuario; // Usar el ID del token JWT, no del body

        if (!id_vehiculo || !id_cajon || !fecha_inicio || !fecha_fin || !duracion_minutos || !monto_total) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // 🛡️ VALIDACIÓN DE PROPIEDAD DEL VEHÍCULO - ANTI TAMPERING
        const vehiculoVerif = await pool.query(
            'SELECT id_vehiculo FROM vehiculos WHERE id_vehiculo = $1 AND id_usuario = $2',
            [id_vehiculo, id_usuario]
        );

        if (vehiculoVerif.rows.length === 0) {
            console.warn(`🚨 INTENTO DE USO DE VEHÍCULO AJENO: Usuario ${id_usuario} intentó usar vehículo ${id_vehiculo} que no le pertenece`);
            return res.status(403).json({ 
                error: 'No puedes usar un vehículo que no te pertenece',
                id_vehiculo_solicitado: id_vehiculo,
                mensaje: 'Selecciona uno de tus vehículos registrados'
            });
        }

        // 🛡️ VALIDACIÓN DE DURACIÓN MÁXIMA (10 días = 14,400 minutos)
        const duracionMaxima = 14400; // 10 días
        let duracionFinal = duracion_minutos;

        if (duracion_minutos > duracionMaxima) {
            console.warn(`🚨 INTENTO DE RESERVA EXCESIVA: Usuario ${id_usuario} intentó reservar ${duracion_minutos} minutos (máximo: ${duracionMaxima})`);
            duracionFinal = duracionMaxima;
        }

        // 🛡️ VALIDACIÓN DE FECHA FUTURA MÁXIMA (3 meses = 90 días)
        const inicioDate = new Date(fecha_inicio);
        const ahora = new Date();
        const maxFechaFutura = new Date();
        maxFechaFutura.setDate(maxFechaFutura.getDate() + 90); // 3 meses

        if (inicioDate > maxFechaFutura) {
            console.warn(`🚨 INTENTO DE RESERVA EXCESIVAMENTE FUTURA: Usuario ${id_usuario} intentó reservar para ${fecha_inicio} (máximo: ${maxFechaFutura.toISOString()})`);
            return res.status(400).json({ 
                error: 'No puedes reservar con más de 3 meses de anticipación',
                fecha_solicitada: fecha_inicio,
                fecha_maxima_permitida: maxFechaFutura.toISOString(),
                mensaje: 'Selecciona una fecha dentro de los próximos 3 meses'
            });
        }

        // 🛡️ VALIDACIÓN DE PRECIO - ANTI BURP SUITE PARA RESERVAS FUTURAS
        // Obtener tarifa real del cajón desde la base de datos
        const tarifaResult = await pool.query(`
            SELECT c.id_cajon, c.numero_cajon, t.costo_por_hora 
            FROM cajonesestacionamiento c
            JOIN tarifas t ON c.id_tarifa = t.id_tarifa 
            WHERE c.id_cajon = $1
        `, [id_cajon]);

        if (tarifaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cajón no encontrado' });
        }

        const cajonInfo = tarifaResult.rows[0];
        const tarifaPorHora = parseFloat(cajonInfo.costo_por_hora);
        const horas = Math.ceil(duracionFinal / 60);
        const montoReal = horas * tarifaPorHora;

        // Verificar que el monto enviado sea correcto
        if (Math.abs(monto_total - montoReal) > 1) {
            console.warn(`🚨 INTENTO DE FRAUDE EN RESERVA FUTURA: Usuario ${id_usuario} intentó pagar $${monto_total} en lugar de $${montoReal} (Tarifa: $${tarifaPorHora}/hora)`);
            return res.status(400).json({ 
                error: 'Monto inválido detectado',
                monto_correcto: montoReal,
                monto_enviado: monto_total,
                mensaje: 'El precio debe calcularse correctamente'
            });
        }

        // Usar el monto calculado por el servidor
        const montoSeguro = montoReal;

        // Validar que la fecha de inicio sea en el futuro (ya se validó arriba pero verificamos nuevamente)
        if (inicioDate <= ahora) {
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
            [id_usuario, id_vehiculo, id_cajon, fecha_inicio, fecha_fin, duracionFinal, montoSeguro]
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
        const horasEstimadas = Math.ceil(reserva.duracion_comprada_minutos / 60);
        
        const ticketResult = await client.query(
            `INSERT INTO ticketsestancia (
                id_vehiculo,
                id_cajon,
                codigo_acceso,
                fecha_hora_entrada,
                fecha_salida_estimada,
                estado,
                monto_cobrado
            ) VALUES (
                $1, $2, $3, NOW(), 
                NOW() + ($4 || ' minutes')::INTERVAL,
                'ACTIVO',
                $5
            ) RETURNING *`,
            [
                reserva.id_vehiculo,
                reserva.id_cajon,
                'TICKET-' + codigo_acceso,  // Código de ticket diferente al de reserva
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

        // Obtener información completa del cajón y vehículo
        const cajonInfo = await client.query(
            `SELECT * FROM cajonesestacionamiento WHERE id_cajon = $1`,
            [reserva.id_cajon]
        );

        const vehiculoInfo = await client.query(
            `SELECT * FROM vehiculos WHERE id_vehiculo = $1`,
            [reserva.id_vehiculo]
        );

        res.json({
            message: '¡Bienvenido! Tu estancia ha comenzado',
            ticket: {
                id_ticket: ticket.id_ticket,
                codigo_acceso: ticket.codigo_acceso,
                fecha_hora_entrada: ticket.fecha_hora_entrada,
                fecha_salida_estimada: ticket.fecha_salida_estimada,
                tiempo_estimado: reserva.duracion_comprada_minutos,
                monto_cobrado: ticket.monto_cobrado
            },
            cajon: cajonInfo.rows[0],
            vehiculo: vehiculoInfo.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al escanear reserva:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al procesar escaneo de reserva',
            detalle: error.message 
        });
    } finally {
        client.release();
    }
});


// ============================================================================
// ENDPOINT 5: VER MIS RESERVAS - 🔐 PROTEGIDA CON JWT
// ============================================================================
// GET /api/reservas/usuario/:id_usuario
router.get('/usuario/:id_usuario', verificarToken, async (req, res) => {
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
// ENDPOINT 6: CANCELAR RESERVA - 🔐 PROTEGIDA CON JWT
// ============================================================================
// PUT /api/reservas/:id_reserva/cancelar
router.put('/:id_reserva/cancelar', verificarToken, async (req, res) => {
    try {
        const { id_reserva } = req.params;

        // Verificar que la reserva existe
        const reservaCheck = await pool.query(
            `SELECT * FROM reservasanticipadas WHERE id_reserva = $1`,
            [id_reserva]
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
             SET estado = 'CANCELADA'
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
// ENDPOINT 9: EXTENDER TIEMPO DE VENTANA DE ESCANEO - 🔐 PROTEGIDA CON JWT
// ============================================================================
// PUT /api/reservas/:id_reserva/extender
// Body: { minutos: 10 }
router.put('/:id_reserva/extender', verificarToken, async (req, res) => {
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
