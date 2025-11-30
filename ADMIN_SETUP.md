# Admin Setup Guide - Focus India Online

This guide explains how to set up admin access for the Focus India Online application.

## Understanding Admin Access

The admin panel (`/admin`) is protected and requires users to have the `superadmin` role. By default, all new users are created with the `customer` role.

## Setting Up Admin Access

### Prerequisites
- Firebase Console access
- A registered user account in the application

### Steps to Grant Admin Access

1. **Create a User Account** (if you haven't already)
   - Go to the application and register a new account
   - Complete the registration process
   - Note down the email/phone you used for registration

2. **Access Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: "Focus India Online"
   - Navigate to **Firestore Database** from the left sidebar

3. **Locate the User Document**
   - In Firestore, navigate to the `users` collection
   - Find the document corresponding to your user account
   - You can identify it by the email or phone number field

4. **Update the User Role**
   - Click on the user document to open it
   - Look for the `role` field
   - If the `role` field doesn't exist, add it:
     - Click "Add field"
     - Field name: `role`7
     - Field type: `string`
     - Field value: `superadmin`
   - If the `role` field exists, edit it:
     - Click on the current value
     - Change it to: `superadmin`
   - Save the changes

5. **Verify Admin Access**
   - Log out of the application (if currently logged in)
   - Log back in with the account you just updated
   - Navigate to `/admin`
   - You should now see the admin dashboard

## Troubleshooting

### Issue: Still can't access /admin after updating role

**Solution:**
1. Clear your browser cache and cookies
2. Log out completely from the application
3. Close all browser tabs
4. Open a new browser tab and log in again
5. Try accessing `/admin` again

### Issue: Getting redirected to home page

**Solution:**
1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for messages starting with `[Admin Layout]`
4. Check what role is being detected:
   - If it shows `role: customer`, the Firestore update hasn't taken effect yet
   - If it shows `role: undefined`, the role field might not exist in Firestore
   - If it shows `role: superadmin`, but still redirecting, clear cache and try again

### Issue: Changes in Firestore not reflecting

**Solution:**
1. Make sure you saved the changes in Firestore Console
2. Wait a few seconds for the changes to propagate
3. Log out and log back in to refresh the authentication state
4. Check the browser's Application/Storage tab and clear the `auth-storage` from localStorage

## Security Notes

- **Never share admin credentials**: Admin accounts have full access to the system
- **Limit admin accounts**: Only create admin accounts for trusted users
- **Regular audits**: Periodically review the list of admin users in Firestore
- **Use strong passwords**: Ensure admin accounts use strong, unique passwords

## Available Admin Roles

Currently, the application supports the following roles:

- `customer` - Regular user (default)
- `superadmin` - Full admin access

## Admin Panel Features

Once you have admin access, you can:

- View dashboard with sales, orders, products, and user statistics
- Manage books/products
- View and manage orders
- View user list
- Configure system settings

## Need Help?

If you're still having trouble accessing the admin panel:

1. Check the browser console for error messages
2. Verify the user document exists in Firestore
3. Ensure the `role` field is exactly `superadmin` (case-sensitive)
4. Contact the development team for assistance

---

**Last Updated:** November 30, 2024
