const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.getPedidos);
router.get('/ventas-mensuales', pedidosController.getVentasMensuales);
router.get('/top-perfumes', pedidosController.getTopPerfumes);
router.post('/', pedidosController.createPedido);
router.put('/:id/entregar', pedidosController.entregarPedido);

module.exports = router;
