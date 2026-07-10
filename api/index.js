module.exports.config = {
  api: {
    bodyParser: false,
  },
};

const mysql = require('mysql2/promise');

// Conexión directa (no pool) para serverless
async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 5000,
  });
}

// GET /api/perfumes — la misma query que perfumesController.getPerfumes
async function getPerfumes() {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT 
        p.id_perfume,
        p.nombre,
        p.descripcion,
        p.activo,
        p.fecha_registro,
        c.id_categoria,
        c.nombre AS categoria,
        m.nombre AS marca,
        MIN(pp.precio) AS precio_min,
        MAX(pp.precio) AS precio_max,
        SUM(pp.stock) AS stock_total,
        (SELECT pp2.precio FROM presentacion_perfume pp2 
         WHERE pp2.id_perfume = p.id_perfume 
         ORDER BY pp2.mililitros ASC LIMIT 1) AS precio,
        (SELECT pp2.mililitros FROM presentacion_perfume pp2 
         WHERE pp2.id_perfume = p.id_perfume 
         ORDER BY pp2.mililitros ASC LIMIT 1) AS mililitros,
        (SELECT pp2.id_presentacion FROM presentacion_perfume pp2 
         WHERE pp2.id_perfume = p.id_perfume 
         ORDER BY pp2.mililitros ASC LIMIT 1) AS id_presentacion,
        (SELECT ip2.ruta_imagen FROM imagen_perfume ip2 
         WHERE ip2.id_perfume = p.id_perfume AND ip2.principal = TRUE LIMIT 1) AS imagen
      FROM perfume p
      JOIN categoria c ON p.id_categoria = c.id_categoria
      JOIN marca m ON p.id_marca = m.id_marca
      LEFT JOIN presentacion_perfume pp ON pp.id_perfume = p.id_perfume
      LEFT JOIN imagen_perfume ip ON ip.id_perfume = p.id_perfume
      GROUP BY p.id_perfume, p.nombre, p.descripcion, p.activo, p.fecha_registro,
               c.id_categoria, c.nombre, m.nombre
      ORDER BY p.nombre ASC
    `);
    return rows;
  } finally {
    await conn.end();
  }
}

// POST /api/pedidos
async function createPedido(body) {
  const conn = await getConnection();
  try {
    const { nombre, telefono, comentarios, items } = body;
    const [clientResult] = await conn.query(
      'INSERT INTO cliente (nombre_completo, telefono) VALUES (?, ?)',
      [nombre, telefono]
    );
    const clienteId = clientResult.insertId;
    
    let total = 0;
    for (const item of items) {
      total += item.precio * item.cantidad;
    }
    
    const [pedidoResult] = await conn.query(
      'INSERT INTO pedido (id_cliente, comentarios, total, estado) VALUES (?, ?, ?, ?)',
      [clienteId, comentarios || '', total, 'pendiente']
    );
    const pedidoId = pedidoResult.insertId;
    
    for (const item of items) {
      const subtotal = item.precio * item.cantidad;
      await conn.query(
        'INSERT INTO detalle_pedido (id_pedido, id_presentacion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [pedidoId, item.id_presentacion, item.cantidad, item.precio, subtotal]
      );
    }
    
    return { ok: true, id_pedido: pedidoId, total };
  } finally {
    await conn.end();
  }
}

// GET /api/pedidos
async function getPedidos() {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT p.id_pedido, p.comentarios, p.total, p.fecha, p.estado,
             c.nombre_completo, c.telefono
      FROM pedido p
      JOIN cliente c ON p.id_cliente = c.id_cliente
      ORDER BY p.fecha DESC
    `);
    
    for (const pedido of rows) {
      const [detalles] = await conn.query(`
        SELECT dp.cantidad, dp.precio_unitario, dp.subtotal,
               pf.nombre AS perfume_nombre, pp.mililitros
        FROM detalle_pedido dp
        JOIN presentacion_perfume pp ON dp.id_presentacion = pp.id_presentacion
        JOIN perfume pf ON pp.id_perfume = pf.id_perfume
        WHERE dp.id_pedido = ?
      `, [pedido.id_pedido]);
      pedido.detalles = detalles;
    }
    
    return rows;
  } finally {
    await conn.end();
  }
}

// PUT /api/pedidos/:id/entregar
async function entregarPedido(id) {
  const conn = await getConnection();
  try {
    await conn.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', ['entregado', id]);
    return { ok: true };
  } finally {
    await conn.end();
  }
}

// PUT /api/pedidos/:id/no-entregar
async function noEntregarPedido(id) {
  const conn = await getConnection();
  try {
    await conn.query('UPDATE pedido SET estado = ? WHERE id_pedido = ?', ['no_entregado', id]);
    return { ok: true };
  } finally {
    await conn.end();
  }
}

// GET /api/pedidos/ventas-mensuales
async function ventasMensuales(anio) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT MONTH(fecha) as mes, SUM(total) as total
      FROM pedido
      WHERE YEAR(fecha) = ? AND estado != 'no_entregado'
      GROUP BY MONTH(fecha)
      ORDER BY mes
    `, [anio || new Date().getFullYear()]);
    return rows;
  } finally {
    await conn.end();
  }
}

// GET /api/pedidos/top-perfumes
async function topPerfumes() {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT pf.nombre, SUM(dp.cantidad) as total_vendido
      FROM detalle_pedido dp
      JOIN presentacion_perfume pp ON dp.id_presentacion = pp.id_presentacion
      JOIN perfume pf ON pp.id_perfume = pf.id_perfume
      JOIN pedido p ON dp.id_pedido = p.id_pedido
      WHERE p.estado != 'no_entregado'
      GROUP BY pf.id_perfume, pf.nombre
      ORDER BY total_vendido DESC
      LIMIT 5
    `);
    return rows;
  } finally {
    await conn.end();
  }
}

// CRUD perfumes para admin
async function createPerfume(body) {
  const conn = await getConnection();
  try {
    const { name, descripcion, category, price, mililitros, stock, imageUrl, available } = body;
    const nombre = name;
    const categoria = category;
    const precio = price;
    const imagen = imageUrl;
    const activo = available ? 1 : 0;
    
    let [marcas] = await conn.query("SELECT id_marca FROM marca WHERE nombre = 'Generico'");
    let id_marca;
    if (marcas.length === 0) {
      const [r] = await conn.query("INSERT INTO marca (nombre) VALUES ('Generico')");
      id_marca = r.insertId;
    } else {
      id_marca = marcas[0].id_marca;
    }
    
    let [cats] = await conn.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [categoria]);
    let id_categoria;
    if (cats.length === 0) {
      const [r] = await conn.query('INSERT INTO categoria (nombre) VALUES (?)', [categoria]);
      id_categoria = r.insertId;
    } else {
      id_categoria = cats[0].id_categoria;
    }
    
    const [perfumeResult] = await conn.query(
      'INSERT INTO perfume (id_marca, id_categoria, nombre, descripcion, activo) VALUES (?, ?, ?, ?, ?)',
      [id_marca, id_categoria, nombre, descripcion || '', activo]
    );
    const id_perfume = perfumeResult.insertId;
    
    await conn.query(
      'INSERT INTO presentacion_perfume (id_perfume, mililitros, precio, stock) VALUES (?, ?, ?, ?)',
      [id_perfume, mililitros || 100, precio, stock || 0]
    );
    
    if (imagen) {
      await conn.query(
        'INSERT INTO imagen_perfume (id_perfume, ruta_imagen, principal) VALUES (?, ?, TRUE)',
        [id_perfume, imagen]
      );
    }
    
    return { ok: true, id_perfume };
  } finally {
    await conn.end();
  }
}

async function updatePerfume(id, body) {
  const conn = await getConnection();
  try {
    const { name, descripcion, category, price, mililitros, stock, imageUrl, available } = body;
    const nombre = name;
    const categoria = category;
    const precio = price;
    const imagen = imageUrl;
    const activo = available ? 1 : 0;
    
    // Si la actualización es SÓLO para cambiar el estado (desde el Switch)
    if (body.available !== undefined && Object.keys(body).length <= 2) {
      await conn.query('UPDATE perfume SET activo = ? WHERE id_perfume = ?', [activo, id]);
      return { ok: true };
    }
    
    let [cats] = await conn.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [categoria]);
    let id_categoria;
    if (cats.length === 0) {
      const [r] = await conn.query('INSERT INTO categoria (nombre) VALUES (?)', [categoria]);
      id_categoria = r.insertId;
    } else {
      id_categoria = cats[0].id_categoria;
    }
    
    await conn.query(
      'UPDATE perfume SET nombre = ?, descripcion = ?, id_categoria = ?, activo = ? WHERE id_perfume = ?',
      [nombre, descripcion || '', id_categoria, activo, id]
    );
    
    await conn.query(
      'UPDATE presentacion_perfume SET mililitros = ?, precio = ?, stock = ? WHERE id_perfume = ?',
      [mililitros || 100, precio, stock || 0, id]
    );
    
    if (imagen) {
      const [existing] = await conn.query('SELECT id_imagen FROM imagen_perfume WHERE id_perfume = ?', [id]);
      if (existing.length > 0) {
        await conn.query('UPDATE imagen_perfume SET ruta_imagen = ? WHERE id_perfume = ?', [imagen, id]);
      } else {
        await conn.query('INSERT INTO imagen_perfume (id_perfume, ruta_imagen, principal) VALUES (?, ?, TRUE)', [id, imagen]);
      }
    }
    
    return { ok: true };
  } finally {
    await conn.end();
  }
}

async function deletePerfume(id) {
  const conn = await getConnection();
  try {
    await conn.query('DELETE FROM perfume WHERE id_perfume = ?', [id]);
    return { ok: true };
  } finally {
    await conn.end();
  }
}

// Helper para leer el body manualmente (soporta payloads grandes de imágenes)
async function getBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }

  return new Promise((resolve) => {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(bodyData));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Router principal
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');
  
  try {
    // GET /api/perfumes
    if (path === '/perfumes' && req.method === 'GET') {
      const perfumes = await getPerfumes();
      return res.status(200).json(perfumes);
    }
    
    // POST /api/perfumes
    if (path === '/perfumes' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await createPerfume(body);
      const perfumes = await getPerfumes();
      return res.status(201).json(perfumes.find(p => p.id_perfume === result.id_perfume) || result);
    }
    
    // PUT /api/perfumes/:id
    const perfumeMatch = path.match(/^\/perfumes\/(\d+)$/);
    if (perfumeMatch && req.method === 'PUT') {
      const body = await getBody(req);
      await updatePerfume(perfumeMatch[1], body);
      const perfumes = await getPerfumes();
      return res.status(200).json(perfumes.find(p => p.id_perfume == perfumeMatch[1]) || { ok: true });
    }
    
    // DELETE /api/perfumes/:id
    if (perfumeMatch && req.method === 'DELETE') {
      await deletePerfume(perfumeMatch[1]);
      return res.status(200).json({ ok: true });
    }
    
    // GET /api/pedidos
    if (path === '/pedidos' && req.method === 'GET') {
      const pedidos = await getPedidos();
      return res.status(200).json(pedidos);
    }
    
    // POST /api/pedidos
    if (path === '/pedidos' && req.method === 'POST') {
      const body = await getBody(req);
      const result = await createPedido(body);
      return res.status(201).json(result);
    }
    
    // PUT /api/pedidos/:id/entregar
    const entregarMatch = path.match(/^\/pedidos\/(\d+)\/entregar$/);
    if (entregarMatch && req.method === 'PUT') {
      const result = await entregarPedido(entregarMatch[1]);
      return res.status(200).json(result);
    }
    
    // PUT /api/pedidos/:id/no-entregar
    const noEntregarMatch = path.match(/^\/pedidos\/(\d+)\/no-entregar$/);
    if (noEntregarMatch && req.method === 'PUT') {
      const result = await noEntregarPedido(noEntregarMatch[1]);
      return res.status(200).json(result);
    }
    
    // GET /api/pedidos/ventas-mensuales
    if (path.startsWith('/pedidos/ventas-mensuales') && req.method === 'GET') {
      const anio = url.searchParams.get('anio');
      const result = await ventasMensuales(anio);
      return res.status(200).json(result);
    }
    
    // GET /api/pedidos/top-perfumes
    if (path === '/pedidos/top-perfumes' && req.method === 'GET') {
      const result = await topPerfumes();
      return res.status(200).json(result);
    }
    
    // GET /api/health
    if (path === '/health' && req.method === 'GET') {
      const conn = await getConnection();
      await conn.query('SELECT 1');
      await conn.end();
      return res.status(200).json({ ok: true, message: 'API y MySQL conectados' });
    }
    
    // GET /api/debug/env
    if (path === '/debug/env' && req.method === 'GET') {
      return res.status(200).json({
        VERCEL: process.env.VERCEL || null,
        DB_HOST_defined: !!process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT || null,
        DB_USER: process.env.DB_USER || null,
        DB_NAME: process.env.DB_NAME || null,
      });
    }
    
    // 404
    return res.status(404).json({ error: 'Route not found', path, method: req.method });
    
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
