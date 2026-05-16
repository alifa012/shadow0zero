# 🚀 Telegram-Bridged Support Chat - Quick Start Guide

## What You Now Have

A complete support chat system where:
- ✅ Users send messages/images/videos from your website
- ✅ Messages automatically forward to your Telegram (admin group)
- ✅ You reply from Telegram → appears instantly on website
- ✅ Real-time updates using Firebase
- ✅ Secure, authenticated, production-ready

---

## Step 1: Install Functions Dependencies

```powershell
cd functions
npm install
cd ..
```

---

## Step 2: Set Up Telegram Bot

### A. Get Your Bot Token (you mentioned you already have one)
If you need to create a new bot:
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow prompts to get your token

### B. Create Admin Group
1. Create a new Telegram group
2. Add your bot to the group
3. Make the bot an admin
4. Send a test message in the group
5. Get the Chat ID:
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Look for "chat":{"id": -XXXXXXXXX}
   - Save this ID (including the minus sign)

---

## Step 3: Configure Firebase

Set your Telegram credentials:

```powershell
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN_HERE"
firebase functions:config:set telegram.admin_chat_id="YOUR_ADMIN_GROUP_CHAT_ID"
```

Example:
```powershell
firebase functions:config:set telegram.bot_token="7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
firebase functions:config:set telegram.admin_chat_id="-1001234567890"
```

Verify it's set:
```powershell
firebase functions:config:get
```

---

## Step 4: Deploy Everything

```powershell
# Deploy Functions and Firestore rules
firebase deploy

# Or deploy individually:
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

Wait for deployment to complete. You'll see URLs like:
- `https://us-central1-shadowlogsshop.cloudfunctions.net/telegramWebhook`

---

## Step 5: Set Telegram Webhook

Replace `<YOUR_BOT_TOKEN>` with your actual bot token:

```powershell
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{"url": "https://us-central1-shadowlogsshop.cloudfunctions.net/telegramWebhook"}'
```

You should see: `{"ok":true,"result":true,...}`

---

## Step 6: Test the System

### Test User → Telegram Flow:
1. Go to https://shadowlogsshop.web.app/webassist.html
2. Log in with Firebase Auth
3. Send a test message
4. Check your Telegram admin group - message should appear!

### Test Telegram → User Flow:
1. In Telegram, **reply** to the forwarded message
2. Check the website - your reply should appear!

### Test Media:
1. On website, click paperclip icon, upload an image
2. Check Telegram - image should appear
3. Reply with an image from Telegram
4. Check website - image should appear

---

## Troubleshooting

### Functions not deploying?
```powershell
firebase deploy --only functions --debug
```

### Webhook not working?
Check webhook status:
```powershell
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

### Messages not appearing?
1. Check Firebase Console → Functions → Logs
2. Check Firestore → messages collection
3. Verify user is authenticated

### Can't see Firebase config?
```powershell
firebase functions:config:get
```

---

## File Structure

```
your-project/
├── functions/
│   ├── index.js           # Telegram integration logic
│   └── package.json       # Dependencies
├── webassist.html         # Enhanced chat UI
├── firestore.rules        # Updated security rules
├── TELEGRAM_CHAT_SETUP.md # Detailed setup guide
└── firebase.json          # Firebase configuration
```

---

## How It Works

### User Sends Message:
1. User types in webassist.html
2. Message saved to Firestore
3. Firestore trigger fires → `forwardMessageToTelegram`
4. Message sent to your Telegram admin group
5. Mapping stored (Telegram msg ID ↔ conversation ID)

### You Reply from Telegram:
1. You reply to message in Telegram
2. Telegram sends webhook to your Cloud Function
3. Function looks up conversation by message ID
4. Admin message saved to Firestore
5. User sees message in real-time (Firestore listener)

---

## Security Features

✅ Firebase Auth required to chat  
✅ Firestore security rules enforce permissions  
✅ File size limits (5MB images, 20MB videos)  
✅ Webhook signature verification ready  
✅ User-specific conversation isolation  

---

## Cost Estimate

**Firebase Free Tier Covers:**
- Firestore: 50K reads, 20K writes/day
- Storage: 5GB
- Functions: 2M invocations/month
- Hosting: 10GB transfer/month

**Typical Usage:**
- 100 support chats/day = ~$0
- Well within free tier for small-medium traffic

---

## Next Steps

1. **✅ Test the system end-to-end**
2. **Customize**: Edit welcome message in webassist.html
3. **Brand**: Update colors, add logo in chat header
4. **Monitor**: Check Firebase Console → Functions → Logs
5. **Scale**: Add more admins, conversation history, etc.

---

## Support Commands (Future Enhancement)

You can add commands to your Telegram bot:
- `/close 123` - Close conversation #123
- `/assign @admin` - Assign conversation
- `/priority high` - Mark as priority

Implement in `functions/index.js` webhook handler.

---

## Quick Reference

**View Logs:**
```powershell
firebase functions:log
```

**Test Locally:**
```powershell
firebase emulators:start
```

**Redeploy After Changes:**
```powershell
firebase deploy --only functions
```

---

🎉 **You're all set!** Users can now chat with you via website, and you respond from Telegram!
