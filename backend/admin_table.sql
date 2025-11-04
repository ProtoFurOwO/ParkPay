-- Script para agregar tabla de Administradores
-- Este debe ejecutarse DESPUÉS de base postgre.sql

-- Crear tabla de Administradores
CREATE TABLE IF NOT EXISTS Administradores (
  id_admin SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP
);

COMMENT ON TABLE Administradores IS 'Almacena los usuarios administradores del sistema';
COMMENT ON COLUMN Administradores.username IS 'Nombre de usuario único para login';
COMMENT ON COLUMN Administradores.ultimo_acceso IS 'Última vez que ingresó al panel';

-- Verificar que se creó correctamente
SELECT 'Tabla Administradores creada' as mensaje;

-- Ver estructura
\d Administradores

-- Verificar que no haya administradores (primera vez)
SELECT COUNT(*) as total_admins FROM Administradores;
