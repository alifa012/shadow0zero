# Firebase Storage CORS Configuration Guide

## Problem
Firebase Storage is blocking file uploads due to missing CORS configuration.

## Quick Fix - Using Firebase Console (5 minutes)

### Step 1: Open Firebase Storage Settings
1. Go to: https://console.firebase.google.com/project/shadowlogsshop/storage
2. Click on "Rules" tab
3. Replace with these rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat-media/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"

### Step 2: Configure CORS (Using Google Cloud Console)

**Option A: Using Google Cloud Console (Simple)**

1. Go to: https://console.cloud.google.com/storage/browser?project=shadowlogsshop
2. Find bucket: `shadowlogsshop-ec4ca.appspot.com`
3. Click the three dots → "Edit access"
4. Under "Public access", select "Fine-grained" 
5. Add public read access

**Option B: Using Cloud Shell (Advanced)**

1. Open Cloud Shell: https://console.cloud.google.com/?cloudshell=true
2. Run this command:

```bash
echo '[{"origin":["*"],"method":["GET","HEAD","PUT","POST","DELETE"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://shadowlogsshop-ec4ca.appspot.com
```

3. Verify CORS is set:
```bash
gsutil cors get gs://shadowlogsshop-ec4ca.appspot.com
```

### Step 3: Test
1. Refresh webassist.html
2. Try uploading an image
3. Should work now!

---

## Alternative: Disable File Uploads (Quick Workaround)

If you want to skip CORS setup and just use text messages, let me know and I'll disable the file upload feature.

---

## Why This Happens

Firebase Storage requires:
1. **Storage Rules** - Control who can upload (✅ Created: storage.rules)
2. **CORS Configuration** - Allow browser uploads (❌ Needs manual setup)

The free Spark plan doesn't include automatic CORS config, so it must be done manually.

---

## Verification Commands

After setting CORS, verify with:

```bash
curl -H "Origin: https://shadowlogsshop.web.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://firebasestorage.googleapis.com/v0/b/shadowlogsshop-ec4ca.appspot.com/o
```

Should return headers with `Access-Control-Allow-Origin: *`
