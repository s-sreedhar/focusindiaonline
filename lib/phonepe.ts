import crypto from 'crypto';

export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
export const PHONEPE_ENV = process.env.NEXT_PUBLIC_PHONEPE_ENV || 'sandbox';

export const PHONEPE_BASE_URL = PHONEPE_ENV === 'production'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

export const generateChecksum = (payload: string, endpoint: string) => {
    const stringToSign = payload + endpoint + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    return `${sha256}###${PHONEPE_SALT_INDEX}`;
};

export const base64Encode = (data: any) => {
    return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const verifyChecksum = (payload: string, checksum: string) => {
    const calculatedChecksum = generateChecksum(payload, '');
    // Note: For callback verification, the endpoint part might be different or empty depending on how PhonePe sends it.
    // Usually, PhonePe sends X-VERIFY header which is SHA256(base64Body + saltKey) + ### + saltIndex

    const stringToSign = payload + PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const expectedChecksum = `${sha256}###${PHONEPE_SALT_INDEX}`;

    return checksum === expectedChecksum;
};
