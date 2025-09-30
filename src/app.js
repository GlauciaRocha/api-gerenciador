// src/app.js
require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Rotas da aplicação
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

module.exports = app;