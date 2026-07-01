require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const perfumesRoutes = require('./routes/perfumesRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');

const initDb = async () => {
	try {
		await pool.query(`
		  CREATE TABLE IF NOT EXISTS administrador (
		    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
		    nombre VARCHAR(100) NOT NULL,
		    correo VARCHAR(120) NOT NULL UNIQUE,
		    password VARCHAR(255) NOT NULL,
		    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS marca (
		    id_marca INT AUTO_INCREMENT PRIMARY KEY,
		    nombre VARCHAR(100) NOT NULL UNIQUE
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS categoria (
		    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
		    nombre VARCHAR(60) NOT NULL UNIQUE
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS perfume (
		    id_perfume INT AUTO_INCREMENT PRIMARY KEY,
		    id_marca INT NOT NULL,
		    id_categoria INT NOT NULL,
		    nombre VARCHAR(150) NOT NULL,
		    descripcion TEXT,
		    activo BOOLEAN DEFAULT TRUE,
		    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		    CONSTRAINT fk_perfume_marca FOREIGN KEY (id_marca) REFERENCES marca(id_marca),
		    CONSTRAINT fk_perfume_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS presentacion_perfume (
		    id_presentacion INT AUTO_INCREMENT PRIMARY KEY,
		    id_perfume INT NOT NULL,
		    mililitros INT NOT NULL,
		    precio DECIMAL(10,2) NOT NULL,
		    stock INT NOT NULL DEFAULT 0,
		    CONSTRAINT fk_presentacion_perfume FOREIGN KEY (id_perfume) REFERENCES perfume(id_perfume) ON DELETE CASCADE
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS imagen_perfume (
		    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
		    id_perfume INT NOT NULL,
		    ruta_imagen LONGTEXT NOT NULL,
		    principal BOOLEAN DEFAULT FALSE,
		    CONSTRAINT fk_imagen_perfume FOREIGN KEY (id_perfume) REFERENCES perfume(id_perfume) ON DELETE CASCADE
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS cliente (
		    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
		    nombre_completo VARCHAR(120) NOT NULL,
		    telefono VARCHAR(20) NOT NULL,
		    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS pedido (
		    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
		    id_cliente INT NOT NULL,
		    comentarios TEXT,
		    total DECIMAL(10,2) NOT NULL DEFAULT 0,
		    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
		    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
		  )
		`);

		await pool.query(`
		  CREATE TABLE IF NOT EXISTS detalle_pedido (
		    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
		    id_pedido INT NOT NULL,
		    id_presentacion INT NOT NULL,
		    cantidad INT NOT NULL,
		    precio_unitario DECIMAL(10,2) NOT NULL,
		    subtotal DECIMAL(10,2) NOT NULL,
		    CONSTRAINT fk_detalle_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
		    CONSTRAINT fk_detalle_presentacion FOREIGN KEY (id_presentacion) REFERENCES presentacion_perfume(id_presentacion)
		  )
		`);

		try {
			await pool.query("ALTER TABLE pedido ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'");
		} catch (e) {
		}

		try {
			await pool.query('ALTER TABLE imagen_perfume MODIFY COLUMN ruta_imagen LONGTEXT NOT NULL');
		} catch (e) {
		}

		const [catCount] = await pool.query('SELECT COUNT(*) as count FROM categoria');
		if (catCount[0].count === 0) {
			await pool.query("INSERT INTO categoria (nombre) VALUES ('Hombre'), ('Mujer'), ('Unisex')");
		}

		console.log('Tablas listas.');
	} catch (error) {
		console.error('Error initializing database tables:', error);
	}
};

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
	try {
		await pool.query('SELECT 1');
		return res.json({ ok: true, message: 'API y MySQL conectados' });
	} catch (error) {
		return res.status(500).json({ ok: false, message: error.message });
	}
});

app.use('/api/perfumes', perfumesRoutes);
app.use('/api/pedidos', pedidosRoutes);

const initDbPromise = initDb();

module.exports = {
	app,
	initDbPromise,
};