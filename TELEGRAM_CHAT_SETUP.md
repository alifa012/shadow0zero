# Telegram-Bridged Support Chat System

## Setup Instructions

### 1. Telegram Bot Setup

1. **Get your Telegram Bot Token** (you mentioned you already have one)
2. **Create a Private Admin Group:**
   - Create a new Telegram group
   - Add your bot to the group
   - Make it an admin
   - Get the Chat ID by sending a message and checking: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`

### 2. Set Firebase Environment Variables

```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN_HERE"
firebase functions:config:set telegram.admin_chat_id="YOUR_ADMIN_GROUP_CHAT_ID"
```

### 3. Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Set Telegram Webhook

After deployment, set your webhook URL:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://us-central1-shadowlogsshop.cloudfunctions.net/telegramWebhook"}'
```

## Firestore Structure

### Collections:

**conversations**
```
/{conversationId}
  - userId: string
  - userEmail: string
  - status: "open" | "closed"
  - createdAt: timestamp
  - lastMessageAt: timestamp
  - unreadCount: number
```

**messages**
```
/{messageId}
  - conversationId: string
  - senderId: string (userId or "admin")
  - senderType: "user" | "admin"
  - messageType: "text" | "image" | "video"
  - content: string (text or media URL)
  - telegramMessageId: number (optional)
  - timestamp: timestamp
  - status: "sent" | "delivered" | "read"
```

**telegram_mappings**
```
/{telegramMessageId}
  - conversationId: string
  - messageId: string
  - userId: string
```

## Features

- ✅ Real-time chat with Firebase Auth users
- ✅ Text messages bidirectional (Web ↔ Telegram)
- ✅ Image/video uploads from web
- ✅ Media sent to Telegram
- ✅ Reply from Telegram appears in web chat
- ✅ Multiple concurrent conversations
- ✅ Conversation threading
- ✅ File size limits and validation
- ✅ Read/delivered indicators
- ✅ Typing indicators

## Security Rules

Update firestore.rules with proper access controls (included in deployment).
