const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const FormData = require('form-data');

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Get Telegram configuration
const TELEGRAM_BOT_TOKEN = functions.config().telegram?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = functions.config().telegram?.admin_chat_id || process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Helper: Send message to Telegram
async function sendToTelegram(text, chatId = ADMIN_CHAT_ID, replyToMessageId = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };
    
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }
    
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    return response.data.result.message_id;
  } catch (error) {
    console.error('Error sending to Telegram:', error.response?.data || error.message);
    throw error;
  }
}

// Helper: Send photo to Telegram
async function sendPhotoToTelegram(photoUrl, caption, chatId = ADMIN_CHAT_ID) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendPhoto`, {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'HTML',
    });
    return response.data.result.message_id;
  } catch (error) {
    console.error('Error sending photo to Telegram:', error.response?.data || error.message);
    throw error;
  }
}

// Helper: Send video to Telegram
async function sendVideoToTelegram(videoUrl, caption, chatId = ADMIN_CHAT_ID) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendVideo`, {
      chat_id: chatId,
      video: videoUrl,
      caption: caption,
      parse_mode: 'HTML',
    });
    return response.data.result.message_id;
  } catch (error) {
    console.error('Error sending video to Telegram:', error.response?.data || error.message);
    throw error;
  }
}

// Firestore trigger: Forward new user messages to Telegram
exports.forwardMessageToTelegram = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;
    
    // Only forward user messages, not admin messages
    if (message.senderType === 'admin') {
      return null;
    }
    
    try {
      // Get conversation details
      const convDoc = await db.collection('conversations').doc(message.conversationId).get();
      const conversation = convDoc.data();
      
      // Format message for Telegram
      let telegramText = `<b>💬 Message from ${conversation.userEmail}</b>\n`;
      telegramText += `<b>Conversation:</b> #${message.conversationId.substring(0, 8)}\n`;
      telegramText += `<b>Time:</b> ${new Date(message.timestamp).toLocaleString()}\n\n`;
      
      let telegramMessageId;
      
      if (message.messageType === 'text') {
        telegramText += message.content;
        telegramMessageId = await sendToTelegram(telegramText);
      } else if (message.messageType === 'image') {
        telegramMessageId = await sendPhotoToTelegram(message.content, telegramText);
      } else if (message.messageType === 'video') {
        telegramMessageId = await sendVideoToTelegram(message.content, telegramText);
      }
      
      // Store mapping
      await db.collection('telegram_mappings').doc(String(telegramMessageId)).set({
        conversationId: message.conversationId,
        messageId: messageId,
        userId: message.senderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update message with Telegram message ID
      await snap.ref.update({
        telegramMessageId: telegramMessageId,
        status: 'delivered',
      });
      
      console.log(`Message forwarded to Telegram: ${messageId}`);
      return null;
    } catch (error) {
      console.error('Error forwarding to Telegram:', error);
      await snap.ref.update({ status: 'failed' });
      throw error;
    }
  });

// HTTP endpoint: Telegram webhook
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method not allowed');
    }
    
    const update = req.body;
    console.log('Telegram webhook received:', JSON.stringify(update));
    
    // Handle message
    if (update.message) {
      const message = update.message;
      
      // Only process messages from admin chat
      if (message.chat.id.toString() !== ADMIN_CHAT_ID.toString()) {
        console.log('Message from non-admin chat, ignoring');
        return res.status(200).send('OK');
      }
      
      // Check if this is a reply to a forwarded message
      if (message.reply_to_message && message.reply_to_message.message_id) {
        const replyToMessageId = message.reply_to_message.message_id;
        
        // Look up the original conversation
        const mappingDoc = await db.collection('telegram_mappings')
          .doc(String(replyToMessageId))
          .get();
        
        if (mappingDoc.exists) {
          const mapping = mappingDoc.data();
          
          // Create admin message in Firestore
          let messageContent = '';
          let messageType = 'text';
          
          if (message.text) {
            messageContent = message.text;
            messageType = 'text';
          } else if (message.photo) {
            // Get highest resolution photo
            const photo = message.photo[message.photo.length - 1];
            const fileId = photo.file_id;
            
            // Get file URL
            const fileResponse = await axios.get(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
            const filePath = fileResponse.data.result.file_path;
            messageContent = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
            messageType = 'image';
          } else if (message.video) {
            const fileId = message.video.file_id;
            const fileResponse = await axios.get(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
            const filePath = fileResponse.data.result.file_path;
            messageContent = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
            messageType = 'video';
          }
          
          // Create message document
          await db.collection('messages').add({
            conversationId: mapping.conversationId,
            senderId: 'admin',
            senderType: 'admin',
            messageType: messageType,
            content: messageContent,
            timestamp: Date.now(),
            status: 'sent',
          });
          
          // Update conversation
          await db.collection('conversations').doc(mapping.conversationId).update({
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`Admin reply processed for conversation: ${mapping.conversationId}`);
        } else {
          console.log('No mapping found for replied message');
        }
      }
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Error processing webhook');
  }
});

// HTTP endpoint: Send message from web
exports.sendMessage = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userId = context.auth.uid;
  const { conversationId, messageType, content } = data;
  
  try {
    // Validate input
    if (!conversationId || !messageType || !content) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // Get or create conversation
    let convRef = db.collection('conversations').doc(conversationId);
    let convDoc = await convRef.get();
    
    if (!convDoc.exists) {
      // Create new conversation
      const user = await admin.auth().getUser(userId);
      await convRef.set({
        userId: userId,
        userEmail: user.email || 'Unknown',
        status: 'open',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        unreadCount: 0,
      });
    } else {
      // Update existing conversation
      await convRef.update({
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Create message
    const messageRef = await db.collection('messages').add({
      conversationId: conversationId,
      senderId: userId,
      senderType: 'user',
      messageType: messageType,
      content: content,
      timestamp: Date.now(),
      status: 'sent',
    });
    
    return {
      success: true,
      messageId: messageRef.id,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// HTTP endpoint: Upload media
exports.getUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { fileName, fileType } = data;
  const userId = context.auth.uid;
  const timestamp = Date.now();
  const storagePath = `chat-media/${userId}/${timestamp}_${fileName}`;
  
  // Generate signed URL for upload
  const file = storage.bucket().file(storagePath);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: fileType,
  });
  
  return {
    uploadUrl: url,
    filePath: storagePath,
  };
});

// HTTP endpoint: Get download URL for uploaded media
exports.getDownloadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { filePath } = data;
  
  const file = storage.bucket().file(filePath);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return {
    downloadUrl: url,
  };
});
