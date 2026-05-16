const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAfricanFetishImage() {
    console.log('🔍 Searching for AFRICANFETISH product...\n');
    
    // Search for products with AFRICANFETISH in title or category name
    const productsSnapshot = await db.collection('products').get();
    let found = false;
    
    for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        const title = product.title || '';
        
        // Check if title contains AFRICAN or FETISH
        if (title.toUpperCase().includes('AFRICAN') || title.toUpperCase().includes('FETISH')) {
            console.log(`✅ Found product: ${title}`);
            console.log(`   Product ID: ${doc.id}`);
            console.log(`   Current image: ${product.image ? product.image.substring(0, 50) + '...' : 'none'}\n`);
            
            // Update to use AFRICANFETISH.jpg
            await db.collection('products').doc(doc.id).update({
                image: 'AFRICANFETISH.jpg',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Updated image to: AFRICANFETISH.jpg\n`);
            found = true;
        }
    }
    
    if (!found) {
        console.log('❌ No AFRICANFETISH product found');
    }
    
    process.exit(0);
}

fixAfricanFetishImage().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
