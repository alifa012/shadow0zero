const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkBOA() {
  try {
    const snapshot = await db.collection('products').get();
    
    let boaProducts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      if (title.includes('BANK OF AMERICA') || title.includes('BOA ')) {
        boaProducts.push({
          title: data.title,
          image: data.image
        });
      }
    });
    
    console.log(`\n📊 Found ${boaProducts.length} Bank of America products:\n`);
    
    boaProducts.forEach(product => {
      const status = product.image === 'BANK OFAMERICA.jpg' ? '✅' : '❌';
      console.log(`${status} ${product.title}`);
      console.log(`   → Image: ${product.image}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkBOA();
