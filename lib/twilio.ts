import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;

export const sendWhatsAppNotification = async (
    orderId: string,
    customerName: string,
    amount: number,
    items: string,
    status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
) => {
    if (!accountSid || !authToken || !twilioPhoneNumber || !adminPhoneNumber) {
        console.error('[Twilio Config Error] Twilio credentials or phone numbers are missing');
        return { success: false, error: 'Missing configuration' };
    }

    const client = twilio(accountSid, authToken);

    // Ensure E.164 format for Indian numbers if prefix is missing
    // User can provide number with or without +91 in .env
    let formattedAdminPhone = adminPhoneNumber.trim();
    if (!formattedAdminPhone.startsWith('+')) {
        // Assume India if no code provided
        formattedAdminPhone = `+91${formattedAdminPhone}`;
    }

    try {
        // console.log(`[Twilio] Attempting to send WhatsApp message`);
        // console.log(`[Twilio] To: whatsapp:${formattedAdminPhone}`);

        // Construct message based on status
        let body = '';
        if (status === 'SUCCESS') {
            body = `New Order Received! 🎉\n\nOrder ID: ${orderId}\nCustomer: ${customerName}\nAmount: ₹${amount}\nItems: ${items}\nStatus: Paid ✅`;
        } else {
            body = `Order Payment Failed! ❌\n\nOrder ID: ${orderId}\nCustomer: ${customerName}\nAmount: ₹${amount}\nItems: ${items}\nStatus: Failed ⚠️`;
        }

        // Check for double 'whatsapp:' prefix in source number
        const fromNumber = twilioPhoneNumber.startsWith('whatsapp:')
            ? twilioPhoneNumber
            : `whatsapp:${twilioPhoneNumber}`;

        const message = await client.messages.create({
            body: body,
            from: fromNumber,
            to: `whatsapp:${formattedAdminPhone}`
        });

        // console.log('[Twilio] WhatsApp notification sent. SID:', message.sid);
        return { success: true, sid: message.sid };
    } catch (error: any) {
        console.error('[Twilio Error] Failed to send WhatsApp notification:', {
            message: error.message,
            code: error.code,
            moreInfo: error.moreInfo,
            status: error.status
        });
        return { success: false, error: error.message };
    }
};
