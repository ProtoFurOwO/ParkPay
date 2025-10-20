const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const cajonesRoutes = require('./routes/cajones');
const ticketsRoutes = require('./routes/tickets');
const usuariosRoutes = require('./routes/usuarios');
const syncRoutes = require('./routes/sync');
const adminRoutes = require('./routes/admin');
const reservasRoutes = require('./routes/reservas');
const healthRoutes = require('./routes/health');

app.use('/api/auth', authRoutes);
app.use('/api/cajones', cajonesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/health', healthRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🚗 API ParkPay funcionando correctamente',
    endpoints: {
      auth: '/api/auth',
      cajones: '/api/cajones',
      tickets: '/api/tickets',
      usuarios: '/api/usuarios',
      sync: '/api/sync',
      admin: '/api/admin',
      reservas: '/api/reservas',
      health: '/api/health'
    }
  });
});

// Health Check endpoint para monitoreo
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ParkPay API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Verificar conexión a base de datos
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const dbCheck = await pool.query('SELECT NOW()');
    healthCheck.database = {
      status: 'connected',
      responseTime: dbCheck.duration || 'N/A',
      timestamp: dbCheck.rows[0].now
    };

    await pool.end();

    // Verificar servicios externos
    healthCheck.externalServices = {
      sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured',
      frontend: 'https://parkpay.vercel.app'
    };

    // Verificar memoria
    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.database = {
      status: 'disconnected',
      error: error.message
    };
    res.status(503).json(healthCheck);
  }
});

// Health Check simple (para Render/Vercel)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
