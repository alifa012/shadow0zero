# Bulk Import Instructions

This script will import ALL your existing products from HTML files into Firestore automatically!

## Step 1: Download Firebase Admin Key

1. Go to Firebase Console: https://console.firebase.google.com/project/shadowlogsshop/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Save the downloaded file as `serviceAccountKey.json` in this folder (C:\Users\USER\Desktop\0)

## Step 2: Install Dependencies

Open PowerShell in this folder and run:

```powershell
npm install firebase-admin
```

(jsdom is already installed from before)

## Step 3: Run the Import

```powershell
node import-products.js
```

## What it does:

✅ Creates categories for all your HTML files automatically
✅ Parses products from each HTML file
✅ Imports title, description, price, balance, status
✅ Maintains the order of products
✅ Links products to correct categories

## After import:

Go to your admin panel and refresh:
- You'll see all categories listed
- Click on each category to see all products
- You can now change status (Available/Sold/Pending)
- Edit prices, descriptions, etc.
- Delete or reorder products

## Supported Files:

The script will automatically import from:
- barclays.html
- woodforest.html
- chasebank.html
- paypal.html
- coinbase.html
- westernunion.html
- huntigonbank.html
- pncbank.html
- suntrust.html
- BOA.html
- wellsfargo.html
- citibank.html
- cashapp.html
- binance.html
- spamming.html
- cvv.html
- clonecards.html
- nonvbv.html
- and more...

Add more files to the `categoryMap` in import-products.js if needed!
