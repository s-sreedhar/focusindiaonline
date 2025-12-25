export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
    const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;

    if (!apiKey) {
        //console.error('Brevo API Key not found');
        return;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'Focus India Online',
                    email: 'noreply@focusindiaonline.com'
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            //console.error('Error sending email:', JSON.stringify(errorData, null, 2));
            return { success: false, error: errorData };
        }

        // console.log('Email sent successfully');
        return { success: true };
    } catch (error) {
        //console.error('Error sending email:', error);
        return { success: false, error };
    }
};
