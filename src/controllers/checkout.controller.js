// src/controllers/checkout.controller.js

// Produtos disponíveis (simulação de banco de dados)
const products = [
    { id: 1, name: 'Produto 1', price: 99.90 },
    { id: 2, name: 'Produto 2', price: 149.90 },
    { id: 3, name: 'Produto 3', price: 199.90 },
];

// Pedidos realizados
let orders = [];
let nextOrderId = 1;

// Métodos de pagamento aceitos
const validPaymentMethods = ['cash', 'credit', 'debit', 'pix'];

exports.checkout = (req, res) => {
    const { productId, quantity, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validação de campos obrigatórios
    if (!productId || !quantity || !paymentMethod) {
        return res.status(400).json({
            error: 'productId, quantity e paymentMethod são obrigatórios.'
        });
    }

    // Validação do método de pagamento
    if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
            error: `Método de pagamento inválido. Use: ${validPaymentMethods.join(', ')}`
        });
    }

    // Validação da quantidade
    if (quantity < 1) {
        return res.status(400).json({
            error: 'Quantidade deve ser maior que zero.'
        });
    }

    // Busca o produto
    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({
            error: 'Produto não encontrado.'
        });
    }

    // Calcula o total
    const total = product.price * quantity;

    // Cria o pedido
    const order = {
        orderId: nextOrderId++,
        userId,
        productId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total,
        paymentMethod,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    orders.push(order);

    res.status(201).json({
        message: 'Checkout realizado com sucesso!',
        data: order
    });
};

exports.getOrders = (req, res) => {
    const userId = req.user.id;
    const userOrders = orders.filter(o => o.userId === userId);
    res.status(200).json({ data: userOrders });
};

