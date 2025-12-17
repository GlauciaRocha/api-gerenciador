export function generateEmail(domain = 'teste.com') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `user_${timestamp}_${randomString}@${domain}`;
}

export function generateEmailWithPrefix(prefix, domain = 'teste.com') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomString}@${domain}`;
}

export default generateEmail;
