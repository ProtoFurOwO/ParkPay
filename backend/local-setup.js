const pool = require('./config/database');

// Configuración específica para desarrollo local
const LOCAL_CONFIG = {
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:8080',
    LOG_LEVEL: 'debug',
    ENABLE_DETAILED_LOGS: true
};

async function setupLocalDevelopment() {
    console.log('🔧 Configurando entorno de desarrollo local...');
    
    try {
        // Test de conexión a BD
        const result = await pool.query('SELECT NOW() as tiempo_servidor');
        console.log('✅ Conexión a BD exitosa:', result.rows[0].tiempo_servidor);
        
        // Verificar que las tablas principales existen
        const tablas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('usuarios', 'vehiculos', 'cajonesestacionamiento', 'reservas', 'ticketsestancia')
            ORDER BY table_name;
        `);
        
        console.log('📋 Tablas encontradas:');
        tablas.rows.forEach(tabla => {
            console.log(`   ✓ ${tabla.table_name}`);
        });
        
        console.log('\n🚀 Entorno local listo!');
        console.log('   Backend: http://localhost:3000');
        console.log('   Health: http://localhost:3000/api/health');
        
    } catch (error) {
        console.error('❌ Error configurando entorno local:', error.message);
    }
}

module.exports = { LOCAL_CONFIG, setupLocalDevelopment };

// Si se ejecuta directamente, correr setup
if (require.main === module) {
    setupLocalDevelopment();
}