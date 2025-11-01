const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 🔥 DEPLOY FIX v2.1 - JWT SECURITY ENABLED

const app = express();
const PORT = process.env.PORT || 3000;

// 🚀 CONFIGURACIÓN PARA RENDER (PROXY TRUST)
app.set('trust proxy', 1); // Confiar en primer proxy (necesario para Render)

// 🛡️ SEGURIDAD ANTI-BURP SUITE
// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP cada 15 min
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Rate limit exceeded. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para admin
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos  
  max: 50, // Máximo 50 requests admin por IP cada 5 min
  message: {
    error: 'Rate limit admin excedido',
    message: 'Too many admin requests. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para login (anti brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP cada 15 min
  message: {
    error: 'Demasiados intentos de login',
    message: 'Too many login attempts. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(generalLimiter); // Rate limiting global

// 🌐 CONFIGURACIÓN CORS ESPECÍFICA PARA CREDENTIALS
app.use(cors({
  origin: [
    'https://parkpay.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500' // Live Server
  ],
  credentials: true, // Permitir credentials (cookies, auth headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Request-Nonce', 
    'X-Request-Time', 
    'X-Request-Source'
  ]
}));

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

app.use('/api/auth', loginLimiter, authRoutes); // Rate limiting para login
app.use('/api/cajones', cajonesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminLimiter, adminRoutes); // Rate limiting para admin
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

// Iniciar servidor - 🚀 RENDER COMPATIBLE
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Disponible en todas las interfaces (0.0.0.0:${PORT})`);
});
