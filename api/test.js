// Diagnóstico puro — sin importar server/app.js
module.exports = async (req, res) => {
  // Verificar variables de entorno
  const envInfo = {
    VERCEL: process.env.VERCEL || null,
    NODE_ENV: process.env.NODE_ENV || null,
    DB_HOST: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 15) + '...' : 'NOT SET',
    DB_PORT: process.env.DB_PORT || 'NOT SET',
    DB_USER: process.env.DB_USER || 'NOT SET',
    DB_PASSWORD: process.env.DB_PASSWORD ? `SET (${process.env.DB_PASSWORD.length} chars)` : 'NOT SET',
    DB_NAME: process.env.DB_NAME || 'NOT SET',
    DB_SSL_MODE: process.env.DB_SSL_MODE || 'NOT SET',
    DB_SSL_CA: process.env.DB_SSL_CA ? `SET (${process.env.DB_SSL_CA.length} chars)` : 'NOT SET',
  };

  // Intentar conexión a DB
  let dbResult = null;
  try {
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 5000,
    });
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM perfume');
    dbResult = { ok: true, perfumeCount: rows[0].count };
    await conn.end();
  } catch (err) {
    dbResult = { ok: false, error: err.message, code: err.code };
  }

  res.status(200).json({
    env: envInfo,
    db: dbResult,
    url: req.url,
    timestamp: new Date().toISOString(),
  });
};
