const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Aiven requiere SSL; en Vercel siempre activar SSL
  ssl: (process.env.DB_HOST || '').includes('aivencloud.com') || process.env.VERCEL
    ? { rejectUnauthorized: false }
    : undefined,
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 8000,
  queueLimit: 0,
});

module.exports = pool;
