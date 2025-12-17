/**
 * Helper para função de login reutilizável
 * 
 * Este helper encapsula a lógica de autenticação, permitindo
 * reutilização em múltiplos testes de performance.
 */

import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './baseUrl.js';

/**
 * Realiza login na API e retorna o token JWT
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {string|null} Token JWT ou null em caso de falha
 */
export function login(email, password) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/auth/login`;
    
    const payload = JSON.stringify({
        email: email,
        password: password
    });
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = http.post(url, payload, params);
    
    const loginSuccess = check(response, {
        'Login: status é 200': (r) => r.status === 200,
        'Login: resposta contém token': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.token;
        },
    });
    
    if (loginSuccess) {
        const body = JSON.parse(response.body);
        return body.data.token;
    }
    
    console.error(`❌ Falha no login para ${email}: ${response.status} - ${response.body}`);
    return null;
}

/**
 * Cria headers de autorização com Bearer token
 * @param {string} token - Token JWT
 * @returns {Object} Headers com autorização
 */
export function getAuthHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export default login;

