const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixEduMail() {
  try {
    console.log('🔍 Searching for EDU MAIL products...\n');
    
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    let foundProducts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      // Match products with EDU or MAIL in title
      if (title.includes('EDU') || (title.includes('MAIL') && title.includes('EDUCATIONAL'))) {
        foundProducts.push({
          id: doc.id,
          title: data.title,
          currentImage: data.image
        });
      }
    });
    
    if (foundProducts.length === 0) {
      console.log('❌ No EDU MAIL products found.');
      console.log('   Please check product titles in the database.\n');
      process.exit();
      return;
    }
    
    console.log(`✅ Found ${foundProducts.length} EDU MAIL product(s):\n`);
    
    const batch = db.batch();
    
    foundProducts.forEach(product => {
      console.log(`📝 ${product.title}`);
      console.log(`   Current: ${product.currentImage}`);
      console.log(`   New: EDU.jpg\n`);
      
      batch.update(productsRef.doc(product.id), {
        image: 'EDU.jpg',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log('✨ All EDU MAIL products updated!');
    console.log('\n🎉 Now run: firebase deploy --only hosting');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

fixEduMail();
