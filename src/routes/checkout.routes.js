// src/routes/checkout.routes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const requireAuth = require('../middlewares/auth.middleware');

// Rota de checkout (requer autenticação)
router.post('/', requireAuth, checkoutController.checkout);

// Rota para listar pedidos do usuário (requer autenticação)
router.get('/orders', requireAuth, checkoutController.getOrders);

module.exports = router;

