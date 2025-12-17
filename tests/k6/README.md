# Teste de Performance K6 - Fluxo de Checkout

Este projeto contém testes de performance automatizados usando K6 para exercitar a API de Gerenciador de Tarefas.

## 📋 Estrutura do Projeto

```
tests/k6/
├── checkout.test.js      # Teste principal do fluxo de checkout
├── helpers/
│   ├── baseUrl.js        # Helper para variável de ambiente BASE_URL
│   ├── generateEmail.js  # Helper para geração de emails aleatórios
│   └── login.js          # Helper para função de login reutilizável
└── README.md             # Este arquivo
```

## 🚀 Como Executar

### Execução básica:
```bash
k6 run tests/k6/checkout.test.js
```

### Com variável de ambiente BASE_URL:
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js
```

### Gerando relatório HTML:
```bash
k6 run -e BASE_URL=http://localhost:3000 tests/k6/checkout.test.js --out json=results.json
```

Para converter em HTML, use ferramentas como k6-reporter ou k6-html-reporter.

---

## 📚 Conceitos Aplicados

### 1. Thresholds

**Arquivo:** `tests/k6/checkout.test.js`

Os thresholds definem os critérios de aceite do teste. Se qualquer threshold falhar, o teste é considerado como falha.

```javascript
export const options = {
    // THRESHOLDS - Critérios de aceite do teste
    thresholds: {
        // Percentil 95 do tempo de resposta deve ser menor que 2 segundos
        'http_req_duration': ['p(95)<2000'],
        
        // Threshold específico para o checkout
        'checkout_duration': ['p(95)<2000'],
        
        // Taxa de sucesso dos checks deve ser maior que 95%
        'checks': ['rate>0.95'],
    },
};
```

---

### 2. Checks

**Arquivo:** `tests/k6/checkout.test.js`

Os checks validam as respostas das requisições HTTP, verificando status codes e conteúdo das respostas.

```javascript
// CHECK - Verificação do status code de sucesso
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
/**
 * Obtém a URL base da API a partir da variável de ambiente BASE_URL
 * @returns {string} URL base da API
 */
export function getBaseUrl() {
    const baseUrl = __ENV.BASE_URL;
    
    if (!baseUrl) {
        console.warn('⚠️ BASE_URL não definida. Usando valor padrão: http://localhost:3000');
        return 'http://localhost:3000';
    }
    
    return baseUrl;
}
```

#### Helper generateEmail.js:
```javascript
/**
 * Gera um email aleatório único
 * @param {string} domain - Domínio do email (padrão: 'teste.com')
 * @returns {string} Email único gerado
 */
export function generateEmail(domain = 'teste.com') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `user_${timestamp}_${randomString}@${domain}`;
}
```

#### Helper login.js:
```javascript
/**
 * Realiza login na API e retorna o token JWT
 */
export function login(email, password) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/auth/login`;
    
    const payload = JSON.stringify({
        email: email,
        password: password
    });
    
    const response = http.post(url, payload, params);
    // ... validações e retorno do token
}
```

---

### 4. Trends

**Arquivo:** `tests/k6/checkout.test.js`

A Trend é uma métrica customizada para monitorar valores específicos ao longo do tempo, neste caso o tempo de duração do checkout.

```javascript
import { Trend } from 'k6/metrics';

// TREND - Métrica customizada para monitorar tempo de checkout
const checkoutDuration = new Trend('checkout_duration', true);

// Dentro do grupo Checkout:
const startTime = new Date().getTime();

const checkoutResponse = http.post(
    `${baseUrl}/checkout`,
    checkoutPayload,
    checkoutParams
);

// TREND - Registra o tempo de duração do checkout
const duration = new Date().getTime() - startTime;
checkoutDuration.add(duration);
```

---

### 5. Faker (xk6-faker)

**Arquivo:** `tests/k6/checkout.test.js`

O xk6-faker é uma extensão do K6 que permite gerar dados aleatórios para testes. Note que é importado como módulo (sem chaves).

```javascript
// Importação do xk6-faker (módulo, sem chaves)
import faker from 'k6/x/faker';

// FAKER - Usando xk6-faker para gerar dados aleatórios
group('Registro de Usuário', function () {
    userName = faker.person.firstName();
    password = faker.internet.password(12, true);
    // ...
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
        console.warn('⚠️ BASE_URL não definida. Usando valor padrão: http://localhost:3000');
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
    // STAGES - Configuração de carga progressiva
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
// Variáveis para reaproveitamento de resposta
let token;

group('Login do Usuário', function () {
    // REAPROVEITAMENTO DE RESPOSTA - O token será usado no checkout
    token = login(email, password);
});

group('Checkout', function () {
    // USO DE TOKEN DE AUTENTICAÇÃO - Bearer JWT
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
// DATA-DRIVEN TESTING - Dados de teste para diferentes cenários de checkout
const checkoutTestData = [
    { productId: 1, quantity: 1, paymentMethod: 'cash' },
];

export function setup() {
    return { testData: checkoutTestData };
}

export default function (data) {
    group('Checkout', function () {
        // DATA-DRIVEN TESTING - Usando dados de teste
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
    // HELPER - Usando função de login importada
    token = login(email, password);
});

group('Checkout', function () {
    // Lógica de checkout com token de autenticação
});
```

---

## 📊 Critérios de Aceite

| Métrica | Critério | Descrição |
|---------|----------|-----------|
| `http_req_duration` | p(95) < 2000ms | 95% das requisições devem responder em menos de 2 segundos |
| `checkout_duration` | p(95) < 2000ms | 95% dos checkouts devem ser processados em menos de 2 segundos |
| `checks` | rate > 95% | Mais de 95% dos checks devem passar |

---

## 🔧 Pré-requisitos

1. K6 instalado na máquina
2. Extensão xk6-faker instalada (para usar o faker)
3. API rodando localmente ou em ambiente de teste

### Instalando xk6-faker:

Se você não tem o K6 com a extensão faker, pode usar o k6 com extensões:

```bash
xk6 build --with github.com/szkiba/xk6-faker@latest
```

Ou usar o K6 Cloud que já possui extensões disponíveis.

---

## 📈 Interpretando os Resultados

Após a execução, o K6 exibirá um resumo com:

- **data_received**: Volume de dados recebidos
- **data_sent**: Volume de dados enviados
- **http_req_duration**: Tempo de resposta das requisições
- **checkout_duration**: Tempo de duração dos checkouts (Trend customizada)
- **checks**: Taxa de sucesso dos checks
- **iterations**: Número de iterações completadas

Os thresholds serão exibidos com ✓ (passou) ou ✗ (falhou).

