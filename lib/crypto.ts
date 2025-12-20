export async function hashPassword(password: string): Promise<string> {
    // console.log('[Crypto] Hashing password...');
    const start = performance.now();
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const result = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    // console.log(`[Crypto] Password hashed in ${performance.now() - start}ms`);
    return result;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    // console.log('[Crypto] Verifying password...');
    const newHash = await hashPassword(password);
    return newHash === hash;
}
