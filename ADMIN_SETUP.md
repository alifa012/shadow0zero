# Admin Product Management System - Setup Guide

## 📁 Files Created

1. **admin-products.html** - Admin interface for managing categories and products
2. **assets/js/admin-products.js** - JavaScript for admin CRUD operations
3. **assets/js/product-loader.js** - Script to load products dynamically on pages
4. **firestore.rules** - Security rules for Firestore database
5. **ADMIN_SETUP.md** - This file

## 🚀 Setup Instructions

### Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/project/shadowlogsshop)
2. Click **Firestore Database** in left menu
3. Click **Create Database**
4. Choose **Production mode** for now (we'll update rules next)
5. Select your region (closest to your users)
6. Click **Enable**

### Step 2: Deploy Firestore Security Rules

Run in your terminal:
```powershell
firebase deploy --only firestore:rules
```

This will deploy the security rules from `firestore.rules` file.

### Step 3: Set Up Admin Access

You need to give yourself admin privileges. Two options:

#### Option A: Quick - Email-based (Recommended for testing)
The rules automatically grant admin access to: `admin@shadowlogsshop.com`

Just log in with this email address (or change it in firestore.rules).

#### Option B: Advanced - Database role
1. Go to Firestore Console
2. Create a collection called `admins`
3. Add a document with ID = your user UID
4. Set field: `role: "admin"`

To find your UID:
- Log into your site
- Open browser console
- Run: `firebase.auth().currentUser.uid`

### Step 4: Access Admin Panel

1. Deploy all files:
```powershell
firebase deploy --only hosting
```

2. Navigate to: `https://shadowlogsshop.web.app/admin-products.html`

3. Log in with your admin account

## 📋 How to Use

### Managing Categories

1. Go to **Categories** tab
2. Fill in category details:
   - **Name**: Display name (e.g., "Woodforest Bank")
   - **Slug**: URL-friendly name (e.g., "woodforest") - used in woodforest.html
   - **Icon**: Font Awesome icon (optional, e.g., "fa-bank")
   - **Active**: Toggle to show/hide category
3. Click **Save Category**

### Managing Products

1. Go to **Products** tab
2. Select a category from dropdown
3. Fill in product details:
   - **Title**: Product name
   - **Description**: Full HTML description
   - **Price**: Product price
   - **Balance**: Account balance (optional)
   - **Status**: available/sold/pending
   - **Image**: Image filename (default: btc.jpg)
4. Click **Save Product**

### Enabling Dynamic Loading on Pages

To make a page load products from Firestore instead of static HTML:

1. Open the HTML file (e.g., woodforest.html)
2. Add before closing `</body>` tag:

```html
<!-- Load products from Firestore -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="assets/js/product-loader.js"></script>
<script>
  // Auto-loads products based on filename
  // For woodforest.html, it will load products from 'woodforest' category
</script>
```

The script will:
- Auto-detect the category from filename
- Load products from Firestore
- Replace static HTML with dynamic products
- If Firestore is empty or unavailable, keep static HTML as fallback

## 🔄 Migration Strategy

### Hybrid Approach (Recommended)
Keep your existing HTML files as-is for now. They act as:
1. **Fallback** - If Firestore is down, static content still works
2. **Template** - Shows the layout structure
3. **Reference** - Can copy product details from here to admin

### To migrate a page:
1. Create the category in admin panel (e.g., "Woodforest Bank", slug: "woodforest")
2. Add products from HTML into admin panel
3. Add product-loader.js script to the HTML page
4. Test to ensure products load correctly
5. Once verified, you can remove static product HTML (optional)

## 🔐 Security Notes

**Firestore Rules Summary:**
- ✅ Anyone can READ categories and products (public)
- ❌ Only admins can CREATE/UPDATE/DELETE
- ✅ Users can read their own data
- ✅ Admins can manage everything

**Admin Access:**
- Change admin email in `firestore.rules` line 14
- Or use the `admins` collection method for multiple admins

## 📊 Database Structure

```
categories/
  {categoryId}
    - name: "Woodforest Bank"
    - slug: "woodforest"
    - icon: "fa-bank"
    - order: 0
    - active: true
    - createdAt: timestamp
    - updatedAt: timestamp

products/
  {productId}
    - categoryId: "{categoryId}"
    - title: "Woodforest Bank $70"
    - description: "ACCOUNT + EMAIL..."
    - price: 70.00
    - balance: 500.00
    - status: "available"
    - image: "btc.jpg"
    - order: 0
    - createdAt: timestamp
    - updatedAt: timestamp
```

## 🛠️ Troubleshooting

**"Permission denied" errors:**
- Make sure you deployed firestore rules: `firebase deploy --only firestore:rules`
- Check you're logged in as admin
- Verify admin email matches in firestore.rules

**Products not loading:**
- Check browser console for errors
- Verify category slug matches filename
- Ensure category is marked as "active"
- Check Firestore has products with correct categoryId

**Admin page not loading:**
- Make sure you're logged in
- Check Firebase config in admin-products.js
- Verify Firestore is enabled in Firebase console

## 🎯 Next Steps

1. Enable Firestore database
2. Deploy rules: `firebase deploy --only firestore:rules`
3. Deploy files: `firebase deploy --only hosting`
4. Access admin panel and create first category
5. Add some test products
6. Integrate product-loader.js into one page (e.g., woodforest.html)
7. Test and verify dynamic loading works
8. Gradually migrate other pages

## 📞 Need Help?

Check:
- Firebase Console: https://console.firebase.google.com/project/shadowlogsshop
- Firestore data viewer
- Browser console for JavaScript errors
- Firebase Functions logs (if using server-side features)

---

**Ready to start?** Just enable Firestore and deploy! The system is all set up and ready to use.
