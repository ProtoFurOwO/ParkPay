-- =========================================================================
-- ACTUALIZAR CAJONES EXISTENTES A LOS NUEVOS VALORES ENUM
-- =========================================================================
-- Este script actualiza los cajones que ya tienen valores antiguos
-- a los nuevos valores del ENUM sin acentos

BEGIN;

-- Ver qué valores tienen actualmente los cajones
SELECT DISTINCT tipo, COUNT(*) as cantidad
FROM CajonesEstacionamiento
GROUP BY tipo;

-- Actualizar todos los cajones con valores antiguos a nuevos valores
-- IMPORTANTE: Esto actualiza directamente sin validación de ENUM porque 
-- ya cambiamos el tipo de columna en el script anterior

UPDATE CajonesEstacionamiento
SET tipo = 'AUTOMOVIL'
WHERE tipo::text IN ('Automóvil', 'Normal', 'Automovil');

UPDATE CajonesEstacionamiento
SET tipo = 'MOTOCICLETA'
WHERE tipo::text IN ('Motocicleta', 'Moto');

UPDATE CajonesEstacionamiento
SET tipo = 'ELECTRICO'
WHERE tipo::text IN ('Eléctrico', 'Electrico');

UPDATE CajonesEstacionamiento
SET tipo = 'DISCAPACITADO'
WHERE tipo::text = 'Discapacitado';

-- Verificar los cambios
SELECT DISTINCT tipo, COUNT(*) as cantidad
FROM CajonesEstacionamiento
GROUP BY tipo;

-- Mostrar todos los cajones actualizados
SELECT id_cajon, numero_cajon, tipo, estado
FROM CajonesEstacionamiento
ORDER BY numero_cajon
LIMIT 20;

COMMIT;

-- =========================================================================
-- TAMBIÉN ACTUALIZAR VEHÍCULOS SI ES NECESARIO
-- =========================================================================

BEGIN;

-- Ver valores actuales de vehículos
SELECT DISTINCT tipo, COUNT(*) as cantidad
FROM Vehiculos
GROUP BY tipo;

-- Actualizar vehículos
UPDATE Vehiculos
SET tipo = 'AUTOMOVIL'
WHERE tipo::text IN ('Automóvil', 'Automovil');

UPDATE Vehiculos
SET tipo = 'MOTOCICLETA'
WHERE tipo::text = 'Motocicleta';

UPDATE Vehiculos
SET tipo = 'ELECTRICO'
WHERE tipo::text IN ('Eléctrico', 'Electrico');

-- Verificar
SELECT DISTINCT tipo, COUNT(*) as cantidad
FROM Vehiculos
GROUP BY tipo;

COMMIT;
