-- =========================================================================
-- SCRIPT DE CORRECCIÓN: Migrar ENUMs con Vistas y Defaults
-- =========================================================================

-- Inicia una transacción. Si algo falla, todo se revierte.
BEGIN;

-- PASO 1: Eliminar temporalmente las vistas que causan el bloqueo
DROP VIEW IF EXISTS v_mis_reservas;
DROP VIEW IF EXISTS v_estadisticas_reservas;

-- PASO 2: Crear los NUEVOS tipos de ENUM (sin acentos)
CREATE TYPE tipo_vehiculo_enum_v2 AS ENUM ('AUTOMOVIL', 'MOTOCICLETA', 'ELECTRICO');
CREATE TYPE tipo_cajon_enum_v2 AS ENUM ('AUTOMOVIL', 'MOTOCICLETA', 'ELECTRICO', 'DISCAPACITADO');

-- PASO 3: Modificar tabla Vehiculos (esta no tiene default, está bien)
ALTER TABLE Vehiculos
    ALTER COLUMN tipo SET DATA TYPE tipo_vehiculo_enum_v2
    USING CASE tipo::text
        WHEN 'Automóvil' THEN 'AUTOMOVIL'::tipo_vehiculo_enum_v2
        WHEN 'Motocicleta' THEN 'MOTOCICLETA'::tipo_vehiculo_enum_v2
        WHEN 'Eléctrico' THEN 'ELECTRICO'::tipo_vehiculo_enum_v2
    END;

-- PASO 4: Modificar tabla CajonesEstacionamiento (¡LA QUE FALLÓ!)
-- 4a. Eliminar el default antiguo (que usa 'Automóvil' con acento)
ALTER TABLE CajonesEstacionamiento ALTER COLUMN tipo DROP DEFAULT;

-- 4b. Cambiar el tipo de dato, traduciendo los valores
ALTER TABLE CajonesEstacionamiento
    ALTER COLUMN tipo SET DATA TYPE tipo_cajon_enum_v2
    USING CASE tipo::text
        WHEN 'Automóvil' THEN 'AUTOMOVIL'::tipo_cajon_enum_v2
        WHEN 'Motocicleta' THEN 'MOTOCICLETA'::tipo_cajon_enum_v2
        WHEN 'Eléctrico' THEN 'ELECTRICO'::tipo_cajon_enum_v2
        WHEN 'Discapacitado' THEN 'DISCAPACITADO'::tipo_cajon_enum_v2
    END;

-- PASO 5: Eliminar los ANTIGUOS tipos de ENUM con acentos
DROP TYPE IF EXISTS tipo_vehiculo_enum;
DROP TYPE IF EXISTS tipo_cajon_enum;

-- PASO 6: Renombrar los nuevos tipos a los nombres originales
ALTER TYPE tipo_vehiculo_enum_v2 RENAME TO tipo_vehiculo_enum;
ALTER TYPE tipo_cajon_enum_v2 RENAME TO tipo_cajon_enum;

-- PASO 7: Volver a añadir el default, ahora sin acento y con el tipo renombrado
ALTER TABLE CajonesEstacionamiento ALTER COLUMN tipo SET DEFAULT 'AUTOMOVIL'::tipo_cajon_enum;

-- PASO 8: Volver a crear las vistas que eliminamos
-- (Usando la definición que me diste)
CREATE OR REPLACE VIEW v_mis_reservas AS
SELECT 
    r.id_reserva,
    r.codigo_acceso,
    r.estado,
    r.fecha_inicio_reserva,
    r.fecha_fin_reserva,
    r.duracion_comprada_minutos,
    r.monto_total,
    r.fecha_creacion,
    
    -- Info del cajón
    c.numero_cajon,
    c.ubicacion_piso,
    c.tipo AS tipo_cajon,
    
    -- Info del vehículo
    v.placa,
    v.tipo AS tipo_vehiculo,
    v.marca,
    v.modelo,
    
    -- Info del usuario
    u.nombre AS nombre_usuario,
    u.apellido,
    u.email,
    
    -- Cálculos útiles
    CASE 
        WHEN r.estado = 'PENDIENTE' AND NOW() < r.fecha_inicio_reserva THEN 'FUTURA'
        WHEN r.estado = 'PENDIENTE' AND NOW() BETWEEN r.fecha_inicio_reserva AND r.fecha_fin_reserva THEN 'LISTA_PARA_ESCANEAR'
        WHEN r.estado = 'PENDIENTE' AND NOW() > r.fecha_fin_reserva THEN 'EXPIRADA'
        ELSE r.estado::TEXT
    END AS estado_visual,
    
    EXTRACT(EPOCH FROM (r.fecha_fin_reserva - NOW())) / 60 AS minutos_restantes_ventana
    
FROM ReservasAnticipadas r
JOIN usuarios u ON r.id_usuario = u.id_usuario
JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
JOIN cajonesestacionamiento c ON r.id_cajon = c.id_cajon
WHERE r.estado IN ('PENDIENTE', 'ACTIVA')
ORDER BY r.fecha_inicio_reserva;

COMMENT ON VIEW v_mis_reservas IS 'Vista de reservas activas con información completa para mostrar al usuario';

-- (Re-creando la otra vista también, por si acaso)
CREATE OR REPLACE VIEW v_estadisticas_reservas AS
SELECT 
    COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS reservas_pendientes,
    COUNT(*) FILTER (WHERE estado = 'ACTIVA') AS reservas_activas,
    COUNT(*) FILTER (WHERE estado = 'COMPLETADA') AS reservas_completadas,
    COUNT(*) FILTER (WHERE estado = 'EXPIRADA') AS reservas_expiradas,
    COUNT(*) FILTER (WHERE estado = 'CANCELADA') AS reservas_canceladas,
    
    ROUND(
        COUNT(*) FILTER (WHERE estado IN ('ACTIVA', 'COMPLETADA'))::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) AS tasa_uso_porcentaje,
    
    SUM(monto_total) FILTER (WHERE estado IN ('ACTIVA', 'COMPLETADA')) AS ingresos_totales,
    AVG(duracion_comprada_minutos) FILTER (WHERE estado IN ('ACTIVA', 'COMPLETADA')) AS duracion_promedio_minutos
    
FROM ReservasAnticipadas
WHERE fecha_creacion >= NOW() - INTERVAL '30 days';

COMMENT ON VIEW v_estadisticas_reservas IS 'Estadísticas de reservas de los últimos 30 días';

-- Finaliza la transacción y aplica todos los cambios.
COMMIT;