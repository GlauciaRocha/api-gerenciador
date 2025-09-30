// src/routes/task.routes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const requireAuth = require('../middlewares/auth.middleware');

// Todas as rotas abaixo exigirão um token JWT válido
router.post('/', requireAuth, taskController.createTask);
router.get('/', requireAuth, taskController.getTasks);

module.exports = router;