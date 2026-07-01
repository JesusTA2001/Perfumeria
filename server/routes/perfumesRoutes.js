const express = require('express');
const router = express.Router();
const perfumesController = require('../controllers/perfumesController');

router.get('/', perfumesController.getPerfumes);
router.post('/', perfumesController.createPerfume);
router.put('/:id', perfumesController.updatePerfume);
router.delete('/:id', perfumesController.deletePerfume);

module.exports = router;
