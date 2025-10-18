-- Script para verificar y corregir el estado de los cajones

-- 1. Ver el estado actual de todos los cajones
SELECT 
    numero_cajon,
    ubicacion_piso,
    estado,
    CASE 
        WHEN estado = 'Ocupado' THEN '🔴'
        WHEN estado = 'Disponible' THEN '🟢'
        ELSE '⚠️'
    END as indicador
FROM CajonesEstacionamiento
ORDER BY ubicacion_piso, numero_cajon;

-- 2. Verificar tickets activos vs cajones ocupados
SELECT 
    'Tickets ACTIVOS' as tipo,
    COUNT(*) as cantidad
FROM TicketsEstancia
WHERE estado = 'ACTIVO'
UNION ALL
SELECT 
    'Cajones OCUPADOS' as tipo,
    COUNT(*) as cantidad
FROM CajonesEstacionamiento
WHERE estado = 'Ocupado';

-- 3. Ver cajones ocupados con información del ticket
SELECT 
    c.id_cajon,
    c.numero_cajon,
    c.ubicacion_piso,
    c.estado,
    t.id_ticket,
    t.codigo_acceso,
    t.fecha_hora_entrada,
    v.placa
FROM CajonesEstacionamiento c
LEFT JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon AND t.estado = 'ACTIVO'
LEFT JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
WHERE c.estado = 'Ocupado'
ORDER BY c.ubicacion_piso, c.numero_cajon;

-- 4. Buscar inconsistencias: Cajones ocupados SIN ticket activo
-- (Estos deberían liberarse)
SELECT 
    c.id_cajon,
    c.numero_cajon,
    c.estado,
    '⚠️ LIBERAR' as accion
FROM CajonesEstacionamiento c
LEFT JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon AND t.estado = 'ACTIVO'
WHERE c.estado = 'Ocupado' 
  AND t.id_ticket IS NULL;

-- 5. Buscar inconsistencias: Tickets activos en cajones disponibles
-- (Estos cajones deberían marcarse como ocupados)
SELECT 
    t.id_ticket,
    c.id_cajon,
    c.numero_cajon,
    c.estado as estado_cajon,
    t.estado as estado_ticket,
    '⚠️ OCUPAR' as accion
FROM TicketsEstancia t
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'ACTIVO' 
  AND c.estado != 'Ocupado';

-- ═══════════════════════════════════════════════════════════════
-- CORRECCIONES (Ejecutar solo si hay inconsistencias)
-- ═══════════════════════════════════════════════════════════════

-- A. Liberar cajones ocupados sin ticket activo
/*
UPDATE CajonesEstacionamiento c
SET estado = 'Disponible'
WHERE estado = 'Ocupado'
  AND NOT EXISTS (
    SELECT 1 FROM TicketsEstancia t 
    WHERE t.id_cajon = c.id_cajon 
    AND t.estado = 'ACTIVO'
  );
*/

-- B. Ocupar cajones que tienen tickets activos
/*
UPDATE CajonesEstacionamiento c
SET estado = 'Ocupado'
WHERE estado = 'Disponible'
  AND EXISTS (
    SELECT 1 FROM TicketsEstancia t 
    WHERE t.id_cajon = c.id_cajon 
    AND t.estado = 'ACTIVO'
  );
*/

-- C. Corregir AMBAS inconsistencias de una vez
/*
BEGIN;

-- Liberar cajones sin tickets
UPDATE CajonesEstacionamiento c
SET estado = 'Disponible'
WHERE estado = 'Ocupado'
  AND NOT EXISTS (
    SELECT 1 FROM TicketsEstancia t 
    WHERE t.id_cajon = c.id_cajon 
    AND t.estado = 'ACTIVO'
  );

-- Ocupar cajones con tickets activos
UPDATE CajonesEstacionamiento c
SET estado = 'Ocupado'
WHERE estado = 'Disponible'
  AND EXISTS (
    SELECT 1 FROM TicketsEstancia t 
    WHERE t.id_cajon = c.id_cajon 
    AND t.estado = 'ACTIVO'
  );

COMMIT;
*/

-- D. Ver el resultado después de la corrección
SELECT 
    numero_cajon,
    ubicacion_piso,
    estado,
    CASE 
        WHEN estado = 'Ocupado' THEN '🔴'
        WHEN estado = 'Disponible' THEN '🟢'
        ELSE '⚠️'
    END as indicador
FROM CajonesEstacionamiento
ORDER BY ubicacion_piso, numero_cajon;
