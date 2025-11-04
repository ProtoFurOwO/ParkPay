-- Script para inicializar datos en la base de datos ParkPay
-- Ejecutar después de crear la estructura con base postgre.sql

-- Limpiar datos existentes (opcional)
TRUNCATE TABLE TicketsEstancia, CajonesEstacionamiento, Tarifas, Vehiculos, Usuarios RESTART IDENTITY CASCADE;

-- Insertar Tarifas
INSERT INTO Tarifas (descripcion, costo_por_hora) VALUES
('Tarifa Normal', 25.00),
('Tarifa Premium', 35.00),
('Tarifa Económica', 20.00);

-- Insertar Cajones para Piso A (15 lugares)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
(1, 'A-01', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-02', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-03', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-04', 'Piso A', 'Discapacitado', 'Disponible'),
(1, 'A-05', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-06', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-07', 'Piso A', 'Motocicleta', 'Disponible'),
(1, 'A-08', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-09', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-10', 'Piso A', 'Eléctrico', 'Disponible'),
(1, 'A-11', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-12', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-13', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-14', 'Piso A', 'Normal', 'Disponible'),
(1, 'A-15', 'Piso A', 'Normal', 'Disponible');

-- Insertar Cajones para Piso B (15 lugares)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
(1, 'B-01', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-02', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-03', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-04', 'Piso B', 'Discapacitado', 'Disponible'),
(1, 'B-05', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-06', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-07', 'Piso B', 'Motocicleta', 'Disponible'),
(1, 'B-08', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-09', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-10', 'Piso B', 'Eléctrico', 'Disponible'),
(1, 'B-11', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-12', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-13', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-14', 'Piso B', 'Normal', 'Disponible'),
(1, 'B-15', 'Piso B', 'Normal', 'Disponible');

-- Verificar la inserción
SELECT 'Tarifas insertadas:' as mensaje, COUNT(*) as total FROM Tarifas;
SELECT 'Cajones insertados:' as mensaje, COUNT(*) as total FROM CajonesEstacionamiento;
SELECT 'Cajones Piso A:' as mensaje, COUNT(*) as total FROM CajonesEstacionamiento WHERE ubicacion_piso = 'Piso A';
SELECT 'Cajones Piso B:' as mensaje, COUNT(*) as total FROM CajonesEstacionamiento WHERE ubicacion_piso = 'Piso B';

-- Mostrar todos los cajones
SELECT id_cajon, numero_cajon, ubicacion_piso, tipo, estado 
FROM CajonesEstacionamiento 
ORDER BY ubicacion_piso, numero_cajon;
