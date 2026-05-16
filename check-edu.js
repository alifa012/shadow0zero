const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkEduProducts() {
  try {
    console.log('🔍 Searching for products in EDU MAILS category...\n');
    
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    let eduProducts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const category = (data.category || '').toUpperCase();
      
      // Match by category field
      if (category.includes('EDU')) {
        eduProducts.push({
          id: doc.id,
          title: data.title,
          category: data.category,
          image: data.image
        });
      }
    });
    
    if (eduProducts.length === 0) {
      console.log('❌ No products found in EDU category.');
      console.log('   Searching by title instead...\n');
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toUpperCase();
        
        if (title.includes('EDU')) {
          eduProducts.push({
            id: doc.id,
            title: data.title,
            category: data.category,
            image: data.image
          });
        }
      });
    }
    
    console.log(`📊 Found ${eduProducts.length} EDU-related product(s):\n`);
    
    eduProducts.forEach(product => {
      const status = product.image === 'EDU.jpg' ? '✅' : '❌';
      console.log(`${status} Product ID: ${product.id}`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Image: ${product.image}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkEduProducts();
