# Web-Based Admin Panel Setup Guide

## 🌐 Access Your Admin Panel

**Login URL:** https://shadowlogsshop.web.app/admin-login.html

### Default Admin Credentials:
- **Email:** `admin@shadowlogsshop.com`
- **Password:** `Admin@2026!`

⚠️ **IMPORTANT:** Change these credentials immediately after first login!

---

## 📋 Setup Steps

### Step 1: Create Firebase Admin Account

1. Go to: https://console.firebase.google.com/project/shadowlogsshop/authentication
2. Click "Add User"
3. Enter:
   - Email: `admin@shadowlogsshop.com`
   - Password: `Admin@2026!` (or your own secure password)
4. Click "Add User"

### Step 2: Enable Firestore Database

1. Go to: https://console.firebase.google.com/project/shadowlogsshop/firestore
2. Click "Create Database"
3. Select "Production mode"
4. Choose your region
5. Click "Enable"

### Step 3: Deploy Admin Files

```powershell
firebase deploy
```

### Step 4: Access Admin Panel

1. Visit: https://shadowlogsshop.web.app/admin-login.html
2. Login with admin credentials
3. Start managing products!

---

## 🔒 Security Features

✅ **Password Protected** - Only authorized users can login  
✅ **Hidden URL** - Regular users won't find `/admin-login.html`  
✅ **Firebase Auth** - Secure authentication system  
✅ **Auto Redirect** - Logged-in users go straight to admin panel  
✅ **Session Management** - Stay logged in until you logout

---

## 🎯 What You Can Do

### From the Web Admin Panel:
- ✅ View all products from all categories
- ✅ Change product status (Available/Sold/Pending) with one click
- ✅ Add new products to any category
- ✅ Create new categories
- ✅ Delete products
- ✅ See real-time statistics
- ✅ Changes save to Firestore database
- ✅ Products load dynamically on your website

### Changes Are INSTANT:
When you update a product status or add a product, it appears on your live website immediately!

---

## 🔑 Change Admin Password

### Option 1: Firebase Console
1. Go to: https://console.firebase.google.com/project/shadowlogsshop/authentication
2. Click on admin user
3. Click "Reset Password" or "Edit"
4. Set new password

### Option 2: Update in Code
Edit `admin-login.html` lines 79-80:
```javascript
const ADMIN_EMAIL = "admin@shadowlogsshop.com";
const ADMIN_PASSWORD = "YourNewPassword123!";
```
Then deploy: `firebase deploy`

---

## 📱 How It Works

1. **You login** at `/admin-login.html`
2. **Manage products** via web interface
3. **Data saves** to Firestore database
4. **Customers see** updated products instantly
5. **No local server needed** - works from anywhere!

---

## 🆚 Comparison: Local vs Web Admin

| Feature | Local Admin (npm start) | Web Admin (website) |
|---------|------------------------|---------------------|
| Access from anywhere | ❌ No | ✅ Yes |
| Edit HTML files directly | ✅ Yes | ❌ No |
| Use Firestore database | ❌ No | ✅ Yes |
| Password protected | ❌ No | ✅ Yes |
| Deploy needed after changes | ✅ Yes | ❌ No (instant) |
| Best for | Initial setup, bulk edits | Daily management |

---

## 🚀 Recommended Workflow

1. **First Time Setup:**
   - Use local admin (`npm start`) to create all categories
   - Add initial products to each category
   - Deploy everything: `firebase deploy`

2. **Daily Management:**
   - Use web admin (website/admin-login.html)
   - Update product statuses
   - Add new products as they come in
   - Changes are instant - no deployment needed!

3. **Bulk Changes:**
   - Use local admin for mass updates
   - Deploy when done

---

## 🔗 Important URLs

- **Admin Login:** https://shadowlogsshop.web.app/admin-login.html
- **Firebase Console:** https://console.firebase.google.com/project/shadowlogsshop
- **Live Website:** https://shadowlogsshop.web.app

---

## ⚠️ Troubleshooting

**Can't login?**
- Make sure you created the admin user in Firebase Authentication
- Check email and password are correct
- Clear browser cache and try again

**Products not showing?**
- Ensure Firestore is enabled
- Check firestore.rules are deployed
- Make sure product-loader.js is included in HTML files

**Changes not saving?**
- Check browser console for errors
- Verify Firestore rules allow admin writes
- Ensure you're logged in as admin user

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Open browser DevTools (F12) and check Console
3. Verify all deployment steps were completed

**Keep your admin credentials secure and never share them!**
