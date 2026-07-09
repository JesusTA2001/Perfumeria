const mysql = require('mysql2/promise');

function buildSslConfig() {
  const sslMode = (process.env.DB_SSL_MODE || '').toUpperCase();
  const useSsl = process.env.DB_SSL === 'true' || sslMode === 'REQUIRED';

  if (!useSsl) {
    return undefined;
  }

  const sslConfig = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  if (process.env.DB_SSL_CA) {
    sslConfig.ca = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  }

  return sslConfig;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
