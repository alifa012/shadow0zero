const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProducts() {
    try {
        console.log('🔍 Checking product data...\n');
        
        // Get a sample of products from different categories
        const productsSnapshot = await db.collection('products')
            .limit(20)
            .get();
        
        console.log(`📦 Found ${productsSnapshot.size} products\n`);
        
        let missingImage = 0;
        let missingDescription = 0;
        let hasAllFields = 0;
        
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const hasImage = product.image && product.image !== '';
            const hasDesc = product.description && product.description !== '';
            
            if (!hasImage) missingImage++;
            if (!hasDesc) missingDescription++;
            if (hasImage && hasDesc) hasAllFields++;
            
            console.log(`📄 ${product.title || 'Untitled'}`);
            console.log(`   Image: ${hasImage ? '✅ ' + product.image : '❌ Missing'}`);
            console.log(`   Description: ${hasDesc ? '✅ ' + product.description.substring(0, 50) + '...' : '❌ Missing'}`);
            console.log(`   Price: $${product.price || 0}`);
            console.log(`   Balance: $${product.balance || 0}`);
            console.log('');
        });
        
        console.log('\n📊 Summary:');
        console.log(`   Products with images: ${hasAllFields} / ${productsSnapshot.size}`);
        console.log(`   Missing images: ${missingImage}`);
        console.log(`   Missing descriptions: ${missingDescription}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkProducts();
