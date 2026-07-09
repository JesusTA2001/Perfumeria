const { app, initDbPromise } = require('./app');
const pool = require('./config/db');

const PORT = Number(process.env.API_PORT || 4000);

initDbPromise.then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${PORT}`);
  });

  // Keep-alive ping a la base de datos cada 10 minutos
  setInterval(async () => {
    try {
      await pool.query('SELECT 1');
      // eslint-disable-next-line no-console
      console.log('Database keep-alive ping: success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Database keep-alive ping failed:', err.message);
    }
  }, 10 * 60 * 1000);
});



