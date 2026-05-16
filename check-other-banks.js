const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkOtherBanks() {
  try {
    const snapshot = await db.collection('products').get();
    
    const bankSamples = {
      'Chase': [],
      'PNC': [],
      'Wells Fargo': [],
      'Citi': [],
      'Huntington': []
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toUpperCase();
      
      if (title.includes('CHASE') && bankSamples['Chase'].length < 3) {
        bankSamples['Chase'].push({ title: data.title, image: data.image });
      }
      if (title.includes('PNC') && bankSamples['PNC'].length < 3) {
        bankSamples['PNC'].push({ title: data.title, image: data.image });
      }
      if (title.includes('WELLS') && bankSamples['Wells Fargo'].length < 3) {
        bankSamples['Wells Fargo'].push({ title: data.title, image: data.image });
      }
      if (title.includes('CITI') && bankSamples['Citi'].length < 3) {
        bankSamples['Citi'].push({ title: data.title, image: data.image });
      }
      if (title.includes('HUNTINGTON') && bankSamples['Huntington'].length < 3) {
        bankSamples['Huntington'].push({ title: data.title, image: data.image });
      }
    });
    
    console.log(`\n📊 Sample of Other Bank Products:\n`);
    
    Object.entries(bankSamples).forEach(([bankName, products]) => {
      console.log(`\n🏦 ${bankName} (${products.length} samples):`);
      products.forEach(p => {
        console.log(`   - ${p.title}`);
        console.log(`     → ${p.image}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkOtherBanks();
