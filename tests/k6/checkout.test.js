/**
 * Teste de Performance K6 - Fluxo de Checkout
 * 
 * Este teste exercita o fluxo principal da API:
 * 1. Registro de usuário
 * 2. Login do usuário
 * 3. Checkout do pedido
 * 
 * Conceitos aplicados:
 * - Thresholds, Checks, Helpers, Trends, Faker (xk6-faker)
 * - Variável de Ambiente, Stages, Reaproveitamento de Resposta
 * - Uso de Token de Autenticação, Data-Driven Testing, Groups
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Importação do xk6-faker (módulo, sem chaves)
import faker from 'k6/x/faker';

// Importação dos Helpers
import { getBaseUrl } from './helpers/baseUrl.js';
import { generateEmail } from './helpers/generateEmail.js';
import { login, getAuthHeaders } from './helpers/login.js';

// =============================================================================
// TREND - Métrica customizada para monitorar tempo de checkout
// =============================================================================
const checkoutDuration = new Trend('checkout_duration', true);

// =============================================================================
// DATA-DRIVEN TESTING - Dados de teste para diferentes cenários de checkout
// =============================================================================
const checkoutTestData = [
    { productId: 1, quantity: 1, paymentMethod: 'cash' },
];

// =============================================================================
// OPTIONS - Configuração do teste com Thresholds e Stages
// =============================================================================
export const options = {
    // STAGES - Configuração de carga progressiva
    stages: [
        { duration: '5s', target: 10 },   // Ramp-up: sobe para 10 VUs em 5s
        { duration: '5s', target: 10 },   // Steady: mantém 10 VUs por 5s
        { duration: '5s', target: 0 },    // Ramp-down: desce para 0 VUs em 5s
    ],
    
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

// =============================================================================
// SETUP - Executado uma vez antes dos testes
// =============================================================================
export function setup() {
    console.log('🚀 Iniciando teste de performance do fluxo de checkout');
    console.log(`📍 Base URL: ${getBaseUrl()}`);
    return { testData: checkoutTestData };
}

// =============================================================================
// FUNÇÃO PRINCIPAL - Executada por cada VU
// =============================================================================
export default function (data) {
    const baseUrl = getBaseUrl();
    
    // Variáveis para reaproveitamento de resposta
    let email;
    let password;
    let userName;
    let token;
    
    // =========================================================================
    // GROUP 1: Registro de Usuário
    // =========================================================================
    group('Registro de Usuário', function () {
        // FAKER - Usando xk6-faker para gerar dados aleatórios
        // Nota: xk6-faker usa sintaxe diferente do faker.js tradicional
        userName = faker.person.firstName();
        password = faker.internet.password();
        
        // HELPER - Gerando email único
        email = generateEmail();
        
        const registerPayload = JSON.stringify({
            name: userName,
            email: email,
            password: password,
        });
        
        const registerParams = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const registerResponse = http.post(
            `${baseUrl}/auth/register`,
            registerPayload,
            registerParams
        );
        
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
        
        console.log(`✅ Usuário registrado: ${email}`);
    });
    
    // Pequena pausa entre grupos
    sleep(0.5);
    
    // =========================================================================
    // GROUP 2: Login do Usuário
    // =========================================================================
    group('Login do Usuário', function () {
        // HELPER - Usando função de login importada
        // REAPROVEITAMENTO DE RESPOSTA - O token será usado no checkout
        token = login(email, password);
        
        if (token) {
            console.log(`🔐 Login bem-sucedido para: ${email}`);
        }
    });
    
    // Pequena pausa entre grupos
    sleep(0.5);
    
    // =========================================================================
    // GROUP 3: Checkout
    // =========================================================================
    group('Checkout', function () {
        // DATA-DRIVEN TESTING - Usando dados de teste
        const testCase = data.testData[0];
        
        const checkoutPayload = JSON.stringify({
            productId: testCase.productId,
            quantity: testCase.quantity,
            paymentMethod: testCase.paymentMethod,
        });
        
        // USO DE TOKEN DE AUTENTICAÇÃO - Bearer JWT
        const checkoutParams = {
            headers: getAuthHeaders(token),
        };
        
        // Marca o tempo inicial para a Trend
        const startTime = new Date().getTime();
        
        const checkoutResponse = http.post(
            `${baseUrl}/checkout`,
            checkoutPayload,
            checkoutParams
        );
        
        // TREND - Registra o tempo de duração do checkout
        const duration = new Date().getTime() - startTime;
        checkoutDuration.add(duration);
        
        // CHECK - Verificação do status code de sucesso
        check(checkoutResponse, {
            'Checkout: status é 200 ou 201': (r) => r.status === 200 || r.status === 201,
            'Checkout: resposta contém confirmação': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.data || body.message || body.orderId;
                } catch (e) {
                    return false;
                }
            },
        });
        
        console.log(`🛒 Checkout realizado - Produto: ${testCase.productId}, Quantidade: ${testCase.quantity}, Pagamento: ${testCase.paymentMethod}`);
    });
    
    // Pausa entre iterações
    sleep(1);
}

// =============================================================================
// TEARDOWN - Executado uma vez após todos os testes
// =============================================================================
export function teardown(data) {
    console.log('🏁 Teste de performance finalizado');
    console.log('📊 Verifique o relatório para análise dos resultados');
}

