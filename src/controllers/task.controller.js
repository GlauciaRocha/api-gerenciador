// src/controllers/task.controller.js
let tasks = []; // Nosso "banco de dados" em memória
let nextId = 1;

// Criar uma nova tarefa
exports.createTask = (req, res) => {
    const { title, description } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'O título é obrigatório.' });
    }
    
    const newTask = {
        id: nextId++,
        title,
        description,
        ownerId: req.user.id, // O ID vem do token verificado pelo middleware!
        completed: false,
    };
    
    tasks.push(newTask);
    res.status(201).json(newTask);
};

// Listar todas as tarefas do usuário logado
exports.getTasks = (req, res) => {
    const userTasks = tasks.filter(task => task.ownerId === req.user.id);
    res.status(200).json(userTasks);
};