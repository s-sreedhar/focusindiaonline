# Firebase Phone Authentication Setup Guide

## Error: `auth/configuration-not-found`

This error occurs when Firebase Phone Authentication is not properly configured in your Firebase Console. Follow these steps to fix it.

---

## Step-by-Step Setup

### 1. Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **focusindiaonline-ea702**
3. In the left sidebar, click **Authentication**
4. Click on the **Sign-in method** tab
5. Find **Phone** in the list of providers
6. Click on **Phone** to expand it
7. Toggle the **Enable** switch to ON
8. Click **Save**

---

### 2. Add Authorized Domains

Phone authentication requires your domain to be authorized:

1. Still in **Authentication** → **Sign-in method**
2. Scroll down to **Authorized domains**
3. Add the following domains:
   - `localhost` (should already be there)
   - `focusindiaonline.com` (your production domain)
   - Any other domains you'll use for testing

---

### 3. Configure reCAPTCHA (Important!)

Firebase Phone Auth uses reCAPTCHA for verification. You need to configure it:

#### Option A: Use Firebase's Default reCAPTCHA (Recommended for Development)

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Phone number sign-in**
3. Make sure **reCAPTCHA enforcement** is set to **Enforce**

#### Option B: Use Your Own reCAPTCHA Keys (For Production)

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site:
   - **Label**: Focus India Online
   - **reCAPTCHA type**: reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains**: Add `localhost` and `focusindiaonline.com`
3. Copy the **Site Key** and **Secret Key**
4. In Firebase Console → **Authentication** → **Settings**
5. Under **Phone number sign-in**, add your reCAPTCHA keys

---

### 4. Set Up Test Phone Numbers (Optional - For Testing)

To test without using real SMS:

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Scroll to **Phone numbers for testing**
3. Click **Add phone number**
4. Add a test number (e.g., `+919999999999`) and a verification code (e.g., `123456`)
5. Click **Add**

Now you can use this number for testing without receiving actual SMS.

---

### 5. Enable Cloud Functions (If Using Firebase Functions)

If you're using Firebase Cloud Functions for SMS:

1. Go to Firebase Console → **Functions**
2. Upgrade to **Blaze Plan** (pay-as-you-go) if needed
3. SMS sending requires billing to be enabled

---

### 6. Check Firebase Project Settings

Verify your Firebase configuration is correct:

1. Go to Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Find your web app
4. Verify the config matches your `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDn5TTp1thOL4n_5o9Mu6mDkEtLAx1jhLM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=focusindiaonline-ea702.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=focusindiaonline-ea702
```

---

## After Configuration

Once you've completed the above steps:

1. **Clear browser cache** and cookies
2. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   pnpm run dev
   ```
3. **Test the registration flow** at `/register`

---

## Troubleshooting

### Error: "reCAPTCHA verification failed"

**Solution:**
- Make sure `localhost` is in authorized domains
- Clear browser cache
- Try in incognito/private mode
- Check browser console for reCAPTCHA errors

---

### Error: "SMS quota exceeded"

**Solution:**
- Firebase has a daily SMS limit on the free plan
- Upgrade to Blaze plan for higher limits
- Use test phone numbers for development

---

### Error: "Invalid phone number"

**Solution:**
- Phone numbers must be in E.164 format: `+[country code][number]`
- For India: `+919876543210` (10 digits after +91)
- The code automatically adds `+91` prefix

---

### Still Getting `auth/configuration-not-found`?

1. **Wait 5-10 minutes** after enabling Phone Auth (Firebase needs time to propagate)
2. **Clear browser cache completely**
3. **Restart dev server**
4. **Check Firebase Console** → Authentication → Sign-in method → Phone is **Enabled**
5. **Verify API key** in `.env.local` matches Firebase Console

---

## Important Notes

> [!WARNING]
> **SMS Costs**: Firebase Phone Auth sends real SMS messages. On the free Spark plan, you get limited SMS per day. For production, upgrade to Blaze plan.

> [!IMPORTANT]
> **Security**: Never commit Firebase credentials to Git. The `.env.local` file should be in `.gitignore`.

> [!TIP]
> **Development**: Use test phone numbers (configured in Firebase Console) to avoid SMS costs during development.

---

## Quick Checklist

Before testing phone authentication, verify:

- [ ] Phone authentication is **enabled** in Firebase Console
- [ ] `localhost` is in **authorized domains**
- [ ] reCAPTCHA is **configured**
- [ ] `.env.local` has correct Firebase credentials
- [ ] Browser cache is **cleared**
- [ ] Dev server is **restarted**

---

## Need Help?

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Check Firebase Console → **Authentication** → **Users** to see if any users were created
3. Verify your Firebase project is on the correct billing plan
4. Contact Firebase Support if the issue persists

---

**Last Updated:** November 30, 2024
