-- Script para crear un ticket "viejo" para probar tiempo extra
-- Ejecutar en Supabase SQL Editor

-- 1. Obtener tu id_usuario (reemplaza con tu email)
SELECT id_usuario, nombre, email FROM usuarios WHERE email = 'tu_email@ejemplo.com';
-- Copia el id_usuario que te da

-- 2. Obtener un vehículo tuyo
SELECT id_vehiculo, placa FROM vehiculos WHERE id_usuario = TU_ID_USUARIO;
-- Copia el id_vehiculo

-- 3. Buscar un cajón disponible
SELECT id_cajon, numero_cajon, ubicacion_piso 
FROM cajonesestacionamiento 
WHERE estado = 'Disponible' 
LIMIT 1;
-- Copia el id_cajon

-- 4. CREAR TICKET VIEJO (ajusta fecha_hora_entrada para que sea hace 5+ horas)
INSERT INTO ticketsestancia (
    id_vehiculo,
    id_cajon,
    codigo_acceso,
    fecha_hora_entrada,
    estado,
    tiempo_comprado_minutos,
    monto_pagado
) VALUES (
    ID_VEHICULO,  -- ⬅️ Reemplaza con tu id_vehiculo
    ID_CAJON,     -- ⬅️ Reemplaza con el id_cajon
    'TICKET-VIEJO-TEST',
    NOW() - INTERVAL '5 hours',  -- ⬅️ Ticket de hace 5 horas
    'ACTIVO',
    120,  -- 2 horas pagadas
    50.00
);

-- 5. Marcar el cajón como ocupado
UPDATE cajonesestacionamiento 
SET estado = 'Ocupado' 
WHERE id_cajon = ID_CAJON;  -- ⬅️ Reemplaza con el id_cajon

-- 6. VERIFICAR que se creó correctamente
SELECT 
    t.id_ticket,
    t.codigo_acceso,
    t.fecha_hora_entrada,
    t.tiempo_comprado_minutos,
    t.estado,
    v.placa,
    c.numero_cajon,
    EXTRACT(EPOCH FROM (NOW() - t.fecha_hora_entrada)) / 3600 as horas_transcurridas
FROM ticketsestancia t
JOIN vehiculos v ON t.id_vehiculo = v.id_vehiculo
JOIN cajonesestacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.codigo_acceso = 'TICKET-VIEJO-TEST';

-- 7. Para probarlo, usa el código: TICKET-VIEJO-TEST en salida.html
-- Debería cobrar 3 horas extra (5 horas usadas - 2 horas pagadas)
