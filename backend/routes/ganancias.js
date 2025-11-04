const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// 📊 OBTENER GANANCIAS POR PERÍODO
router.get('/:periodo', verificarToken, verificarAdmin, async (req, res) => {
    try {
        console.log('📊 GET /ganancias/:periodo - Obteniendo datos de ganancias...');
        
        const { periodo } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;
        
        let query = '';
        let params = [];
        let groupBy = '';
        let dateFormat = '';
        
        // Definir consulta según el período
        switch (periodo) {
            case 'dia':
                dateFormat = "DATE(t.fecha_hora_entrada)";
                groupBy = "DATE(t.fecha_hora_entrada)";
                query = `
                    SELECT 
                        ${dateFormat} as fecha,
                        COUNT(*) as total_tickets,
                        SUM(t.monto_cobrado) as ganancia_total,
                        AVG(t.monto_cobrado) as ganancia_promedio,
                        COUNT(CASE WHEN v.tipo = 'AUTOMOVIL' THEN 1 END) as autos,
                        COUNT(CASE WHEN v.tipo = 'MOTOCICLETA' THEN 1 END) as motos,
                        COUNT(CASE WHEN v.tipo = 'ELECTRICO' THEN 1 END) as electricos
                    FROM ticketsestancia t
                    JOIN vehiculos v ON t.id_vehiculo = v.id_vehiculo
                    WHERE t.estado = 'FINALIZADO' 
                    AND t.fecha_hora_entrada >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY ${groupBy}
                    ORDER BY fecha ASC
                    LIMIT 30
                `;
                break;
                
            case 'semana':
                dateFormat = "DATE_TRUNC('week', t.fecha_hora_entrada)";
                groupBy = "DATE_TRUNC('week', t.fecha_hora_entrada)";
                query = `
                    SELECT 
                        ${dateFormat} as fecha,
                        COUNT(*) as total_tickets,
                        SUM(t.monto_cobrado) as ganancia_total,
                        AVG(t.monto_cobrado) as ganancia_promedio,
                        COUNT(CASE WHEN v.tipo = 'AUTOMOVIL' THEN 1 END) as autos,
                        COUNT(CASE WHEN v.tipo = 'MOTOCICLETA' THEN 1 END) as motos,
                        COUNT(CASE WHEN v.tipo = 'ELECTRICO' THEN 1 END) as electricos
                    FROM ticketsestancia t
                    JOIN vehiculos v ON t.id_vehiculo = v.id_vehiculo
                    WHERE t.estado = 'FINALIZADO' 
                    AND t.fecha_hora_entrada >= CURRENT_DATE - INTERVAL '12 weeks'
                    GROUP BY ${groupBy}
                    ORDER BY fecha ASC
                    LIMIT 12
                `;
                break;
                
            case 'mes':
                dateFormat = "DATE_TRUNC('month', t.fecha_hora_entrada)";
                groupBy = "DATE_TRUNC('month', t.fecha_hora_entrada)";
                query = `
                    SELECT 
                        ${dateFormat} as fecha,
                        COUNT(*) as total_tickets,
                        SUM(t.monto_cobrado) as ganancia_total,
                        AVG(t.monto_cobrado) as ganancia_promedio,
                        COUNT(CASE WHEN v.tipo = 'AUTOMOVIL' THEN 1 END) as autos,
                        COUNT(CASE WHEN v.tipo = 'MOTOCICLETA' THEN 1 END) as motos,
                        COUNT(CASE WHEN v.tipo = 'ELECTRICO' THEN 1 END) as electricos
                    FROM ticketsestancia t
                    JOIN vehiculos v ON t.id_vehiculo = v.id_vehiculo
                    WHERE t.estado = 'FINALIZADO' 
                    AND t.fecha_hora_entrada >= CURRENT_DATE - INTERVAL '12 months'
                    GROUP BY ${groupBy}
                    ORDER BY fecha ASC
                    LIMIT 12
                `;
                break;
                
            default:
                return res.status(400).json({ error: 'Período no válido. Use: dia, semana, mes' });
        }
        
        console.log('📊 Ejecutando consulta para período:', periodo);
        const result = await pool.query(query, params);
        
        // Calcular totales generales
        const totalesQuery = `
            SELECT 
                COUNT(*) as total_tickets_general,
                SUM(t.monto_cobrado) as ganancia_total_general,
                AVG(t.monto_cobrado) as ganancia_promedio_general
            FROM ticketsestancia t
            WHERE t.estado = 'FINALIZADO'
        `;
        
        const totalesResult = await pool.query(totalesQuery);
        
        // Formatear datos para la respuesta
        const ganancias = result.rows.map(row => ({
            fecha: row.fecha,
            fecha_formateada: formatearFecha(row.fecha, periodo),
            total_tickets: parseInt(row.total_tickets),
            ganancia_total: parseFloat(row.ganancia_total || 0),
            ganancia_promedio: parseFloat(row.ganancia_promedio || 0),
            vehiculos: {
                autos: parseInt(row.autos || 0),
                motos: parseInt(row.motos || 0),
                electricos: parseInt(row.electricos || 0)
            }
        }));
        
        const totales = totalesResult.rows[0];
        
        res.json({
            periodo,
            data: ganancias,
            totales: {
                total_tickets: parseInt(totales.total_tickets_general),
                ganancia_total: parseFloat(totales.ganancia_total_general || 0),
                ganancia_promedio: parseFloat(totales.ganancia_promedio_general || 0)
            },
            resumen: {
                registros_encontrados: ganancias.length,
                ganancia_periodo: ganancias.reduce((sum, item) => sum + item.ganancia_total, 0),
                tickets_periodo: ganancias.reduce((sum, item) => sum + item.total_tickets, 0)
            }
        });
        
    } catch (error) {
        console.error('💥 Error al obtener ganancias:', error);
        res.status(500).json({ 
            error: 'Error al obtener datos de ganancias',
            details: error.message 
        });
    }
});

// 📊 OBTENER RESUMEN RÁPIDO DE GANANCIAS
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
    try {
        console.log('📊 GET /ganancias - Obteniendo resumen de ganancias...');
        
        const query = `
            SELECT 
                -- Hoy
                COUNT(CASE WHEN DATE(t.fecha_hora_entrada) = CURRENT_DATE THEN 1 END) as tickets_hoy,
                SUM(CASE WHEN DATE(t.fecha_hora_entrada) = CURRENT_DATE THEN t.monto_cobrado ELSE 0 END) as ganancias_hoy,
                
                -- Esta semana
                COUNT(CASE WHEN t.fecha_hora_entrada >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as tickets_semana,
                SUM(CASE WHEN t.fecha_hora_entrada >= DATE_TRUNC('week', CURRENT_DATE) THEN t.monto_cobrado ELSE 0 END) as ganancias_semana,
                
                -- Este mes
                COUNT(CASE WHEN t.fecha_hora_entrada >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tickets_mes,
                SUM(CASE WHEN t.fecha_hora_entrada >= DATE_TRUNC('month', CURRENT_DATE) THEN t.monto_cobrado ELSE 0 END) as ganancias_mes,
                
                -- Total general
                COUNT(*) as tickets_total,
                SUM(t.monto_cobrado) as ganancias_total
                
            FROM ticketsestancia t
            WHERE t.estado = 'FINALIZADO'
        `;
        
        const result = await pool.query(query);
        const data = result.rows[0];
        
        res.json({
            hoy: {
                tickets: parseInt(data.tickets_hoy || 0),
                ganancias: parseFloat(data.ganancias_hoy || 0)
            },
            semana: {
                tickets: parseInt(data.tickets_semana || 0),
                ganancias: parseFloat(data.ganancias_semana || 0)
            },
            mes: {
                tickets: parseInt(data.tickets_mes || 0),
                ganancias: parseFloat(data.ganancias_mes || 0)
            },
            total: {
                tickets: parseInt(data.tickets_total || 0),
                ganancias: parseFloat(data.ganancias_total || 0)
            }
        });
        
    } catch (error) {
        console.error('💥 Error al obtener resumen de ganancias:', error);
        res.status(500).json({ 
            error: 'Error al obtener resumen de ganancias',
            details: error.message 
        });
    }
});

// 🔧 FUNCIÓN AUXILIAR: Formatear fecha según período
function formatearFecha(fecha, periodo) {
    const date = new Date(fecha);
    const opciones = { timeZone: 'America/Mexico_City' };
    
    switch (periodo) {
        case 'dia':
            return date.toLocaleDateString('es-MX', { 
                ...opciones,
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
        case 'semana':
            const inicioSemana = new Date(date);
            const finSemana = new Date(date);
            finSemana.setDate(inicioSemana.getDate() + 6);
            return `${inicioSemana.toLocaleDateString('es-MX', opciones)} - ${finSemana.toLocaleDateString('es-MX', opciones)}`;
        case 'mes':
            return date.toLocaleDateString('es-MX', { 
                ...opciones,
                month: 'long', 
                year: 'numeric' 
            });
        default:
            return date.toLocaleDateString('es-MX', opciones);
    }
}

module.exports = router;
