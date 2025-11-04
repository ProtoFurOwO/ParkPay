const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Health Check Completo
router.get('/', async (req, res) => {
    const startTime = Date.now();
    
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ParkPay Backend API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {}
    };

    try {
        // 1. Check de Sistema
        healthStatus.checks.system = {
            status: 'pass',
            uptime: formatUptime(process.uptime()),
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            platform: process.platform,
            cpuUsage: process.cpuUsage(),
            pid: process.pid
        };

        // 2. Check de Memoria
        const memory = process.memoryUsage();
        healthStatus.checks.memory = {
            status: 'pass',
            heapUsed: formatBytes(memory.heapUsed),
            heapTotal: formatBytes(memory.heapTotal),
            rss: formatBytes(memory.rss),
            external: formatBytes(memory.external),
            percentageUsed: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(2) + '%'
        };

        // 3. Check de Base de Datos
        try {
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });

            const dbStartTime = Date.now();
            const result = await pool.query('SELECT NOW() as time, version() as version');
            const dbEndTime = Date.now();

            healthStatus.checks.database = {
                status: 'pass',
                responseTime: `${dbEndTime - dbStartTime}ms`,
                serverTime: result.rows[0].time,
                version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
                connected: true
            };

            // Test de escritura/lectura
            await pool.query('SELECT 1');
            healthStatus.checks.database.readWrite = 'pass';

            await pool.end();
        } catch (dbError) {
            healthStatus.checks.database = {
                status: 'fail',
                error: dbError.message,
                connected: false
            };
            healthStatus.status = 'degraded';
        }

        // 4. Check de Variables de Entorno
        healthStatus.checks.environment = {
            status: 'pass',
            databaseConfigured: !!process.env.DATABASE_URL,
            sendgridConfigured: !!process.env.SENDGRID_API_KEY,
            portConfigured: !!process.env.PORT,
            nodeEnv: process.env.NODE_ENV || 'not set'
        };

        // 5. Check de Servicios Externos
        healthStatus.checks.externalServices = {
            sendgrid: {
                status: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured',
                emailFrom: process.env.SENDGRID_EMAIL_FROM || 'not set'
            },
            frontend: {
                url: 'https://parkpay.vercel.app',
                status: 'external'
            },
            database: {
                provider: 'Supabase PostgreSQL',
                status: healthStatus.checks.database.connected ? 'connected' : 'disconnected'
            }
        };

        // 6. Tiempo total de respuesta
        const totalTime = Date.now() - startTime;
        healthStatus.responseTime = `${totalTime}ms`;

        // Determinar código de estado HTTP
        const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 200 : 503;

        res.status(httpStatus).json(healthStatus);

    } catch (error) {
        healthStatus.status = 'unhealthy';
        healthStatus.error = {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
        res.status(503).json(healthStatus);
    }
});

// Health Check Simple (para load balancers)
router.get('/simple', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Liveness probe (está vivo el servidor?)
router.get('/live', (req, res) => {
    res.status(200).json({ 
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Readiness probe (está listo para recibir tráfico?)
router.get('/ready', async (req, res) => {
    try {
        // Verificar que la BD esté lista
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await pool.query('SELECT 1');
        await pool.end();

        res.status(200).json({ 
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'not ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Funciones auxiliares
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function formatBytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
}

module.exports = router;