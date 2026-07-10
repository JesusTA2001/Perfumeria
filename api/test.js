// Ultra-minimal test — no dependencies, no DB
module.exports = (req, res) => {
  res.status(200).json({ ok: true, message: 'Vercel function works!', path: req.url });
};
