const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Map category slugs to image filenames
const categoryImageMap = {
    // Banks - USA
    'barclays': 'barclays.jpg',
    'woodforest': 'woodforest.jpg',
    'chasebank': 'chasebank.jpg',
    'boa': 'boa.jpg',
    'wellsfargo': 'wellsfargo.jpg',
    'citibank': 'CITIBANK.jpg',
    'huntigonbank': 'HUNTINGTON.jpg',
    'pncbank': 'PNCBANK.jpg',
    'suntrust': 'SUNTRUST.jpg',
    'm-tbank': 'M&TBANK.jpg',
    'tdbank': 'TDBANK.jpg',
    'chimebank': 'CHIME.jpg',
    'hsbsbank': 'HSBC.jpg',
    
    // Banks - Canada
    'canada': 'CANADIAN.jpg',
    'cibcbank': 'CANADIAN.jpg',
    'scotia': 'SCOTIA BANK.jpg',
    'rbc': 'RSBC.jpg',
    
    // Banks - International
    'uk': 'ukcards.jpg',
    'australia': 'australia.jpg',
    'australia-head': 'australia.jpg',
    'france': 'france.jpg',
    'denmark': 'denmark.jpg',
    'finland': 'finland.jpg',
    'sweden': 'swedenbanks.jpg',
    'brazil': 'brazil.jpg',
    'china': 'CHINA.jpg',
    'italy': 'ITALY.jpg',
    
    // Payment Platforms
    'paypal': 'paypal.jpg',
    'cashapp': 'cashapp.jpg',
    'venmo': 'venmo.jpg',
    'worldremit': 'worldremit.jpg',
    'westernunion': 'WESTERNUNION.jpg',
    
    // Crypto
    'coinbase': 'coinbase.jpg',
    'binance': 'Binance.jpg',
    'coinmama': 'coinmama.jpg',
    'btc-seed-cracker': 'btcseedcrackerr.jpg',
    
    // Cards
    'cvv': 'cvv.jpg',
    'clonecards': 'clonecards.jpg',
    'nonvbv': 'nonvbvcards.jpg',
    'dumpcards': 'dumpcards.jpg',
    'carded-gifts': 'CARDEDGIFTS.jpg',
    'livebins': 'BINLOGS.jpg',
    'credit-pin-number': 'CPN.png',
    
    // Tools & Services
    'spamming': 'spamming.jpg',
    'emailflood': 'EMAILFLOOD.jpg',
    'cc-checker': 'ccchecker.jpg',
    'bypass-otp': 'BYPASSOTP.jpg',
    'mobilelogs': 'mobilelogs.jpg',
    'softwares': 'softwaretools.jpg',
    'vpnsocks': 'VPNSOCKS5.jpg',
    'ssn-fulllz': 'ssn&fullz.jpg',
    
    // Shipping & Others
    'upsfedex': 'fedex.jpg',
    'escrow': 'escrow.jpg',
    
    // Custom Categories
    'ebonies': 'EBONIES.jpg',
};

async function updateProductImages() {
    try {
        console.log('🚀 Starting product image update...\n');
        
        // Get all categories
        const categoriesSnapshot = await db.collection('categories').get();
        const categoryMap = {};
        
        categoriesSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = {
                slug: data.slug,
                name: data.name
            };
        });
        
        console.log(`📁 Found ${Object.keys(categoryMap).length} categories\n`);
        
        let totalUpdated = 0;
        let totalSkipped = 0;
        
        // Process each category
        for (const [categoryId, categoryInfo] of Object.entries(categoryMap)) {
            const imageName = categoryImageMap[categoryInfo.slug];
            
            if (!imageName) {
                console.log(`⚠️  No image mapped for: ${categoryInfo.name} (${categoryInfo.slug})`);
                continue;
            }
            
            // Get all products for this category
            const productsSnapshot = await db.collection('products')
                .where('categoryId', '==', categoryId)
                .get();
            
            if (productsSnapshot.empty) {
                console.log(`ℹ️  No products found for: ${categoryInfo.name}`);
                continue;
            }
            
            // Update each product
            const batch = db.batch();
            let batchCount = 0;
            
            productsSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    image: imageName,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                batchCount++;
            });
            
            await batch.commit();
            totalUpdated += batchCount;
            
            console.log(`✅ Updated ${batchCount} products in "${categoryInfo.name}" with image: ${imageName}`);
        }
        
        console.log(`\n✨ Complete! Updated ${totalUpdated} products with images`);
        console.log(`⚠️  Skipped ${totalSkipped} products (no image available)`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error updating products:', error);
        process.exit(1);
    }
}

updateProductImages();
