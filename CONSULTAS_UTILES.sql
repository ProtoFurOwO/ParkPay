-- ═══════════════════════════════════════════════════════════════════
--  CONSULTAS ÚTILES - ParkPay Sistema de Estacionamiento
-- ═══════════════════════════════════════════════════════════════════

-- 📊 VERIFICAR DATOS INICIALES
-- ═══════════════════════════════════════════════════════════════════

-- Ver todas las tarifas
SELECT * FROM Tarifas;
-- Debe mostrar 3 tarifas (Normal, Premium, Económica)

-- Ver todos los cajones
SELECT 
    numero_cajon, 
    ubicacion_piso, 
    tipo, 
    estado,
    (SELECT descripcion FROM Tarifas WHERE id_tarifa = CajonesEstacionamiento.id_tarifa) as tarifa
FROM CajonesEstacionamiento
ORDER BY ubicacion_piso, numero_cajon;
-- Debe mostrar 30 cajones (15 por piso)

-- Contar cajones por piso
SELECT ubicacion_piso, COUNT(*) as total
FROM CajonesEstacionamiento
GROUP BY ubicacion_piso;
-- Piso A: 15, Piso B: 15

-- Contar cajones por estado
SELECT estado, COUNT(*) as total
FROM CajonesEstacionamiento
GROUP BY estado;


-- 👥 CONSULTAS DE USUARIOS
-- ═══════════════════════════════════════════════════════════════════

-- Ver todos los usuarios registrados
SELECT 
    id_usuario,
    nombre,
    apellido,
    email,
    fecha_registro
FROM Usuarios
ORDER BY fecha_registro DESC;

-- Ver usuarios con sus vehículos
SELECT 
    u.id_usuario,
    u.nombre || ' ' || u.apellido as nombre_completo,
    u.email,
    v.placa,
    v.marca,
    v.modelo,
    v.color
FROM Usuarios u
LEFT JOIN Vehiculos v ON u.id_usuario = v.id_usuario
ORDER BY u.id_usuario;

-- Contar usuarios y vehículos
SELECT 
    (SELECT COUNT(*) FROM Usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM Vehiculos) as total_vehiculos;


-- 🚗 CONSULTAS DE CAJONES
-- ═══════════════════════════════════════════════════════════════════

-- Ver cajones disponibles del Piso A
SELECT 
    numero_cajon,
    tipo,
    t.descripcion as tarifa,
    t.costo_por_hora
FROM CajonesEstacionamiento c
INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
WHERE ubicacion_piso = 'Piso A' AND estado = 'Disponible'
ORDER BY numero_cajon;

-- Ver cajones disponibles del Piso B
SELECT 
    numero_cajon,
    tipo,
    t.descripcion as tarifa,
    t.costo_por_hora
FROM CajonesEstacionamiento c
INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
WHERE ubicacion_piso = 'Piso B' AND estado = 'Disponible'
ORDER BY numero_cajon;

-- Ver cajones ocupados con información del ticket
SELECT 
    c.numero_cajon,
    c.ubicacion_piso,
    v.placa,
    u.nombre || ' ' || u.apellido as cliente,
    t.fecha_hora_entrada,
    t.codigo_acceso
FROM CajonesEstacionamiento c
INNER JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon AND t.estado = 'ACTIVO'
INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
WHERE c.estado = 'Ocupado'
ORDER BY c.ubicacion_piso, c.numero_cajon;

-- Resumen de ocupación
SELECT 
    ubicacion_piso,
    COUNT(*) as total,
    SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
    SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) as ocupados,
    ROUND(SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_ocupacion
FROM CajonesEstacionamiento
GROUP BY ubicacion_piso;


-- 🎫 CONSULTAS DE TICKETS
-- ═══════════════════════════════════════════════════════════════════

-- Ver todos los tickets activos
SELECT 
    t.id_ticket,
    t.codigo_acceso,
    u.nombre || ' ' || u.apellido as cliente,
    v.placa,
    c.numero_cajon,
    c.ubicacion_piso,
    t.fecha_hora_entrada,
    EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - t.fecha_hora_entrada)) as horas_transcurridas,
    tar.costo_por_hora,
    ROUND(EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - t.fecha_hora_entrada)) * tar.costo_por_hora, 2) as costo_actual
FROM TicketsEstancia t
INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
INNER JOIN Tarifas tar ON c.id_tarifa = tar.id_tarifa
WHERE t.estado = 'ACTIVO'
ORDER BY t.fecha_hora_entrada DESC;

-- Ver historial completo de tickets
SELECT 
    t.id_ticket,
    u.nombre || ' ' || u.apellido as cliente,
    v.placa,
    c.numero_cajon,
    t.fecha_hora_entrada,
    t.fecha_hora_salida,
    t.monto_cobrado,
    t.estado
FROM TicketsEstancia t
INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
INNER JOIN Usuarios u ON v.id_usuario = u.id_usuario
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
ORDER BY t.fecha_hora_entrada DESC;

-- Tickets de un usuario específico (reemplaza 1 con el id_usuario)
SELECT 
    t.id_ticket,
    t.codigo_acceso,
    v.placa,
    c.numero_cajon,
    c.ubicacion_piso,
    t.fecha_hora_entrada,
    t.fecha_hora_salida,
    t.monto_cobrado,
    t.estado
FROM TicketsEstancia t
INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE v.id_usuario = 1
ORDER BY t.fecha_hora_entrada DESC;

-- Estadísticas de tickets
SELECT 
    COUNT(*) as total_tickets,
    SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN estado = 'PAGADO' THEN 1 ELSE 0 END) as pagados,
    SUM(CASE WHEN estado = 'FINALIZADO' THEN 1 ELSE 0 END) as finalizados
FROM TicketsEstancia;


-- 💰 CONSULTAS FINANCIERAS
-- ═══════════════════════════════════════════════════════════════════

-- Total recaudado histórico
SELECT 
    SUM(monto_cobrado) as total_recaudado,
    COUNT(*) as tickets_pagados,
    AVG(monto_cobrado) as promedio_por_ticket
FROM TicketsEstancia
WHERE estado = 'PAGADO';

-- Recaudación por día (últimos 7 días)
SELECT 
    DATE(fecha_hora_salida) as fecha,
    COUNT(*) as tickets,
    SUM(monto_cobrado) as total
FROM TicketsEstancia
WHERE estado = 'PAGADO' 
  AND fecha_hora_salida >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_hora_salida)
ORDER BY fecha DESC;

-- Top 5 usuarios que más han gastado
SELECT 
    u.nombre || ' ' || u.apellido as cliente,
    u.email,
    COUNT(*) as total_tickets,
    SUM(t.monto_cobrado) as total_gastado
FROM Usuarios u
INNER JOIN Vehiculos v ON u.id_usuario = v.id_usuario
INNER JOIN TicketsEstancia t ON v.id_vehiculo = t.id_vehiculo
WHERE t.estado = 'PAGADO'
GROUP BY u.id_usuario, u.nombre, u.apellido, u.email
ORDER BY total_gastado DESC
LIMIT 5;


-- 🔧 OPERACIONES DE MANTENIMIENTO
-- ═══════════════════════════════════════════════════════════════════

-- Liberar un cajón ocupado (usar solo si hay error)
-- UPDATE CajonesEstacionamiento 
-- SET estado = 'Disponible' 
-- WHERE numero_cajon = 'A-01';

-- Cancelar un ticket activo (usar solo si hay error)
-- UPDATE TicketsEstancia 
-- SET estado = 'FINALIZADO',
--     fecha_hora_salida = CURRENT_TIMESTAMP,
--     monto_cobrado = 0
-- WHERE id_ticket = 1;

-- Liberar TODOS los cajones (CUIDADO: solo en desarrollo)
-- UPDATE CajonesEstacionamiento 
-- SET estado = 'Disponible' 
-- WHERE estado = 'Ocupado';

-- Poner un cajón en mantenimiento
-- UPDATE CajonesEstacionamiento 
-- SET estado = 'Mantenimiento' 
-- WHERE numero_cajon = 'A-01';


-- 🔍 CONSULTAS DE DEPURACIÓN
-- ═══════════════════════════════════════════════════════════════════

-- Verificar integridad: Tickets activos vs Cajones ocupados
-- Los números deben coincidir
SELECT 
    'Tickets ACTIVOS' as tipo,
    COUNT(*) as total
FROM TicketsEstancia
WHERE estado = 'ACTIVO'
UNION ALL
SELECT 
    'Cajones OCUPADOS' as tipo,
    COUNT(*) as total
FROM CajonesEstacionamiento
WHERE estado = 'Ocupado';

-- Buscar inconsistencias: Cajones ocupados sin ticket activo
SELECT 
    c.id_cajon,
    c.numero_cajon,
    c.estado
FROM CajonesEstacionamiento c
LEFT JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon AND t.estado = 'ACTIVO'
WHERE c.estado = 'Ocupado' 
  AND t.id_ticket IS NULL;

-- Buscar inconsistencias: Tickets activos en cajones disponibles
SELECT 
    t.id_ticket,
    c.numero_cajon,
    c.estado,
    t.estado
FROM TicketsEstancia t
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'ACTIVO' 
  AND c.estado != 'Ocupado';


-- 📈 REPORTES Y ESTADÍSTICAS
-- ═══════════════════════════════════════════════════════════════════

-- Uso de cajones por tipo
SELECT 
    tipo,
    COUNT(*) as total_cajones,
    SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) as ocupados,
    ROUND(SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_uso
FROM CajonesEstacionamiento
GROUP BY tipo
ORDER BY porcentaje_uso DESC;

-- Cajones más utilizados
SELECT 
    c.numero_cajon,
    c.ubicacion_piso,
    c.tipo,
    COUNT(t.id_ticket) as veces_usado
FROM CajonesEstacionamiento c
LEFT JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon
GROUP BY c.id_cajon, c.numero_cajon, c.ubicacion_piso, c.tipo
ORDER BY veces_usado DESC
LIMIT 10;

-- Tiempo promedio de estacionamiento
SELECT 
    AVG(EXTRACT(EPOCH FROM (fecha_hora_salida - fecha_hora_entrada))/3600) as promedio_horas,
    MIN(EXTRACT(EPOCH FROM (fecha_hora_salida - fecha_hora_entrada))/3600) as minimo_horas,
    MAX(EXTRACT(EPOCH FROM (fecha_hora_salida - fecha_hora_entrada))/3600) as maximo_horas
FROM TicketsEstancia
WHERE estado = 'PAGADO' AND fecha_hora_salida IS NOT NULL;


-- 🧹 LIMPIAR DATOS DE PRUEBA (USAR CON CUIDADO)
-- ═══════════════════════════════════════════════════════════════════

-- Eliminar TODOS los tickets
-- TRUNCATE TABLE TicketsEstancia RESTART IDENTITY CASCADE;

-- Eliminar TODOS los vehículos y usuarios
-- TRUNCATE TABLE Vehiculos, Usuarios RESTART IDENTITY CASCADE;

-- Resetear estados de cajones
-- UPDATE CajonesEstacionamiento SET estado = 'Disponible';

-- RESET COMPLETO (ejecutar en orden)
-- TRUNCATE TABLE TicketsEstancia RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE Vehiculos RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE Usuarios RESTART IDENTITY CASCADE;
-- UPDATE CajonesEstacionamiento SET estado = 'Disponible';


-- ═══════════════════════════════════════════════════════════════════
--  FIN DE CONSULTAS ÚTILES
-- ═══════════════════════════════════════════════════════════════════

-- 💡 TIPS:
-- 1. Ejecuta estas consultas en pgAdmin o psql
-- 2. Usa las consultas de verificación después de cada operación
-- 3. Los comandos comentados (--) son para casos especiales
-- 4. Guarda esta hoja como referencia rápida
