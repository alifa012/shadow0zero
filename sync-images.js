const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncAllImages() {
    console.log('🔄 Starting automatic image sync...\n');
    
    const imagesFolder = './images';
    const targetFolder = './assets/images';
    
    // Check if images folder exists
    if (!fs.existsSync(imagesFolder)) {
        console.log('❌ Images folder not found');
        return;
    }
    
    // Get all files from images folder
    const files = fs.readdirSync(imagesFolder).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    if (files.length === 0) {
        console.log('✅ No new images to sync');
        process.exit(0);
        return;
    }
    
    console.log(`📁 Found ${files.length} image(s) to process:\n`);
    
    // Get all products once
    const productsSnapshot = await db.collection('products').get();
    const products = [];
    productsSnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });
    
    let movedCount = 0;
    let updatedCount = 0;
    
    for (const filename of files) {
        console.log(`📸 Processing: ${filename}`);
        
        // Extract search term from filename (remove extension, convert to uppercase)
        const searchTerm = path.basename(filename, path.extname(filename)).toUpperCase();
        
        // Find matching products
        const matches = products.filter(product => {
            const title = (product.title || '').toUpperCase();
            // Check if product title contains main parts of the filename
            const terms = searchTerm.split(/[_\s-]+/);
            return terms.some(term => term.length > 3 && title.includes(term));
        });
        
        if (matches.length > 0) {
            // Move image to assets/images
            const sourcePath = path.join(imagesFolder, filename);
            const targetPath = path.join(targetFolder, filename);
            fs.renameSync(sourcePath, targetPath);
            movedCount++;
            console.log(`   ✅ Moved to assets/images/`);
            
            // Update all matching products
            for (const product of matches) {
                await db.collection('products').doc(product.id).update({
                    image: filename,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`   ✅ Updated product: "${product.title}"`);
                updatedCount++;
            }
        } else {
            console.log(`   ⚠️  No matching product found - leaving in images folder`);
        }
        
        console.log('');
    }
    
    console.log('━'.repeat(60));
    console.log(`\n✨ Sync complete!`);
    console.log(`   📦 Images moved: ${movedCount}`);
    console.log(`   🔄 Products updated: ${updatedCount}\n`);
    
    if (movedCount > 0) {
        console.log('🚀 Next step: Run "firebase deploy --only hosting" to publish');
    }
    
    process.exit(0);
}

syncAllImages().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
