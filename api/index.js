const serverless = require('serverless-http');

let handler;
let initDone = false;
let initError = null;

async function getHandler() {
  if (handler && initDone) return handler;

  try {
    const { app, initDbPromise } = require('../server/app');
    handler = serverless(app);

    // Wait for DB init with a 5-second timeout
    await Promise.race([
      initDbPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB init timeout after 5s')), 5000)
      ),
    ]);
    initDone = true;
  } catch (err) {
    initError = err;
    // Still create handler even if DB init fails — routes will return their own errors
    if (!handler) {
      const { app } = require('../server/app');
      handler = serverless(app);
    }
    initDone = true;
  }

  return handler;
}

module.exports = async (req, res) => {
  try {
    const h = await getHandler();
    return h(req, res);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  }
};
