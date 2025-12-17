import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl } from './baseUrl.js';

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
    
    console.error(`Falha no login para ${email}: ${response.status} - ${response.body}`);
    return null;
}

export function getAuthHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export default login;
