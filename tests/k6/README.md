# Teste de Performance K6 - Fluxo de Checkout

Este projeto contém testes de performance automatizados usando K6 para exercitar a API de Gerenciador de Tarefas.

## Estrutura do Projeto

```
tests/k6/
├── checkout.test.js      # Teste principal do fluxo de checkout
├── generateReport.js     # Gerador de relatório HTML
├── helpers/
│   ├── baseUrl.js        # Helper para variável de ambiente BASE_URL
│   ├── generateEmail.js  # Helper para geração de emails aleatórios
│   └── login.js          # Helper para função de login reutilizável
├── results.json          # Resultados do teste (gerado após execução)
├── report.html           # Relatório HTML (gerado após execução)
└── README.md             # Este arquivo
```

## Como Executar

### 1. Iniciar a API (Terminal 1):
```bash
npm start
```

### 2. Executar o teste K6 (Terminal 2):
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js
```

### 3. Executar com saída JSON:
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js --out json=tests/k6/results.json
```

### 4. Gerar relatório HTML:
```bash
node tests/k6/generateReport.js
```

### 5. Abrir o relatório:
```bash
start tests/k6/report.html
```

---

## Conceitos Aplicados

### 1. Thresholds

**Arquivo:** `tests/k6/checkout.test.js`

Os thresholds definem os critérios de aceite do teste. Se qualquer threshold falhar, o teste é considerado como falha.

```javascript
export const options = {
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'checkout_duration': ['p(95)<2000'],
        'checks': ['rate>0.95'],
    },
};
```

---

### 2. Checks

**Arquivo:** `tests/k6/checkout.test.js`

Os checks validam as respostas das requisições HTTP, verificando status codes e conteúdo das respostas.

```javascript
check(registerResponse, {
    'Registro: status é 201': (r) => r.status === 201,
    'Registro: resposta contém dados do usuário': (r) => {
        try {
            const body = JSON.parse(r.body);
            return body.data && body.data.id;
        } catch (e) {
            return false;
        }
    },
});
```

---

### 3. Helpers

**Arquivos:** `tests/k6/helpers/`

Os helpers são funções reutilizáveis que podem ser importadas em múltiplos testes.

#### Helper baseUrl.js:
```javascript
export function getBaseUrl() {
    const baseUrl = __ENV.BASE_URL;
    
    if (!baseUrl) {
        console.warn('http://localhost:3000');
        return 'http://localhost:3000';
    }
    
    return baseUrl;
}
```

#### Helper generateEmail.js:
```javascript
export function generateEmail(domain = 'teste.com') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `user_${timestamp}_${randomString}@${domain}`;
}
```

#### Helper login.js:
```javascript
export function login(email, password) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/auth/login`;
    
    const payload = JSON.stringify({
        email: email,
        password: password
    });
    
    const response = http.post(url, payload, params);
    // validações e retorno do token
}
```

---

### 4. Trends

**Arquivo:** `tests/k6/checkout.test.js`

A Trend é uma métrica customizada para monitorar valores específicos ao longo do tempo, neste caso o tempo de duração do checkout.

```javascript
import { Trend } from 'k6/metrics';

const checkoutDuration = new Trend('checkout_duration', true);

const startTime = new Date().getTime();

const checkoutResponse = http.post(
    `${baseUrl}/checkout`,
    checkoutPayload,
    checkoutParams
);

const duration = new Date().getTime() - startTime;
checkoutDuration.add(duration);
```

---

### 5. Faker (xk6-faker)

**Arquivo:** `tests/k6/checkout.test.js`

O xk6-faker é uma extensão do K6 que permite gerar dados aleatórios para testes. Note que é importado como módulo (sem chaves).

```javascript
import faker from 'k6/x/faker';

group('Registro de Usuário', function () {
    userName = faker.person.firstName();
    password = faker.internet.password();
});
```

---

### 6. Variável de Ambiente

**Arquivo:** `tests/k6/helpers/baseUrl.js`

A variável de ambiente BASE_URL permite configurar a URL base da API via linha de comando.

```javascript
export function getBaseUrl() {
    const baseUrl = __ENV.BASE_URL;
    
    if (!baseUrl) {
        return 'http://localhost:3000';
    }
    
    return baseUrl;
}
```

**Uso:**
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js
```

---

### 7. Stages

**Arquivo:** `tests/k6/checkout.test.js`

Os stages definem como a carga de usuários virtuais (VUs) evolui ao longo do tempo.

```javascript
export const options = {
    stages: [
        { duration: '5s', target: 10 },   // Ramp-up: sobe para 10 VUs em 5s
        { duration: '5s', target: 10 },   // Steady: mantém 10 VUs por 5s
        { duration: '5s', target: 0 },    // Ramp-down: desce para 0 VUs em 5s
    ],
};
```

---

### 8. Reaproveitamento de Resposta

**Arquivo:** `tests/k6/checkout.test.js`

O token obtido no login é reutilizado na requisição de checkout.

```javascript
let token;

group('Login do Usuário', function () {
    token = login(email, password);
});

group('Checkout', function () {
    const checkoutParams = {
        headers: getAuthHeaders(token),
    };
    
    const checkoutResponse = http.post(
        `${baseUrl}/checkout`,
        checkoutPayload,
        checkoutParams
    );
});
```

---

### 9. Uso de Token de Autenticação

**Arquivo:** `tests/k6/helpers/login.js` e `tests/k6/checkout.test.js`

O token Bearer JWT é extraído da resposta do login e usado nas requisições autenticadas.

```javascript
// Em helpers/login.js:
export function getAuthHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// Em checkout.test.js:
const checkoutParams = {
    headers: getAuthHeaders(token),
};
```

---

### 10. Data-Driven Testing

**Arquivo:** `tests/k6/checkout.test.js`

Os dados de teste são definidos em um array e passados para a função principal via setup.

```javascript
const checkoutTestData = [
    { productId: 1, quantity: 1, paymentMethod: 'cash' },
];

export function setup() {
    return { testData: checkoutTestData };
}

export default function (data) {
    group('Checkout', function () {
        const testCase = data.testData[0];
        
        const checkoutPayload = JSON.stringify({
            productId: testCase.productId,
            quantity: testCase.quantity,
            paymentMethod: testCase.paymentMethod,
        });
    });
}
```

---

### 11. Groups

**Arquivo:** `tests/k6/checkout.test.js`

Os groups organizam as ações em blocos lógicos, facilitando a análise dos resultados.

```javascript
group('Registro de Usuário', function () {
    // Lógica de registro
});

group('Login do Usuário', function () {
    token = login(email, password);
});

group('Checkout', function () {
    // Lógica de checkout com token de autenticação
});
```

---

### 12. Relatório HTML

**Arquivo:** `tests/k6/generateReport.js`

Script Node.js que processa o arquivo results.json e gera um relatório visual em HTML.

```javascript
const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'results.json');
const reportPath = path.join(__dirname, 'report.html');

function parseK6Results(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    // Processa métricas do K6
}

function generateHTML(metrics) {
    // Gera HTML com métricas e thresholds
}

const metrics = parseK6Results(resultsPath);
const html = generateHTML(metrics);
fs.writeFileSync(reportPath, html);
```

**Uso:**
```bash
node tests/k6/generateReport.js
```

---

## Critérios de Aceite

| Métrica | Critério | Descrição |
|---------|----------|-----------|
| `http_req_duration` | p(95) < 2000ms | 95% das requisições devem responder em menos de 2 segundos |
| `checkout_duration` | p(95) < 2000ms | 95% dos checkouts devem ser processados em menos de 2 segundos |
| `checks` | rate > 95% | Mais de 95% dos checks devem passar |

---

## Pré-requisitos

1. K6 instalado na máquina
2. Extensão xk6-faker instalada (para usar o faker)
3. API rodando localmente ou em ambiente de teste
4. Node.js instalado (para gerar relatório HTML)

---

## Interpretando os Resultados

Após a execução, o K6 exibirá um resumo com:

- **data_received**: Volume de dados recebidos
- **data_sent**: Volume de dados enviados
- **http_req_duration**: Tempo de resposta das requisições
- **checkout_duration**: Tempo de duração dos checkouts (Trend customizada)
- **checks**: Taxa de sucesso dos checks
- **iterations**: Número de iterações completadas

Os thresholds serão exibidos com PASSOU ou FALHOU.

---

## Arquivos Gerados

| Arquivo | Descrição |
|---------|-----------|
| `results.json` | Resultados brutos do K6 em formato JSON |
| `report.html` | Relatório visual em HTML com métricas e thresholds |
