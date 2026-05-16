const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCampusGirls() {
  try {
    console.log('🔍 Searching for CAMPUS GIRLS product...\n');
    
    // Search for product with CAMPUS or GIRLS in title
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    let foundProduct = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      if (title.includes('CAMPUS') || title.includes('GIRL')) {
        console.log(`✅ Found potential match:
   Product ID: ${doc.id}
   Title: ${data.title}
   Current image: ${data.image ? data.image.substring(0, 50) + '...' : 'None'}
`);
        
        if (title.includes('CAMPUS') && title.includes('GIRL')) {
          foundProduct = { id: doc.id, data: data };
        } else if (!foundProduct) {
          foundProduct = { id: doc.id, data: data };
        }
      }
    });
    
    if (foundProduct) {
      console.log(`🎯 Updating product: ${foundProduct.data.title}`);
      console.log(`   Product ID: ${foundProduct.id}\n`);
      
      // Update the product with the image filename
      await productsRef.doc(foundProduct.id).update({
        image: 'CAMPUSGIRLS.jpg',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Updated image to: CAMPUSGIRLS.jpg');
      console.log('\n🎉 Done! Now run: firebase deploy --only hosting');
      
    } else {
      console.log('❌ No matching product found.\n');
      console.log('📝 Please create a product named "CAMPUS GIRLS" in your admin panel first.');
      console.log('   Then run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

fixCampusGirls();
