const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createGuestUser() {
  try {
    // Verificar si ya existe el usuario GUEST
    const existingUser = await pool.query(`
      SELECT id_usuario FROM usuarios WHERE email = 'guest@parkpay.system'
    `);

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuario GUEST ya existe:', existingUser.rows[0].id_usuario);
      return existingUser.rows[0].id_usuario;
    }

    // Crear usuario GUEST
    const guestUser = await pool.query(`
      INSERT INTO usuarios (
        nombre, 
        apellido, 
        email, 
        password_hash,
        fecha_registro
      ) VALUES (
        'GUEST', 
        'USER', 
        'guest@parkpay.system', 
        'NO_PASSWORD_REQUIRED',
        NOW()
      ) RETURNING id_usuario
    `);

    const idUsuarioGuest = guestUser.rows[0].id_usuario;
    console.log('✅ Usuario GUEST creado exitosamente:', idUsuarioGuest);
    
    return idUsuarioGuest;

  } catch (error) {
    console.error('💥 Error al crear usuario GUEST:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createGuestUser().then(id => {
  console.log('🎯 ID del usuario GUEST para usar en código:', id);
  process.exit(0);
}).catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});