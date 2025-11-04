-- Agregar columnas para sistema de tiempo extra y multas
-- Ejecutar en Supabase SQL Editor

-- Primero agregar horas_estimadas si no existe
ALTER TABLE TicketsEstancia 
ADD COLUMN IF NOT EXISTS horas_estimadas NUMERIC(4,2) DEFAULT 2.00;

-- Agregar las nuevas columnas
ALTER TABLE TicketsEstancia 
ADD COLUMN IF NOT EXISTS tiempo_extra_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_extra NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS fecha_salida_estimada TIMESTAMP;

-- Actualizar tickets existentes con horas_estimadas default
UPDATE TicketsEstancia 
SET horas_estimadas = 2.00
WHERE horas_estimadas IS NULL;

-- Actualizar tickets activos con fecha_salida_estimada
UPDATE TicketsEstancia 
SET fecha_salida_estimada = fecha_hora_entrada + (horas_estimadas || ' hours')::INTERVAL
WHERE fecha_salida_estimada IS NULL AND estado = 'ACTIVO';

COMMENT ON COLUMN TicketsEstancia.horas_estimadas IS 'Horas estimadas de estancia (pagadas al entrar)';
COMMENT ON COLUMN TicketsEstancia.tiempo_extra_minutos IS 'Minutos adicionales agregados por el usuario';
COMMENT ON COLUMN TicketsEstancia.monto_extra IS 'Monto cobrado por tiempo adicional o exceso';
COMMENT ON COLUMN TicketsEstancia.fecha_salida_estimada IS 'Fecha/hora estimada de salida (puede extenderse)';
