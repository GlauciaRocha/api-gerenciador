/**
 * Helper para geração de emails aleatórios únicos
 * 
 * Este helper gera emails únicos combinando timestamp e string aleatória,
 * garantindo unicidade para cada execução de teste.
 */

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

/**
 * Gera um email aleatório com prefixo customizado
 * @param {string} prefix - Prefixo do email
 * @param {string} domain - Domínio do email (padrão: 'teste.com')
 * @returns {string} Email único gerado
 */
export function generateEmailWithPrefix(prefix, domain = 'teste.com') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomString}@${domain}`;
}

export default generateEmail;

