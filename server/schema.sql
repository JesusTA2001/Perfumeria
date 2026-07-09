DROP DATABASE IF EXISTS perfumeria;
CREATE DATABASE perfumeria
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE perfumeria;

-- ==================================================
-- TABLA ADMINISTRADOR
-- ==================================================
CREATE TABLE administrador (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- TABLA MARCA
-- ==================================================
CREATE TABLE marca (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ==================================================
-- TABLA CATEGORIA
-- ==================================================
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE
);

-- ==================================================
-- TABLA PERFUME
-- ==================================================
CREATE TABLE perfume (
    id_perfume INT AUTO_INCREMENT PRIMARY KEY,
    id_marca INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_perfume_marca
        FOREIGN KEY (id_marca)
        REFERENCES marca(id_marca),
    CONSTRAINT fk_perfume_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
);

-- ==================================================
-- TABLA PRESENTACION PERFUME
-- Permite tener un mismo perfume en
-- 50ml, 100ml, 200ml, etc.
-- ==================================================
CREATE TABLE presentacion_perfume (
    id_presentacion INT AUTO_INCREMENT PRIMARY KEY,
    id_perfume INT NOT NULL,
    mililitros INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_presentacion_perfume
        FOREIGN KEY (id_perfume)
        REFERENCES perfume(id_perfume)
        ON DELETE CASCADE
);

-- ==================================================
-- TABLA IMAGEN PERFUME
-- ==================================================
CREATE TABLE imagen_perfume (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_perfume INT NOT NULL,
    ruta_imagen LONGTEXT NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_imagen_perfume
        FOREIGN KEY (id_perfume)
        REFERENCES perfume(id_perfume)
        ON DELETE CASCADE
);

-- ==================================================
-- TABLA CLIENTE
-- ==================================================
CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- TABLA PEDIDO
-- ==================================================
CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    comentarios TEXT,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
);

-- ==================================================
-- TABLA DETALLE PEDIDO
-- ==================================================
CREATE TABLE detalle_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_presentacion INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido(id_pedido)
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_presentacion
        FOREIGN KEY (id_presentacion)
        REFERENCES presentacion_perfume(id_presentacion)
);
