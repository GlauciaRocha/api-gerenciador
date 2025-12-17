/**
 * Helper para obtenção da BASE_URL através de variável de ambiente
 * 
 * Este helper centraliza a lógica de obtenção da URL base da API,
 * permitindo que o valor seja configurado via linha de comando.
 * 
 * Uso: k6 run -e BASE_URL=http://localhost:3000 checkout.test.js
 */

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

export default getBaseUrl;

