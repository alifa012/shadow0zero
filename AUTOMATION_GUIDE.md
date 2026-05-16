# 🚀 AUTOMATED IMAGE SYNC SYSTEM

## Quick Start - Just 1 Command!

After uploading images to the `images` folder, run **ONE** of these:

### Option 1: PowerShell (Recommended)
```powershell
.\sync-and-deploy.ps1
```

### Option 2: Batch File
```cmd
sync-and-deploy.bat
```

### Option 3: Manual Steps
```powershell
node sync-images.js
firebase deploy --only hosting
```

---

## How It Works

### 1. Upload Your Image
- Place your product image in the `images` folder
- Name it related to the product (e.g., `LIVECAM.jpg`, `AFRICANFETISH.jpg`)
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### 2. Run Sync Command
- The script automatically:
  - ✅ Finds the image file
  - ✅ Searches for matching products by name
  - ✅ Moves image to `assets/images/`
  - ✅ Updates product(s) in database
  - ✅ Deploys to Firebase hosting

### 3. Done!
- Your product now displays with the image
- No manual database updates needed
- No repetitive commands

---

## Smart Matching

The script intelligently matches images to products:

**Example 1:**
- Image: `PNCBANK.jpg`
- Matches: Any product with "PNC" or "BANK" in title

**Example 2:**
- Image: `GIRLSVSGIRLS.jpg`
- Matches: Products containing "GIRLS" and "VS"

**Example 3:**
- Image: `LIVECAM.jpg`
- Matches: Products with "LIVE" or "CAM" in title

---

## Best Practices

### ✅ DO:
- Name images clearly related to product
- Use UPPERCASE for consistency (e.g., `CASHAPP.jpg`)
- Upload images before creating products (or after)
- Run sync after each new product creation

### ❌ DON'T:
- Use generic names like `image1.jpg`
- Use special characters in filenames
- Upload non-image files to images folder

---

## Troubleshooting

### "No matching product found"
- The image filename doesn't match any product title
- Solution: Rename the image to match product name, or manually specify

### "Image sync failed"
- Check that `images` folder exists
- Verify image format is supported
- Ensure product exists in database

### "Deployment failed"
- Run `firebase login` to authenticate
- Check internet connection
- Verify Firebase project is set up

---

## Workflow Examples

### Scenario 1: New Product with Image
1. Create product in admin panel
2. Upload image named `PRODUCTNAME.jpg` to `images` folder
3. Run: `.\sync-and-deploy.ps1`
4. Done! Product displays with image

### Scenario 2: Multiple New Products
1. Create all products in admin panel
2. Upload all images to `images` folder
3. Run: `.\sync-and-deploy.ps1` (processes all at once)
4. Done! All products updated

### Scenario 3: Replace Existing Image
1. Upload new image with same name to `images` folder
2. Run: `.\sync-and-deploy.ps1`
3. Done! Image replaced everywhere

---

## What Gets Automated

### Before (Manual - 5 steps):
1. Upload image to images folder
2. Run script to move to assets/images
3. Run script to find product
4. Run script to update database
5. Run firebase deploy

### After (Automated - 1 step):
1. Run `.\sync-and-deploy.ps1`

**Time saved: ~5 minutes per product**

---

## Advanced Options

### Sync Only (No Deploy)
```powershell
node sync-images.js
```

### Deploy Only
```powershell
firebase deploy --only hosting
```

### Check Images Folder
```powershell
Get-ChildItem images
```

---

## Files Created

- `sync-images.js` - Main sync script
- `sync-and-deploy.ps1` - PowerShell automation
- `sync-and-deploy.bat` - Batch file automation
- `AUTOMATION_GUIDE.md` - This guide

---

## Support

If you encounter issues:
1. Check that `serviceAccountKey.json` exists
2. Verify Firebase project is configured
3. Ensure Node.js is installed
4. Run `npm install` to install dependencies
