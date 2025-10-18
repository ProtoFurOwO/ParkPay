// Script para probar la conexión a PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Probando conexión a PostgreSQL...\n');

// Mostrar configuración
console.log('📋 Configuración:');
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_PORT:', process.env.DB_PORT);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? `***${process.env.DB_PASSWORD.slice(-3)}` : 'NO DEFINIDA');
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testConnection() {
  try {
    console.log('🔌 Intentando conectar...');
    const client = await pool.connect();
    console.log('✅ ¡Conexión exitosa!');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('\n📅 Fecha del servidor:', result.rows[0].now);
    console.log('📦 Versión de PostgreSQL:', result.rows[0].version);
    
    // Verificar que exista la base de datos
    const dbCheck = await client.query('SELECT current_database()');
    console.log('🗄️  Base de datos actual:', dbCheck.rows[0].current_database);
    
    // Verificar tablas
    const tablesCheck = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\n📊 Tablas encontradas:');
    if (tablesCheck.rows.length > 0) {
      tablesCheck.rows.forEach(row => {
        console.log('   ✓', row.tablename);
      });
    } else {
      console.log('   ⚠️  No hay tablas. Ejecuta init_db.sql');
    }
    
    client.release();
    console.log('\n🎉 Todo funciona correctamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('\n🔧 Soluciones posibles:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Verifica el usuario y contraseña en .env');
    console.error('   3. Verifica que la base de datos park_pay_db exista');
    console.error('   4. Si la contraseña tiene caracteres especiales (#, $, etc.), prueba cambiarla temporalmente');
    process.exit(1);
  }
}

testConnection();
