// tests/integration/tasks.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app'); // Importamos nossa aplicação Express

describe('API - Fluxo de Tarefas', () => {
    let authToken;

    // Antes de todos os testes deste bloco, faz o login para obter um token
    before((done) => {
        request(app)
            .post('/auth/login')
            .send({ email: 'julio@teste.com', password: '123' })
            .end((err, res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('token');
                authToken = res.body.token; // Armazena o token para os próximos testes
                done();
            });
    });

    it('Deve retornar erro 401 ao tentar acessar /tasks sem um token', (done) => {
        request(app)
            .get('/tasks')
            .expect(401, done);
    });

    it('Deve retornar erro 401 ao tentar criar uma tarefa com um token inválido', (done) => {
        request(app)
            .post('/tasks')
            .set('Authorization', 'Bearer tokeninvalido123')
            .send({ title: 'Tarefa com token inválido' })
            .expect(401, done);
    });

    it('Deve criar uma nova tarefa com sucesso quando autenticado', (done) => {
        request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${authToken}`) // Usa o token obtido no login
            .send({ title: 'Lavar a louça', description: 'Usar a esponja nova' })
            .expect(201)
            .end((err, res) => {
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('id');
                expect(res.body.title).to.equal('Lavar a louça');
                expect(res.body.ownerId).to.equal(1); // Verifica se a tarefa pertence ao usuário correto
                done();
            });
    });

    it('Deve listar as tarefas do usuário autenticado', (done) => {
        request(app)
            .get('/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.be.an('array');
                expect(res.body.length).to.be.at.least(1);
                expect(res.body[0].title).to.equal('Lavar a louça');
                done();
            });
    });
});