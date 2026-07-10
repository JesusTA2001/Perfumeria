const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: (process.env.DB_HOST || '').includes('aivencloud.com') || process.env.VERCEL
    ? { rejectUnauthorized: false }
    : undefined,
  waitForConnections: true,
  connectionLimit: 1,
  connectTimeout: 5000,
  queueLimit: 0,
};

// Pool lazy — se crea solo cuando se necesita la primera query
let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = mysql.createPool(dbConfig);
  }
  return _pool;
}

// Proxy que se comporta como un pool pero es lazy
const pool = {
  query: (...args) => getPool().query(...args),
  execute: (...args) => getPool().execute(...args),
  getConnection: (...args) => getPool().getConnection(...args),
  end: (...args) => _pool ? _pool.end(...args) : Promise.resolve(),
};

module.exports = pool;
