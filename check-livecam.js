const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkLiveCamProducts() {
    console.log('🔍 Searching for LIVE CAM products...\n');
    
    // First find the category
    const categoriesSnapshot = await db.collection('categories')
        .where('name', '==', 'LIVE CAM')
        .get();
    
    if (categoriesSnapshot.empty) {
        console.log('❌ LIVE CAM category not found');
        return;
    }
    
    const categoryDoc = categoriesSnapshot.docs[0];
    const categoryId = categoryDoc.id;
    console.log(`✅ Found category: ${categoryDoc.data().name} (${categoryId})\n`);
    
    // Find products in this category
    const productsSnapshot = await db.collection('products')
        .where('categoryId', '==', categoryId)
        .get();
    
    console.log(`📦 Found ${productsSnapshot.size} product(s) in LIVE CAM category:\n`);
    
    productsSnapshot.forEach(doc => {
        const product = doc.data();
        console.log(`Product ID: ${doc.id}`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Image: ${product.image || '(no image)'}`);
        console.log(`  Status: ${product.status}`);
        console.log(`  Price: $${product.price}`);
        console.log('');
    });
    
    process.exit(0);
}

checkLiveCamProducts().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
