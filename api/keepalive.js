const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 5000,
    });
    
    // Ejecutar un simple ping a la base de datos
    await conn.query('SELECT 1');
    await conn.end();
    
    return res.status(200).json({ ok: true, message: 'Keep-alive exitoso. La base de datos Aiven está despierta.' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};
