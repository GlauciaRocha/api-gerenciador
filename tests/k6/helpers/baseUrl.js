export function getBaseUrl() {
    const baseUrl = __ENV.BASE_URL;
    
    if (!baseUrl) {
        console.warn('http://localhost:3000');
        return 'http://localhost:3000';
    }
    
    return baseUrl;
}

export default getBaseUrl;
