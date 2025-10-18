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
      // Configuración para Supabase (requiere SSL)
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Supabase usa certificados autofirmados
      }
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
