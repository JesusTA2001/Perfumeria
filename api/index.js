const serverless = require('serverless-http');

let handler;

function getHandler() {
  if (handler) return handler;
  // require() ya NO bloquea — app.js no ejecuta queries al cargarse en Vercel
  const { app } = require('../server/app');
  handler = serverless(app);
  return handler;
}

module.exports = async (req, res) => {
  try {
    const h = getHandler();
    return h(req, res);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};
