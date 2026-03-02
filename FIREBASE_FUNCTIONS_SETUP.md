# Firebase Functions for NOWPayments Integration

## Setup Instructions

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Functions**
   ```bash
   firebase init functions
   ```

3. **Install dependencies**
   ```bash
   cd functions
   npm install crypto
   ```

4. **Replace functions/index.js with the content below**

5. **Deploy**
   ```bash
   firebase deploy --only functions
   ```

## Environment Variables (Set these in Firebase Console)
- `NOWPAYMENTS_IPN_SECRET` - Your NOWPayments IPN secret key
- `NOWPAYMENTS_API_KEY` - Your NOWPayments API key

---

## functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.database();

// NOWPayments webhook handler
exports.nowpaymentsWebhook = functions.https.onRequest(async (req, res) => {
  try {
    console.log('NOWPayments webhook received:', req.body);
    
    // Verify webhook signature
    const receivedSignature = req.headers['x-nowpayments-sig'];
    const ipnSecret = functions.config().nowpayments.ipn_secret;
    
    if (!receivedSignature || !ipnSecret) {
      console.error('Missing signature or IPN secret');
      return res.status(400).send('Missing signature or IPN secret');
    }
    
    // Generate expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha512', ipnSecret)
      .update(payload)
      .digest('hex');
    
    if (receivedSignature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }
    
    const {
      payment_id,
      payment_status,
      pay_amount,
      pay_currency,
      price_amount,
      price_currency,
      order_id,
      order_description,
      payment_hash,
      actually_paid,
      outcome_amount,
      outcome_currency
    } = req.body;
    
    // Extract user ID from order_id (format: deposit_{userId}_{timestamp})
    const orderParts = order_id.split('_');
    if (orderParts.length < 2 || orderParts[0] !== 'deposit') {
      console.error('Invalid order_id format:', order_id);
      return res.status(400).send('Invalid order_id format');
    }
    
    const userId = orderParts[1];
    console.log('Processing deposit for user:', userId);
    
    // Map payment currency to our asset format
    const assetMap = {
      'btc': 'BTC',
      'eth': 'ETH',
      'usdttrc20': 'USDT-TRC20',
      'usdterc20': 'USDT-ERC20',
      'usdcerc20': 'USDC-ERC20'
    };
    
    const asset = assetMap[pay_currency.toLowerCase()] || pay_currency.toUpperCase();
    
    // Check if this deposit was already processed
    const existingDepositRef = db.ref(`users/${userId}/deposits`);
    const existingSnapshot = await existingDepositRef
      .orderByChild('paymentId')
      .equalTo(payment_id)
      .once('value');
    
    let depositRef;
    let isNewDeposit = true;
    
    if (existingSnapshot.exists()) {
      // Update existing deposit
      const existingData = existingSnapshot.val();
      const existingKey = Object.keys(existingData)[0];
      depositRef = db.ref(`users/${userId}/deposits/${existingKey}`);
      isNewDeposit = false;
      console.log('Updating existing deposit:', existingKey);
    } else {
      // Create new deposit record
      depositRef = db.ref(`users/${userId}/deposits`).push();
      console.log('Creating new deposit record');
    }
    
    // Prepare deposit data
    const depositData = {
      paymentId: payment_id,
      asset: asset,
      network: getNetworkFromAsset(asset),
      amount: parseFloat(actually_paid || pay_amount),
      status: mapPaymentStatus(payment_status),
      txHash: payment_hash,
      timestamp: isNewDeposit ? Date.now() : admin.database.ServerValue.TIMESTAMP,
      lastUpdated: Date.now(),
      priceAmount: parseFloat(price_amount),
      priceCurrency: price_currency,
      rawWebhookData: req.body
    };
    
    // Save deposit record
    if (isNewDeposit) {
      await depositRef.set(depositData);
    } else {
      await depositRef.update({
        status: depositData.status,
        amount: depositData.amount,
        txHash: depositData.txHash,
        lastUpdated: depositData.lastUpdated,
        rawWebhookData: depositData.rawWebhookData
      });
    }
    
    // If payment is confirmed, update user balance
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      const balanceRef = db.ref(`users/${userId}/balance/${asset}`);
      
      // Get current balance
      const balanceSnapshot = await balanceRef.once('value');
      const currentBalance = parseFloat(balanceSnapshot.val() || 0);
      const newBalance = currentBalance + parseFloat(actually_paid || pay_amount);
      
      // Update balance
      await balanceRef.set(newBalance);
      
      console.log(`Updated ${asset} balance for user ${userId}: ${currentBalance} -> ${newBalance}`);
      
      // Log the transaction in a separate ledger for audit
      await db.ref(`transactions/${userId}`).push({
        type: 'deposit',
        asset: asset,
        amount: parseFloat(actually_paid || pay_amount),
        paymentId: payment_id,
        txHash: payment_hash,
        timestamp: Date.now(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      });
    }
    
    console.log(`Deposit processed successfully: ${payment_id}`);
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error processing NOWPayments webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// Helper function to get network from asset
function getNetworkFromAsset(asset) {
  const networkMap = {
    'BTC': 'BTC',
    'ETH': 'ERC20',
    'USDT-TRC20': 'TRC20',
    'USDT-ERC20': 'ERC20',
    'USDC-ERC20': 'ERC20'
  };
  return networkMap[asset] || 'UNKNOWN';
}

// Helper function to map NOWPayments status to our status
function mapPaymentStatus(status) {
  const statusMap = {
    'waiting': 'pending',
    'confirming': 'pending',
    'confirmed': 'confirmed',
    'sending': 'confirmed',
    'partially_paid': 'pending',
    'finished': 'confirmed',
    'failed': 'failed',
    'refunded': 'failed',
    'expired': 'failed'
  };
  return statusMap[status] || 'pending';
}

// API endpoint to get available currencies (optional)
exports.getAvailableCurrencies = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Return our supported currencies
    return {
      currencies: [
        { code: 'btc', name: 'Bitcoin', network: 'BTC', minDeposit: 0.001 },
        { code: 'eth', name: 'Ethereum', network: 'ERC20', minDeposit: 0.01 },
        { code: 'usdttrc20', name: 'USDT', network: 'TRC20', minDeposit: 10 },
        { code: 'usdterc20', name: 'USDT', network: 'ERC20', minDeposit: 10 },
        { code: 'usdcerc20', name: 'USDC', network: 'ERC20', minDeposit: 10 }
      ]
    };
  } catch (error) {
    console.error('Error getting currencies:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get currencies');
  }
});

// Function to manually check deposit status (for admin/debugging)
exports.checkDepositStatus = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { paymentId } = data;
    if (!paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment ID is required');
    }
    
    // Here you could call NOWPayments API to check status
    // For now, just return the Firebase record
    const userId = context.auth.uid;
    const depositsRef = db.ref(`users/${userId}/deposits`);
    const snapshot = await depositsRef
      .orderByChild('paymentId')
      .equalTo(paymentId)
      .once('value');
    
    if (!snapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Deposit not found');
    }
    
    const deposits = snapshot.val();
    const depositData = Object.values(deposits)[0];
    
    return { deposit: depositData };
    
  } catch (error) {
    console.error('Error checking deposit status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check deposit status');
  }
});
```

## firebase.json (add this to your project root)

```json
{
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ],
    "source": "functions"
  },
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  },
  "database": {
    "rules": "database.rules.json"
  }
}
```

## database.rules.json (Firebase Realtime Database Rules)

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "$userId === auth.uid",
        "balance": {
          ".validate": "false"
        },
        "deposits": {
          "$depositId": {
            ".validate": "false"
          }
        },
        "wallets": {
          ".write": "$userId === auth.uid"
        }
      }
    },
    "transactions": {
      "$userId": {
        ".read": "$userId === auth.uid",
        ".write": "false"
      }
    }
  }
}
```

## NOWPayments Setup Steps

1. **Sign up**: https://nowpayments.io/
2. **Get API credentials** from your account dashboard
3. **Set webhook URL**: `https://your-project-id.cloudfunctions.net/nowpaymentsWebhook`
4. **Configure IPN Secret** in NOWPayments dashboard
5. **Set environment variables** in Firebase:
   ```bash
   firebase functions:config:set nowpayments.api_key="YOUR_API_KEY"
   firebase functions:config:set nowpayments.ipn_secret="YOUR_IPN_SECRET"
   ```

## Testing

1. **Local development**:
   ```bash
   firebase emulators:start
   ```

2. **Test webhooks** using ngrok:
   ```bash
   ngrok http 5001
   # Use ngrok URL for webhook testing
   ```

3. **Deploy to production**:
   ```bash
   firebase deploy
   ```

This setup provides secure, production-ready crypto deposit functionality with proper webhook verification and balance management.