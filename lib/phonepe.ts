import crypto from 'crypto';

export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || process.env.PHONEPE_API_KEY;
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
export const PHONEPE_ENV = process.env.NEXT_PUBLIC_PHONEPE_ENV || 'sandbox';

export const PHONEPE_BASE_URL = process.env.NEXT_PUBLIC_PHONEPE_ENV === 'production'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

export const generateChecksum = (payload: string, endpoint: string) => {
    // Standard PhonePe Checksum: SHA256(Base64Body + Endpoint + SaltKey) + ### + SaltIndex
    const stringToSign = payload + endpoint + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    return `${sha256}###${PHONEPE_SALT_INDEX}`;
};

export const base64Encode = (data: any) => {
    return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const verifyChecksum = (payload: string, checksum: string) => {
    // For callbacks, PhonePe usually sends X-VERIFY matching: SHA256(responseBody + SaltKey) + ### + SaltIndex
    // The "endpoint" is not included in callback verification usually, just the body.

    const stringToSign = payload + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const expectedChecksum = `${sha256}###${PHONEPE_SALT_INDEX}`;

    return checksum === expectedChecksum;
};

export const checkPaymentStatus = async (merchantTransactionId: string) => {
    const merchantId = PHONEPE_MERCHANT_ID;
    const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    // For Status Check, there is no body, so string to sign is: /pg/v1/status/{merchantId}/{merchantTransactionId} + SaltKey
    const stringToSign = endpoint + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = `${sha256}###${PHONEPE_SALT_INDEX}`;

    if (!merchantId) {
        throw new Error('PHONEPE_MERCHANT_ID is not defined');
    }

    try {
        const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-MERCHANT-ID': merchantId,
                'X-VERIFY': checksum,
            },
        });

        const data = await response.json();
        return data; // Returns the full response object
    } catch (error: any) {
        // Redact any sensitive information if present in error object before logging
        // Use error.message to avoid printing full HTTP response objects that might contain headers
        //console.error('PhonePe Status Check Error:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
};
