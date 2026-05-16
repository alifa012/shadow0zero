const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Map specific bank names to their correct images (based on actual files in assets/images)
const bankImageMap = {
  'PNC': 'PNCBANK.jpg',
  'WELLS FARGO': 'wellsfargo.jpg',
  'WELLSFARGO': 'wellsfargo.jpg',
  'CITI': 'CITIBANK.jpg',
  'CHIME': 'CHIME.jpg',
  'HUNTINGTON': 'HUNTINGTON.jpg',
  'HSBC': 'HSBC.jpg',
  'TD BANK': 'TDBANK.jpg',
  'TD': 'TDBANK.jpg',
  'BARCLAYS': 'barclays.jpg',
  'SCOTIA': 'SCOTIA BANK.jpg',
  'RBC': 'RSBC.jpg',
  'WOODFOREST': 'woodforest.jpg',
  'M&T': 'M&TBANK.jpg',
  'SUNTRUST': 'SUNTRUST.jpg'
};

async function restoreBankImages() {
  try {
    console.log('🔄 Restoring bank product images...\n');
    
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    
    let restoredCount = 0;
    let boaCount = 0;
    let skippedCount = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      // Skip if doesn't contain BANK
      if (!title.includes('BANK')) {
        continue;
      }
      
      // Keep BANK OFAMERICA.jpg for Bank of America products only
      if (title.includes('BANK OF AMERICA') || title.includes('BOA')) {
        if (data.image !== 'BANK OFAMERICA.jpg') {
          batch.update(productsRef.doc(doc.id), {
            image: 'BANK OFAMERICA.jpg',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          batchCount++;
          boaCount++;
          console.log(`✅ BOA: "${data.title}"`);
        }
        continue;
      }
      
      // For other banks, find the correct image
      let correctImage = null;
      
      for (const [bankName, imageName] of Object.entries(bankImageMap)) {
        if (title.includes(bankName)) {
          correctImage = imageName;
          break;
        }
      }
      
      if (correctImage && data.image !== correctImage) {
        batch.update(productsRef.doc(doc.id), {
          image: correctImage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batchCount++;
        restoredCount++;
        console.log(`🔧 ${correctImage.padEnd(20)} → "${data.title}"`);
        
        // Commit batch every 500 operations (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      } else if (!correctImage && data.image === 'BANK OFAMERICA.jpg') {
        // Remove BANK OFAMERICA.jpg from products that aren't Bank of America
        // Set to generic btc.jpg for now
        batch.update(productsRef.doc(doc.id), {
          image: 'btc.jpg',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batchCount++;
        skippedCount++;
        console.log(`⚠️  Reset to default: "${data.title}"`);
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n✨ Restoration complete!`);
    console.log(`   ✅ Bank of America products: ${boaCount}`);
    console.log(`   🔧 Other banks restored: ${restoredCount}`);
    console.log(`   ⚠️  Reset to default (no specific image): ${skippedCount}`);
    console.log(`\n🎉 Now run: firebase deploy --only hosting`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

restoreBankImages();
