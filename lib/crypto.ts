export async function hashPassword(password: string): Promise<string> {
    console.log('[Crypto] Hashing password, length:', password.length);
    const start = performance.now();
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const result = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    console.log(`[Crypto] Password hashed in ${performance.now() - start}ms, hash length:`, result.length);
    console.log('[Crypto] Hash preview:', result.substring(0, 20) + '...');
    return result;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log('[Crypto] Verifying password...');
    console.log('[Crypto] Stored hash length:', hash?.length);
    console.log('[Crypto] Stored hash preview:', hash?.substring(0, 20) + '...');
    const newHash = await hashPassword(password);
    const result = newHash === hash;
    console.log('[Crypto] Verification result:', result);
    if (!result) {
        console.log('[Crypto] Hash mismatch!');
        console.log('[Crypto] Expected:', hash?.substring(0, 40));
        console.log('[Crypto] Got:     ', newHash.substring(0, 40));
    }
    return result;
}
