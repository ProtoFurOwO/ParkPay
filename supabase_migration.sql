-- =====================================================
-- SCRIPT DE MIGRACIÓN PARA SUPABASE
-- =====================================================
-- NOTA: Supabase ya tiene la base de datos creada
-- Solo necesitamos crear las tablas y tipos

-- Limpiar tablas existentes (en orden inverso por las FK)
DROP TABLE IF EXISTS TicketsEstancia CASCADE;
DROP TABLE IF EXISTS CajonesEstacionamiento CASCADE;
DROP TABLE IF EXISTS Tarifas CASCADE;
DROP TABLE IF EXISTS Vehiculos CASCADE;
DROP TABLE IF EXISTS Usuarios CASCADE;

-- Limpiar tipos ENUM existentes
DROP TYPE IF EXISTS estado_ticket_enum CASCADE;
DROP TYPE IF EXISTS estado_cajon_enum CASCADE;
DROP TYPE IF EXISTS tipo_cajon_enum CASCADE;
DROP TYPE IF EXISTS tipo_vehiculo_enum CASCADE;

-- -----------------------------------------------------
-- Creación de Tipos de Datos (ENUMs)
-- -----------------------------------------------------
CREATE TYPE tipo_vehiculo_enum AS ENUM ('Automóvil', 'Motocicleta', 'Eléctrico');
CREATE TYPE tipo_cajon_enum AS ENUM ('Automóvil', 'Motocicleta', 'Eléctrico', 'Discapacitado');
CREATE TYPE estado_cajon_enum AS ENUM ('Disponible', 'Ocupado', 'Reservado', 'Mantenimiento');
CREATE TYPE estado_ticket_enum AS ENUM ('ACTIVO', 'FINALIZADO', 'PAGADO');

-- -----------------------------------------------------
-- Tabla "Usuarios" (Tabla 1)
-- -----------------------------------------------------
CREATE TABLE Usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Tabla "Vehiculos" (Tabla 2)
-- -----------------------------------------------------
CREATE TABLE Vehiculos (
  id_vehiculo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(30),
  tipo tipo_vehiculo_enum NOT NULL,
  CONSTRAINT fk_vehiculo_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla "Tarifas" (Tabla 3)
-- -----------------------------------------------------
CREATE TABLE Tarifas (
  id_tarifa SERIAL PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  costo_por_hora DECIMAL(10, 2) NOT NULL CHECK (costo_por_hora >= 0)
);

-- -----------------------------------------------------
-- Tabla "CajonesEstacionamiento" (Tabla 4)
-- -----------------------------------------------------
CREATE TABLE CajonesEstacionamiento (
  id_cajon SERIAL PRIMARY KEY,
  id_tarifa INT NOT NULL, 
  numero_cajon VARCHAR(10) NOT NULL UNIQUE,
  ubicacion_piso VARCHAR(50),
  tipo tipo_cajon_enum NOT NULL DEFAULT 'Automóvil',
  estado estado_cajon_enum NOT NULL DEFAULT 'Disponible',
  CONSTRAINT fk_cajon_tarifa
    FOREIGN KEY (id_tarifa)
    REFERENCES Tarifas(id_tarifa)
    ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- Tabla "TicketsEstancia" (Tabla 5)
-- -----------------------------------------------------
CREATE TABLE TicketsEstancia (
  id_ticket SERIAL PRIMARY KEY,
  id_vehiculo INT NOT NULL,
  id_cajon INT NOT NULL,
  codigo_acceso VARCHAR(255) NOT NULL UNIQUE,
  fecha_hora_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_hora_salida TIMESTAMP,
  monto_cobrado DECIMAL(10, 2),
  id_transaccion_pago VARCHAR(100),
  estado estado_ticket_enum NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT fk_ticket_vehiculo
    FOREIGN KEY (id_vehiculo)
    REFERENCES Vehiculos(id_vehiculo)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ticket_cajon
    FOREIGN KEY (id_cajon)
    REFERENCES CajonesEstacionamiento(id_cajon)
    ON DELETE RESTRICT
);

-- -----------------------------------------------------
-- Datos Iniciales: Tarifas
-- -----------------------------------------------------
INSERT INTO Tarifas (descripcion, costo_por_hora) VALUES
  ('Tarifa Normal', 20.00),
  ('Tarifa Motocicleta', 15.00),
  ('Tarifa Eléctrico', 25.00),
  ('Tarifa Discapacitado', 15.00);

-- -----------------------------------------------------
-- Datos Iniciales: Cajones (30 lugares)
-- -----------------------------------------------------

-- Piso A: 15 cajones
-- Cajones normales (1-10)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
  (1, '101', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '102', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '103', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '104', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '105', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '106', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '107', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '108', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '109', 'Piso A', 'Automóvil', 'Disponible'),
  (1, '110', 'Piso A', 'Automóvil', 'Disponible');

-- Cajones especiales Piso A (11-15)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
  (2, 'M-01', 'Piso A', 'Motocicleta', 'Disponible'),
  (2, 'M-02', 'Piso A', 'Motocicleta', 'Disponible'),
  (3, 'E-01', 'Piso A', 'Eléctrico', 'Disponible'),
  (4, 'D-01', 'Piso A', 'Discapacitado', 'Disponible'),
  (4, 'D-02', 'Piso A', 'Discapacitado', 'Disponible');

-- Piso B: 15 cajones
-- Cajones normales (1-10)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
  (1, '201', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '202', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '203', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '204', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '205', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '206', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '207', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '208', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '209', 'Piso B', 'Automóvil', 'Disponible'),
  (1, '210', 'Piso B', 'Automóvil', 'Disponible');

-- Cajones especiales Piso B (11-15)
INSERT INTO CajonesEstacionamiento (id_tarifa, numero_cajon, ubicacion_piso, tipo, estado) VALUES
  (2, 'M-03', 'Piso B', 'Motocicleta', 'Disponible'),
  (2, 'M-04', 'Piso B', 'Motocicleta', 'Disponible'),
  (3, 'E-02', 'Piso B', 'Eléctrico', 'Disponible'),
  (4, 'D-03', 'Piso B', 'Discapacitado', 'Disponible'),
  (4, 'D-04', 'Piso B', 'Discapacitado', 'Disponible');

-- =====================================================
-- ¡MIGRACIÓN COMPLETA!
-- Ahora copia y pega este script en Supabase SQL Editor
-- =====================================================
