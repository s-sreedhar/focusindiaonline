
import { Order } from '@/lib/types';

export const getEmailTemplate = (status: string, order: Order) => {
    const customerName = order.shippingAddress?.fullName || 'Valued Customer';
    const orderId = order.orderId || order.id.slice(0, 8);

    // Status color mapping for visual feedback
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'placed': '#9333ea', // purple
            'processing': '#eab308', // yellow
            'shipped': '#3b82f6', // blue
            'delivered': '#22c55e', // green
            'cancelled': '#ef4444', // red
            'returned': '#f97316', // orange
        };
        return colors[status.toLowerCase()] || '#6b7280';
    };

    const statusColor = getStatusColor(status);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const itemsList = order.items.map(item => `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
            <div style="font-weight: 500; font-size: 14px; color: #111827;">${item.title}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 13px; color: #6b7280;">
                <span>Qty: ${item.quantity}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
        </div>
    `).join('');

    const footer = `
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            <p>Thank you for shopping with Focus India Online</p>
            <p>If you have any questions, please reply to this email.</p>
        </div>
    `;

    const commonStyles = `
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #374151;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        background-color: #ffffff;
    `;

    const getStatusMessage = (status: string) => {
        switch (status.toLowerCase()) {
            case 'placed':
                return 'Thank you for your order! We have received it and will begin processing it soon.';
            case 'processing':
                return 'Your order is currently being processed and prepared for shipment.';
            case 'shipped':
                return 'Great news! Your order has been shipped and is on its way to you.';
            case 'delivered':
                return 'Your order has been delivered! We hope you enjoy your purchase.';
            case 'cancelled':
                return 'Your order has been cancelled.';
            case 'returned':
                return 'Your return request has been processed.';
            default:
                return `Your order status has been updated to ${status}.`;
        }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="${commonStyles}">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0;">Order Update</h1>
                <p style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em;">${status}</p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
                <p>${getStatusMessage(status)}</p>
                <p>Order ID: <strong>#${orderId}</strong></p>
            </div>

            <div style="margin-bottom: 24px;">
                <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid ${statusColor}; padding-bottom: 8px; display: inline-block;">Order Details</h3>
                ${itemsList}
            </div>

            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                    <span>Subtotal</span>
                    <span>${formatCurrency(order.subtotal || 0)}</span>
                </div>
                ${(order.shippingCharges || 0) > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                    <span>Shipping</span>
                    <span>${formatCurrency(order.shippingCharges || 0)}</span>
                </div>` : ''}
                ${(order.discount || 0) > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #16a34a;">
                    <span>Discount</span>
                    <span>-${formatCurrency(order.discount || 0)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #111827;">
                    <span>Total</span>
                    <span>${formatCurrency(order.totalAmount)}</span>
                </div>
            </div>
        </div>

            ${footer}
</div>
    </body>
    </html>
        `;

    const subject = `Order Status Update - ${status.toUpperCase()} (Order #${orderId})`;

    return { subject, htmlContent };
};
