const { Pool } = require('pg');
require('dotenv').config();

// ========================================
// CONFIGURACIÓN SUPABASE (CLOUD)
// ========================================

// Detectar si estamos usando Supabase (tiene DATABASE_URL) o local
const isSupabase = !!process.env.DATABASE_URL;

// Debug: Mostrar configuración
if (isSupabase) {
  console.log('☁️  Conectando a SUPABASE...');
  console.log('   Host:', process.env.DB_HOST);
  console.log('   Database:', process.env.DB_NAME);
  console.log('   User:', process.env.DB_USER);
} else {
  console.log('🏠 Conectando a PostgreSQL LOCAL...');
  console.log('   Host:', process.env.DB_HOST);
  console.log('   Port:', process.env.DB_PORT);
  console.log('   Database:', process.env.DB_NAME);
  console.log('   User:', process.env.DB_USER);
}

// Configuración del pool
const poolConfig = isSupabase 
  ? {
      // Configuración DIRECTA para Supabase (más confiable que connectionString)
      host: 'aws-1-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres', 
      user: 'postgres.pksregqvhbfnlxpjhglc',
      password: 'Timeshirt#21', // Sin encoding aquí
      ssl: {
        rejectUnauthorized: false
      },
      // Configuración optimizada para Render + Supabase
      max: 5, // Reducido para evitar límites
      min: 1, // Mantener mínimo 1 conexión
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000, // Aumentado para Render
      acquireTimeoutMillis: 30000, // Tiempo para obtener conexión
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  : {
      // Configuración para Local (sin SSL)
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  if (isSupabase) {
    console.log('✅ Conectado a SUPABASE exitosamente');
  } else {
    console.log('✅ Conectado a PostgreSQL LOCAL');
  }
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a la base de datos:', err.message);
});

// Verificar conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error al verificar conexión:', err.message);
  } else {
    console.log('⏰ Servidor de BD:', res.rows[0].now);
  }
});

module.exports = pool;
