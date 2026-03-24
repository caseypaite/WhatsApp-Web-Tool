const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

router.get('/all', authenticate, checkRole(['Admin']), templateController.getAll);
router.post('/create', authenticate, checkRole(['Admin']), templateController.create);
router.put('/:id', authenticate, checkRole(['Admin']), templateController.update);
router.delete('/:id', authenticate, checkRole(['Admin']), templateController.delete);

module.exports = router;
