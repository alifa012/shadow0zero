const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixLiveCamImage() {
    console.log('🔧 Fixing LIVE CAM product image...\n');
    
    // Update the specific product
    const productId = 'r0XczAd99UsDArxHuCPe';
    
    await db.collection('products').doc(productId).update({
        image: 'LIVECAM.jpg',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Updated product image to: LIVECAM.jpg');
    console.log('📦 Product ID: r0XczAd99UsDArxHuCPe');
    console.log('🎯 Title: STREAM LIVE S*X....HD QUALITY\n');
    
    process.exit(0);
}

fixLiveCamImage().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
