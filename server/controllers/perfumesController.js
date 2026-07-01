const pool = require('../config/db');

const getPerfumesQuery = `
  SELECT 
    p.id_perfume AS id,
    COALESCE(MIN(pp.id_presentacion), 0) AS id_presentacion,
    p.nombre AS name,
    p.descripcion AS descripcion,
    c.nombre AS category,
    COALESCE(MIN(pp.mililitros), 0) AS mililitros,
    COALESCE(MIN(pp.precio), 0) AS price,
    COALESCE(SUM(pp.stock), 0) AS stock,
    p.activo AS available,
    COALESCE(MAX(ip.ruta_imagen), '') AS imageUrl
  FROM perfume p
  LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
  LEFT JOIN presentacion_perfume pp ON p.id_perfume = pp.id_perfume
  LEFT JOIN imagen_perfume ip ON p.id_perfume = ip.id_perfume AND ip.principal = 1
  GROUP BY p.id_perfume
  ORDER BY p.id_perfume DESC
`;

exports.getPerfumes = async (_req, res) => {
  try {
    const [rows] = await pool.query(getPerfumesQuery);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createPerfume = async (req, res) => {
  try {
    const { name, descripcion, category, mililitros, price, stock, available, imageUrl } = req.body;

    // 1. Obtener o crear marca 'Generico'
    let [brandRows] = await pool.query('SELECT id_marca FROM marca WHERE nombre = ?', ['Generico']);
    let id_marca;
    if (brandRows.length > 0) {
      id_marca = brandRows[0].id_marca;
    } else {
      const [resBrand] = await pool.query('INSERT INTO marca (nombre) VALUES (?)', ['Generico']);
      id_marca = resBrand.insertId;
    }

    // 2. Obtener o crear categoría
    let [catRows] = await pool.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [category]);
    let id_categoria;
    if (catRows.length > 0) {
      id_categoria = catRows[0].id_categoria;
    } else {
      const [resCat] = await pool.query('INSERT INTO categoria (nombre) VALUES (?)', [category]);
      id_categoria = resCat.insertId;
    }

    // 3. Insertar perfume
    const [perfumeResult] = await pool.query(
      'INSERT INTO perfume (id_marca, id_categoria, nombre, descripcion, activo) VALUES (?, ?, ?, ?, ?)',
      [id_marca, id_categoria, name, descripcion || null, available ? 1 : 0]
    );
    const id_perfume = perfumeResult.insertId;

    // 4. Insertar presentación con mililitros del formulario
    await pool.query(
      'INSERT INTO presentacion_perfume (id_perfume, mililitros, precio, stock) VALUES (?, ?, ?, ?)',
      [id_perfume, mililitros || 100, price, stock]
    );

    // 5. Insertar imagen
    await pool.query(
      'INSERT INTO imagen_perfume (id_perfume, ruta_imagen, principal) VALUES (?, ?, 1)',
      [id_perfume, imageUrl || '']
    );

    const [rows] = await pool.query(`SELECT * FROM (${getPerfumesQuery}) AS t WHERE t.id = ?`, [id_perfume]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePerfume = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, descripcion, category, mililitros, price, stock, available, imageUrl } = req.body;

    // Obtener o crear categoría
    let [catRows] = await pool.query('SELECT id_categoria FROM categoria WHERE nombre = ?', [category]);
    let id_categoria;
    if (catRows.length > 0) {
      id_categoria = catRows[0].id_categoria;
    } else {
      const [resCat] = await pool.query('INSERT INTO categoria (nombre) VALUES (?)', [category]);
      id_categoria = resCat.insertId;
    }

    // Actualizar perfume
    await pool.query(
      'UPDATE perfume SET nombre = ?, descripcion = ?, id_categoria = ?, activo = ? WHERE id_perfume = ?',
      [name, descripcion || null, id_categoria, available ? 1 : 0, id]
    );

    // Actualizar o crear presentación
    const [presRows] = await pool.query('SELECT id_presentacion FROM presentacion_perfume WHERE id_perfume = ?', [id]);
    if (presRows.length > 0) {
      await pool.query(
        'UPDATE presentacion_perfume SET mililitros = ?, precio = ?, stock = ? WHERE id_perfume = ?',
        [mililitros || 100, price, stock, id]
      );
    } else {
      await pool.query(
        'INSERT INTO presentacion_perfume (id_perfume, mililitros, precio, stock) VALUES (?, ?, ?, ?)',
        [id, mililitros || 100, price, stock]
      );
    }

    // Actualizar o crear imagen
    const [imgRows] = await pool.query('SELECT id_imagen FROM imagen_perfume WHERE id_perfume = ? AND principal = 1', [id]);
    if (imgRows.length > 0) {
      await pool.query(
        'UPDATE imagen_perfume SET ruta_imagen = ? WHERE id_perfume = ? AND principal = 1',
        [imageUrl || '', id]
      );
    } else {
      await pool.query(
        'INSERT INTO imagen_perfume (id_perfume, ruta_imagen, principal) VALUES (?, ?, 1)',
        [id, imageUrl || '']
      );
    }

    const [rows] = await pool.query(`SELECT * FROM (${getPerfumesQuery}) AS t WHERE t.id = ?`, [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Perfume no encontrado' });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePerfume = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM perfume WHERE id_perfume = ?', [id]);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
