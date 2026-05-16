const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function assignEduCategory() {
  try {
    console.log('🔧 Assigning EDU products to "EDU MAILS" category...\n');
    
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      // Find EDU products without a category
      if (title.includes('EDU') && !data.category) {
        console.log(`✅ Assigning category to: ${data.title}`);
        
        batch.update(productsRef.doc(doc.id), {
          category: 'EDU MAILS',
          image: 'EDU.jpg',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✨ Updated ${updateCount} product(s) with "EDU MAILS" category!`);
      console.log('\n🎉 Now run: firebase deploy --only hosting');
    } else {
      console.log('⚠️  No products found to update.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

assignEduCategory();
