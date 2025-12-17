import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

import faker from 'k6/x/faker';

import { getBaseUrl } from './helpers/baseUrl.js';
import { generateEmail } from './helpers/generateEmail.js';
import { login, getAuthHeaders } from './helpers/login.js';

const checkoutDuration = new Trend('checkout_duration', true);

const checkoutTestData = [
    { productId: 1, quantity: 1, paymentMethod: 'cash' },
];

export const options = {
    stages: [
        { duration: '5s', target: 10 },
        { duration: '5s', target: 10 },
        { duration: '5s', target: 0 },
    ],
    
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'checkout_duration': ['p(95)<2000'],
        'checks': ['rate>0.95'],
    },
};

export function setup() {
    console.log('Iniciando teste de performance do fluxo de checkout');
    console.log(`Base URL: ${getBaseUrl()}`);
    return { testData: checkoutTestData };
}

export default function (data) {
    const baseUrl = getBaseUrl();
    
    let email;
    let password;
    let userName;
    let token;
    
    group('Registro de Usuário', function () {
        userName = faker.person.firstName();
        password = faker.internet.password();
        
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
        
        console.log(`Usuário registrado: ${email}`);
    });
    
    sleep(0.5);
    
    group('Login do Usuário', function () {
        token = login(email, password);
        
        if (token) {
            console.log(`Login bem-sucedido para: ${email}`);
        }
    });
    
    sleep(0.5);
    
    group('Checkout', function () {
        const testCase = data.testData[0];
        
        const checkoutPayload = JSON.stringify({
            productId: testCase.productId,
            quantity: testCase.quantity,
            paymentMethod: testCase.paymentMethod,
        });
        
        const checkoutParams = {
            headers: getAuthHeaders(token),
        };
        
        const startTime = new Date().getTime();
        
        const checkoutResponse = http.post(
            `${baseUrl}/checkout`,
            checkoutPayload,
            checkoutParams
        );
        
        const duration = new Date().getTime() - startTime;
        checkoutDuration.add(duration);
        
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
        
        console.log(`Checkout realizado - Produto: ${testCase.productId}, Quantidade: ${testCase.quantity}, Pagamento: ${testCase.paymentMethod}`);
    });
    
    sleep(1);
}

export function teardown(data) {
    console.log('Teste de performance finalizado');
    console.log('Verifique o relatório para análise dos resultados');
}
