const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default descriptions by category type
const defaultDescriptions = {
    // Bank Logs
    'bank': '[Online Access] + [Account/Routing Number] + [Name And Address] + [Email Access] + [Credit Card Details] + [Phone Number] + [SSN/DOB Available]',
    
    // Payment Apps
    'payment': '[Full Account Access] + [Email Access] + [Linked Bank/Card] + [Transaction History] + [2FA Backup Codes]',
    
    // Crypto
    'crypto': '[Full Account Access] + [Email Access] + [2FA Backup Codes] + [Wallet Address] + [Trading History] + [KYC Verified]',
    
    // Cards
    'card': '[Card Number] + [CVV] + [Expiry Date] + [Cardholder Name] + [Billing Address] + [ZIP Code] + [Phone Number]',
    
    // Tools
    'tool': '[Full Access] + [Setup Guide] + [Support Available] + [Updates Included] + [Lifetime License]',
};

async function addDescriptions() {
    try {
        console.log('📝 Adding descriptions to products...\n');
        
        // Get all categories
        const categoriesSnapshot = await db.collection('categories').get();
        const categoryMap = {};
        
        categoriesSnapshot.forEach(doc => {
            const data = doc.data();
            categoryMap[doc.id] = data;
        });
        
        // Get all products without descriptions
        const productsSnapshot = await db.collection('products').get();
        
        let updated = 0;
        let skipped = 0;
        const batch = db.batch();
        let batchCount = 0;
        
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            
            // Skip if already has description
            if (product.description && product.description.trim() !== '') {
                skipped++;
                return;
            }
            
            // Determine description based on category
            const category = categoryMap[product.categoryId];
            let description = '';
            
            if (category) {
                const slug = category.slug.toLowerCase();
                
                // Determine type and assign appropriate description
                if (slug.includes('bank') || slug.includes('chase') || slug.includes('wells') || 
                    slug.includes('citibank') || slug.includes('boa') || slug.includes('hsbc') ||
                    slug.includes('huntington') || slug.includes('pnc') || slug.includes('suntrust') ||
                    slug.includes('td') || slug.includes('chime') || slug.includes('barclays') ||
                    slug.includes('woodforest') || slug.includes('scotia') || slug.includes('rbc') ||
                    slug.includes('cibc') || slug.includes('canada') || slug.includes('australia') ||
                    slug.includes('uk') || slug.includes('france') || slug.includes('germany') ||
                    slug.includes('italy') || slug.includes('belgium') || slug.includes('denmark') ||
                    slug.includes('finland') || slug.includes('sweden') || slug.includes('russia') ||
                    slug.includes('china') || slug.includes('japan') || slug.includes('india') ||
                    slug.includes('brazil') || slug.includes('mexico') || slug.includes('africa')) {
                    description = defaultDescriptions['bank'];
                }
                else if (slug.includes('paypal') || slug.includes('cashapp') || slug.includes('venmo') ||
                         slug.includes('western') || slug.includes('worldremit')) {
                    description = defaultDescriptions['payment'];
                }
                else if (slug.includes('coinbase') || slug.includes('binance') || slug.includes('coinmama') ||
                         slug.includes('btc') || slug.includes('crypto')) {
                    description = defaultDescriptions['crypto'];
                }
                else if (slug.includes('cvv') || slug.includes('card') || slug.includes('clone') ||
                         slug.includes('dump') || slug.includes('bin') || slug.includes('visa') ||
                         slug.includes('gift')) {
                    description = defaultDescriptions['card'];
                }
                else {
                    description = defaultDescriptions['tool'];
                }
            } else {
                description = '[Full Access] + [Complete Details] + [Verified] + [Support Available]';
            }
            
            // Update product
            batch.update(doc.ref, {
                description: description,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            batchCount++;
            updated++;
            
            console.log(`✅ ${product.title} → ${category ? category.name : 'Unknown'}`);
            
            // Commit batch every 500 items
            if (batchCount >= 500) {
                console.log('⏳ Committing batch...');
                batch.commit();
                batchCount = 0;
            }
        });
        
        // Commit remaining
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`\n✨ Complete!`);
        console.log(`   Updated: ${updated} products`);
        console.log(`   Skipped: ${skipped} products (already have descriptions)`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addDescriptions();
