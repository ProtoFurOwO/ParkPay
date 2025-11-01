const pool = require('./config/database');

async function checkTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'vehiculos' 
            ORDER BY ordinal_position
        `);
        
        console.log('Columnas de tabla Vehiculos:');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // También veamos algunos datos de ejemplo
        const vehiculos = await pool.query('SELECT * FROM vehiculos LIMIT 5');
        console.log('\nEjemplos de vehículos:');
        vehiculos.rows.forEach(v => console.log(v));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTable();