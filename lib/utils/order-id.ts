/**
 * Generates a unique order ID in the format ORD-YYYYMMDD-HHMMSS-RAND
 * Example: ORD-20240320-143000-12345
 */
export function generateOrderId(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Generate a random 5-digit number
    const random = Math.floor(10000 + Math.random() * 90000);

    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}
