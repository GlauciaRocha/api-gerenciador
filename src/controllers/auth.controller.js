// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');

// Em um projeto real, isso viria de um banco de dados
const users = [{ id: 1, email: 'julio@teste.com', password: '123', name: 'Julio' }];
let nextUserId = 2;

// Registrar novo usuário
exports.register = (req, res) => {
    const { name, email, password } = req.body;

    // Validação de campos obrigatórios
    if (!name || !email || !password) {
        return res.status(400).json({ 
            error: 'Nome, email e senha são obrigatórios.' 
        });
    }

    // Verifica se o email já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ 
            error: 'Email já cadastrado.' 
        });
    }

    // Cria o novo usuário
    const newUser = {
        id: nextUserId++,
        name,
        email,
        password
    };

    users.push(newUser);

    res.status(201).json({ 
        message: 'Usuário registrado com sucesso!',
        data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    });
};

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

    res.json({ 
        message: 'Login bem-sucedido!', 
        data: {
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        }
    });
};