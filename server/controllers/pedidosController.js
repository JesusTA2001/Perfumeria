const pool = require('../config/db');

const getPedidosQuery = `
  SELECT 
    p.id_pedido AS id,
    c.nombre_completo AS clienteNombre,
    GROUP_CONCAT(CONCAT(perf.nombre, ' (', dp.cantidad, ' ', IF(dp.cantidad = 1, 'unidad', 'unidades'), ')') SEPARATOR ', ') AS perfumeName,
    COALESCE(SUM(dp.cantidad), 1) AS cantidad,
    p.total AS precioTotal,
    p.fecha AS fecha,
    p.estado AS estado,
    p.comentarios AS comentarios
  FROM pedido p
  LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
  LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
  LEFT JOIN presentacion_perfume pres ON dp.id_presentacion = pres.id_presentacion
  LEFT JOIN perfume perf ON pres.id_perfume = perf.id_perfume
  GROUP BY p.id_pedido
  ORDER BY p.fecha DESC
`;

exports.getPedidos = async (_req, res) => {
  try {
    const [rows] = await pool.query(getPedidosQuery);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.entregarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE pedido SET estado = "entregado" WHERE id_pedido = ?', [id]);
    const [rows] = await pool.query(`${getPedidosQuery.replace('ORDER BY p.fecha DESC', '')} HAVING p.id_pedido = ?`, [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createPedido = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { clienteNombre, telefono, comentarios, items } = req.body;

    if (!clienteNombre || !telefono || !items || items.length === 0) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // 1. Obtener o crear cliente
    let [clientRows] = await connection.query(
      'SELECT id_cliente FROM cliente WHERE nombre_completo = ? AND telefono = ?',
      [clienteNombre, telefono]
    );
    let id_cliente;
    if (clientRows.length > 0) {
      id_cliente = clientRows[0].id_cliente;
    } else {
      const [resClient] = await connection.query(
        'INSERT INTO cliente (nombre_completo, telefono) VALUES (?, ?)',
        [clienteNombre, telefono]
      );
      id_cliente = resClient.insertId;
    }

    // 2. Calcular total del pedido y validar existencias de stock
    let total = 0;
    for (const item of items) {
      const { id_presentacion, cantidad } = item;

      const [presRows] = await connection.query(
        'SELECT precio, stock FROM presentacion_perfume WHERE id_presentacion = ?',
        [id_presentacion]
      );
      if (presRows.length === 0) {
        throw new Error(`Presentación con ID ${id_presentacion} no encontrada`);
      }

      const { precio, stock } = presRows[0];
      if (stock < cantidad) {
        throw new Error(`Stock insuficiente para la presentación seleccionada`);
      }

      total += precio * cantidad;
      item.precio_unitario = precio;
      item.subtotal = precio * cantidad;
    }

    // 3. Crear el encabezado del pedido
    const [pedidoResult] = await connection.query(
      'INSERT INTO pedido (id_cliente, comentarios, total, estado) VALUES (?, ?, ?, "pendiente")',
      [id_cliente, comentarios || '', total]
    );
    const id_pedido = pedidoResult.insertId;

    // 4. Insertar detalles de pedido y reducir stock
    for (const item of items) {
      const { id_presentacion, cantidad, precio_unitario, subtotal } = item;

      await connection.query(
        'INSERT INTO detalle_pedido (id_pedido, id_presentacion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id_pedido, id_presentacion, cantidad, precio_unitario, subtotal]
      );

      await connection.query(
        'UPDATE presentacion_perfume SET stock = stock - ? WHERE id_presentacion = ?',
        [cantidad, id_presentacion]
      );
    }

    await connection.commit();

    const [rows] = await pool.query(`${getPedidosQuery.replace('ORDER BY p.fecha DESC', '')} HAVING p.id_pedido = ?`, [id_pedido]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// --- Endpoints para gráficas del dashboard ---

exports.getVentasMensuales = async (req, res) => {
  try {
    const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT
        MONTH(p.fecha) AS mes,
        COALESCE(SUM(p.total), 0) AS total
       FROM pedido p
       WHERE YEAR(p.fecha) = ? AND p.estado IN ('pendiente', 'entregado')
       GROUP BY MONTH(p.fecha)
       ORDER BY mes ASC`,
      [anio]
    );
    // Devolver siempre los 12 meses (con 0 si no hay ventas ese mes)
    const result = Array.from({ length: 12 }, (_, i) => {
      const found = rows.find((r) => r.mes === i + 1);
      return { mes: i + 1, total: found ? Number(found.total) : 0 };
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTopPerfumes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        perf.nombre AS name,
        SUM(dp.cantidad) AS units
       FROM detalle_pedido dp
       JOIN presentacion_perfume pres ON dp.id_presentacion = pres.id_presentacion
       JOIN perfume perf ON pres.id_perfume = perf.id_perfume
       GROUP BY perf.id_perfume, perf.nombre
       ORDER BY units DESC
       LIMIT 8`
    );
    return res.json(rows.map(r => ({ name: r.name, units: Number(r.units) })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
