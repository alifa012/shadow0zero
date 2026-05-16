const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixGirlsVsGirlsImage() {
    console.log('🔍 Searching for GIRLS VS GIRLS product...\n');
    
    // Search for products with GIRLS in title
    const productsSnapshot = await db.collection('products').get();
    let found = false;
    
    for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        const title = (product.title || '').toUpperCase();
        
        // Check if title contains GIRLS VS GIRLS or similar
        if (title.includes('GIRLS') && (title.includes('VS') || title.includes('V S'))) {
            console.log(`✅ Found product: ${product.title}`);
            console.log(`   Product ID: ${doc.id}`);
            console.log(`   Current image: ${product.image ? product.image.substring(0, 50) + '...' : 'none'}\n`);
            
            // Update to use GIRLSVSGIRLS.jpg
            await db.collection('products').doc(doc.id).update({
                image: 'GIRLSVSGIRLS.jpg',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Updated image to: GIRLSVSGIRLS.jpg\n`);
            found = true;
        }
    }
    
    if (!found) {
        console.log('❌ No GIRLS VS GIRLS product found');
    }
    
    process.exit(0);
}

fixGirlsVsGirlsImage().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
