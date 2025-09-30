// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');

// Em um projeto real, isso viria de um banco de dados
const users = [{ id: 1, email: 'julio@teste.com', password: '123' }];

exports.login = (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gera o token JWT com o ID e email do usuário
    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ message: 'Login bem-sucedido!', token });
};