const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTipoVehiculoEnum() {
  try {
    // Verificar valores del enum tipo_vehiculo_enum
    const enumQuery = await pool.query(`
      SELECT unnest(enum_range(NULL::tipo_vehiculo_enum)) as enum_value
    `);
    
    console.log('📋 Valores permitidos en tipo_vehiculo_enum:');
    enumQuery.rows.forEach(row => {
      console.log(`   - "${row.enum_value}"`);
    });

    // Verificar datos actuales en vehiculos
    const vehiculosQuery = await pool.query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM vehiculos 
      GROUP BY tipo
      ORDER BY cantidad DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Tipos de vehículos existentes en BD:');
    vehiculosQuery.rows.forEach(row => {
      console.log(`   - "${row.tipo}": ${row.cantidad} vehículos`);
    });

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('📍 Stack:', error.stack);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkTipoVehiculoEnum();