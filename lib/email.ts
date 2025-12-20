import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();

// Configure API key authorization: api-key
// Configure API key authorization: api-key
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
}

export const sendOrderConfirmationEmail = async (order: OrderDetails) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY is not set. Email not sent.');
    return;
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = `Order Confirmation - ${order.orderId}`;
  sendSmtpEmail.sender = { "name": "Focus India", "email": "noreply@focusindia.com" };
  sendSmtpEmail.to = [{ "email": order.customerEmail, "name": order.customerName }];

  // Create HTML content for the email
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
    </tr>
  `).join('');

  sendSmtpEmail.htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #5f259f; text-align: center;">Thank you for your order!</h2>
          <p>Hi ${order.customerName},</p>
          <p>Your order has been confirmed. Here are the details:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0;"><strong>Order ID:</strong> ${order.orderId}</p>
            <p style="margin: 0;"><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <p>We will notify you once your order is shipped.</p>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} Focus India. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    // console.log('Email sent successfully. Returned data: ' + JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
