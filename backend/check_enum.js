const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkEnum() {
  try {
    // Verificar valores del enum estado_cajon_enum
    const enumQuery = await pool.query(`
      SELECT unnest(enum_range(NULL::estado_cajon_enum)) as enum_value
    `);
    
    console.log('📋 Valores permitidos en estado_cajon_enum:');
    enumQuery.rows.forEach(row => {
      console.log(`   - ${row.enum_value}`);
    });

    // Verificar estructura de la tabla cajonesestacionamiento
    const tableQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cajonesestacionamiento'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estructura de cajonesestacionamiento:');
    tableQuery.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Verificar datos actuales
    const dataQuery = await pool.query(`
      SELECT id_cajon, numero_cajon, tipo, estado, COUNT(*)
      FROM cajonesestacionamiento 
      GROUP BY id_cajon, numero_cajon, tipo, estado
      LIMIT 5
    `);
    
    console.log('\n📋 Muestra de datos actuales:');
    dataQuery.rows.forEach(row => {
      console.log(`   - Cajón ${row.numero_cajon}: ${row.tipo} - ${row.estado}`);
    });

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('📍 Stack:', error.stack);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkEnum();