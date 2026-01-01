import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;

export const sendWhatsAppNotification = async (
    orderId: string,
    customerName: string,
    amount: number,
    items: string
) => {
    if (!accountSid || !authToken || !twilioPhoneNumber || !adminPhoneNumber) {
        console.error('Twilio credentials or phone numbers are missing');
        return { success: false, error: 'Missing configuration' };
    }

    const client = twilio(accountSid, authToken);

    // Ensure E.164 format for Indian numbers if prefix is missing
    let formattedAdminPhone = adminPhoneNumber;
    if (!adminPhoneNumber.startsWith('+')) {
        formattedAdminPhone = `+91${adminPhoneNumber}`;
    }

    // console.log(`Attempting to send WhatsApp to: ${formattedAdminPhone}`);

    try {
        const message = await client.messages.create({
            body: `New Order Received!\n\nOrder ID: ${orderId}\nCustomer: ${customerName}\nAmount: ₹${amount}\nItems: ${items}`,
            from: `whatsapp:${twilioPhoneNumber}`,
            to: `whatsapp:${formattedAdminPhone}`
        });

        console.log('WhatsApp notification sent:', message.sid);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return { success: false, error };
    }
};
