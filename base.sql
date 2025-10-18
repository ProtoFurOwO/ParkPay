-- Eliminar la base de datos si ya existe para una instalación limpia
DROP DATABASE IF EXISTS park_pay_db;

-- Crear la base de datos especificando el encoding
CREATE DATABASE park_pay_db ENCODING 'UTF8';

-- Conéctese a la base de datos: \c park_pay_db

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
-- Tabla "Vehiculos" (Tabla 2) - ¡MODIFICADA!
-- Ahora se almacena el TIPO de vehículo.
-- -----------------------------------------------------
CREATE TABLE Vehiculos (
  id_vehiculo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(30),
  tipo tipo_vehiculo_enum NOT NULL, -- <-- ¡AQUÍ ESTÁ EL CAMBIO!
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
-- Tabla "CajonesEstacionamiento" (Tabla 4) - ¡MODIFICADA!
-- Se actualizó el ENUM para ser más claro.
-- -----------------------------------------------------
CREATE TABLE CajonesEstacionamiento (
  id_cajon SERIAL PRIMARY KEY,
  id_tarifa INT NOT NULL, 
  numero_cajon VARCHAR(10) NOT NULL UNIQUE,
  ubicacion_piso VARCHAR(50),
  tipo tipo_cajon_enum NOT NULL DEFAULT 'Automóvil', -- <-- ENUM ACTUALIZADO
  estado estado_cajon_enum NOT NULL DEFAULT 'Disponible',
  CONSTRAINT fk_cajon_tarifa
    FOREIGN KEY (id_tarifa)
    REFERENCES Tarifas(id_tarifa)
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