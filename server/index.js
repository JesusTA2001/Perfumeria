const { app, initDbPromise } = require('./app');

const PORT = Number(process.env.API_PORT || 4000);

initDbPromise.then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${PORT}`);
  });
});



