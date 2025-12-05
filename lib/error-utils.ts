import { toast } from "sonner";

export const handleFirebaseError = (error: any) => {
    console.error("Firebase Error:", error);

    let message = "An unexpected error occurred. Please try again.";

    if (error.code) {
        switch (error.code) {
            case 'unavailable':
            case 'client-offline':
                message = "You are offline. Please check your internet connection.";
                break;
            case 'auth/too-many-requests':
                message = "Too many attempts. Please try again later.";
                break;
            case 'auth/invalid-phone-number':
                message = "Invalid phone number format.";
                break;
            case 'auth/code-expired':
                message = "OTP has expired. Please request a new one.";
                break;
            case 'auth/invalid-verification-code':
                message = "Invalid OTP. Please check and try again.";
                break;
            case 'auth/quota-exceeded':
                message = "SMS quota exceeded. Please contact support.";
                break;
            case 'auth/operation-not-allowed':
                message = "Phone authentication is not enabled. Please contact support.";
                break;
            case 'auth/invalid-app-credential':
                message = "App configuration error. Please refresh and try again.";
                break;
            default:
                if (error.message && error.message.includes('offline')) {
                    message = "You are offline. Please check your internet connection.";
                } else {
                    message = error.message || message;
                }
        }
    } else if (error.message && error.message.includes('offline')) {
        message = "You are offline. Please check your internet connection.";
    }

    toast.error(message);
    return message;
};
