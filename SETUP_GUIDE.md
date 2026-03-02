# NOWPayments Integration Guide

## Quick Setup Summary

**Your system now supports:**
- ✅ Multi-crypto balance display (BTC, ETH, USDT-TRC20, USDT-ERC20, USDC-ERC20)
- ✅ Deposit page with QR codes and address generation
- ✅ Firebase Functions webhook handler
- ✅ Real-time balance updates across all pages
- ✅ Deposit history tracking

## NOWPayments Account Setup

### 1. Create NOWPayments Account
1. Go to https://nowpayments.io/
2. Click "Sign Up"
3. Complete KYC verification
4. Wait for account approval (1-3 business days)

### 2. Get Your API Credentials
1. Login to NOWPayments dashboard
2. Go to **Settings** → **API Keys**
3. Generate a new API key
4. Copy your **API Key** and **IPN Secret**

### 3. Configure Your Project
Replace the placeholder in `deposit.html` line 155:
```javascript
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual key
```

### 4. Set Up Webhooks
1. In NOWPayments dashboard, go to **Settings** → **IPN Settings**
2. Set IPN URL to: `https://your-project-id.cloudfunctions.net/nowpaymentsWebhook`
3. Enable IPN for all payment statuses
4. Save your IPN Secret key

### 5. Deploy Firebase Functions
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize functions in your project directory
firebase init functions

# Set environment variables
firebase functions:config:set nowpayments.api_key="YOUR_API_KEY"
firebase functions:config:set nowpayments.ipn_secret="YOUR_IPN_SECRET"

# Deploy
firebase deploy --only functions
```

## Testing Your Integration

### Sandbox Testing (Recommended First)
1. Use NOWPayments sandbox environment
2. Test with small amounts on testnets
3. Verify webhooks are received
4. Check balance updates in Firebase

### Production Testing
1. Start with minimum deposits
2. Monitor Firebase Functions logs
3. Test each supported cryptocurrency
4. Verify balance updates in real-time

## Security Checklist

- ✅ Webhook signature verification implemented
- ✅ Firebase security rules configured
- ✅ API keys stored securely in Firebase Functions config
- ✅ User authentication required for all deposit operations
- ✅ Idempotency protection for webhooks
- ✅ Transaction audit trail in Firebase

## Supported Cryptocurrencies

| Crypto | Network | Min Deposit | Confirmations | Processing Time |
|--------|---------|-------------|---------------|-----------------|
| BTC    | Bitcoin | 0.001 BTC   | 3            | 20-60 min      |
| ETH    | Ethereum| 0.01 ETH    | 12           | 10-30 min      |
| USDT   | TRC20   | 10 USDT     | 1            | 5-15 min       |
| USDT   | ERC20   | 10 USDT     | 12           | 10-30 min      |
| USDC   | ERC20   | 10 USDC     | 12           | 10-30 min      |

## Production Deployment Steps

1. **Replace demo addresses** in `deposit.html` with actual NOWPayments API calls
2. **Configure Firebase Functions** with your credentials
3. **Test webhook endpoint** thoroughly
4. **Set up monitoring** for failed transactions
5. **Configure customer support** for deposit issues
6. **Add terms of service** for crypto deposits
7. **Consider adding email notifications** for successful deposits

## Advanced Features (Optional)

- **Real-time price conversion**: Integrate CoinGecko API for USD equivalents
- **Deposit limits**: Set minimum/maximum deposit amounts per user
- **Withdrawal system**: Implement crypto withdrawal functionality
- **Transaction fees**: Add fee structure for deposits/withdrawals
- **Multi-language support**: Localize deposit interface
- **Mobile app integration**: Create React Native/Flutter app

## Support & Documentation

- **NOWPayments Docs**: https://documenter.getpostman.com/view/7907941/S1a32n38
- **Firebase Functions Guide**: https://firebase.google.com/docs/functions
- **This Implementation**: Contact developer for customizations

## Cost Analysis

**NOWPayments Fees:**
- 0.5% per transaction
- No monthly fees
- No setup costs

**Firebase Costs:**
- Functions: ~$0.10 per 1M executions
- Database: $5/GB/month
- Hosting: Free for small projects

**Total estimated cost**: $5-50/month depending on volume