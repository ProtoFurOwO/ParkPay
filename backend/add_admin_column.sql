-- Agregar columna es_admin a la tabla Usuarios
-- Esto permite identificar administradores sin crear tabla separada
-- Mantiene la normalización de la base de datos

ALTER TABLE Usuarios 
ADD COLUMN es_admin BOOLEAN DEFAULT FALSE;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;
