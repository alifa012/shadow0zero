// Bulk Import Script - Import existing HTML products into Firestore
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Category mapping - maps HTML filename to category info
const categoryMap = {
    // Banks - USA
    'barclays.html': { name: 'Barclays Bank', slug: 'barclays', icon: 'fa-university' },
    'woodforest.html': { name: 'Woodforest Bank', slug: 'woodforest', icon: 'fa-building-columns' },
    'chasebank.html': { name: 'Chase Bank', slug: 'chasebank', icon: 'fa-landmark' },
    'BOA.html': { name: 'Bank of America', slug: 'boa', icon: 'fa-university' },
    'wellsfargo.html': { name: 'Wells Fargo', slug: 'wellsfargo', icon: 'fa-building-columns' },
    'citibank.html': { name: 'Citibank', slug: 'citibank', icon: 'fa-landmark' },
    'huntigonbank.html': { name: 'Huntington Bank', slug: 'huntigonbank', icon: 'fa-university' },
    'pncbank.html': { name: 'PNC Bank', slug: 'pncbank', icon: 'fa-building-columns' },
    'suntrust.html': { name: 'SunTrust Bank', slug: 'suntrust', icon: 'fa-landmark' },
    'M&TBANK.html': { name: 'M&T Bank', slug: 'm-tbank', icon: 'fa-university' },
    'tdbank.html': { name: 'TD Bank', slug: 'tdbank', icon: 'fa-building-columns' },
    'chimebank.html': { name: 'Chime Bank', slug: 'chimebank', icon: 'fa-landmark' },
    'hsbsbank.html': { name: 'HSBC Bank', slug: 'hsbsbank', icon: 'fa-university' },
    
    // Banks - Canada
    'canada.html': { name: 'Canadian Banks', slug: 'canada', icon: 'fa-building-columns' },
    'cibcbank.html': { name: 'CIBC Bank', slug: 'cibcbank', icon: 'fa-university' },
    'SCOTIA.html': { name: 'Scotia Bank', slug: 'scotia', icon: 'fa-landmark' },
    'rbc.html': { name: 'RBC Bank', slug: 'rbc', icon: 'fa-university' },
    
    // Banks - International
    'uk.html': { name: 'UK Banks', slug: 'uk', icon: 'fa-landmark' },
    'australia.html': { name: 'Australia Banks', slug: 'australia', icon: 'fa-university' },
    'australia_head.html': { name: 'Australia Premium', slug: 'australia-head', icon: 'fa-building-columns' },
    'france.html': { name: 'France Banks', slug: 'france', icon: 'fa-landmark' },
    'germany.html': { name: 'Germany Banks', slug: 'germany', icon: 'fa-university' },
    'italy.html': { name: 'Italy Banks', slug: 'italy', icon: 'fa-building-columns' },
    'belgium.html': { name: 'Belgium Banks', slug: 'belgium', icon: 'fa-landmark' },
    'DENMARK.html': { name: 'Denmark Banks', slug: 'denmark', icon: 'fa-university' },
    'finland.html': { name: 'Finland Banks', slug: 'finland', icon: 'fa-building-columns' },
    'sweden.html': { name: 'Sweden Banks', slug: 'sweden', icon: 'fa-landmark' },
    'russia.html': { name: 'Russia Banks', slug: 'russia', icon: 'fa-university' },
    'china.html': { name: 'China Banks', slug: 'china', icon: 'fa-building-columns' },
    'japan.html': { name: 'Japan Banks', slug: 'japan', icon: 'fa-landmark' },
    'india.html': { name: 'India Banks', slug: 'india', icon: 'fa-university' },
    'BRAZIL.html': { name: 'Brazil Banks', slug: 'brazil', icon: 'fa-building-columns' },
    'MEXICO.html': { name: 'Mexico Banks', slug: 'mexico', icon: 'fa-landmark' },
    'southafrica.html': { name: 'South Africa Banks', slug: 'southafrica', icon: 'fa-university' },
    
    // Payment Platforms
    'paypal.html': { name: 'PayPal', slug: 'paypal', icon: 'fa-paypal' },
    'cashapp.html': { name: 'Cash App', slug: 'cashapp', icon: 'fa-dollar-sign' },
    'venmo.html': { name: 'Venmo', slug: 'venmo', icon: 'fa-money-bill-transfer' },
    'westernunion.html': { name: 'Western Union', slug: 'westernunion', icon: 'fa-money-bill-transfer' },
    'worldremit.html': { name: 'WorldRemit', slug: 'worldremit', icon: 'fa-globe' },
    
    // Crypto
    'coinbase.html': { name: 'Coinbase', slug: 'coinbase', icon: 'fa-bitcoin' },
    'binance.html': { name: 'Binance', slug: 'binance', icon: 'fa-bitcoin' },
    'coinmama.html': { name: 'Coinmama', slug: 'coinmama', icon: 'fa-bitcoin' },
    'BTC seed cracker.html': { name: 'BTC Seed Cracker', slug: 'btc-seed-cracker', icon: 'fa-key' },
    
    // Cards
    'cvv.html': { name: 'CVV Cards', slug: 'cvv', icon: 'fa-credit-card' },
    'clonecards.html': { name: 'Clone Cards', slug: 'clonecards', icon: 'fa-clone' },
    'nonvbv.html': { name: 'Non-VBV Cards', slug: 'nonvbv', icon: 'fa-credit-card' },
    'Dumpcards.html': { name: 'Dump Cards', slug: 'dumpcards', icon: 'fa-credit-card' },
    'livebins.html': { name: 'Live Bins', slug: 'livebins', icon: 'fa-credit-card' },
    'visa cc.html': { name: 'VISA CC', slug: 'visa-cc', icon: 'fa-cc-visa' },
    'carded gifts.html': { name: 'Carded Gifts', slug: 'carded-gifts', icon: 'fa-gift' },
    'credit pin number.html': { name: 'Credit PIN Numbers', slug: 'credit-pin-number', icon: 'fa-lock' },
    
    // Tools & Services  
    'spamming.html': { name: 'Spamming Tools', slug: 'spamming', icon: 'fa-envelope' },
    'emailflood.html': { name: 'Email Flood', slug: 'emailflood', icon: 'fa-envelope-open' },
    'cc-checker.html': { name: 'CC Checker', slug: 'cc-checker', icon: 'fa-check' },
    'bypass otp.html': { name: 'Bypass OTP', slug: 'bypass-otp', icon: 'fa-shield-halved' },
    'burners.html': { name: 'Burner Phones', slug: 'burners', icon: 'fa-mobile' },
    'mobilelogs.html': { name: 'Mobile Logs', slug: 'mobilelogs', icon: 'fa-mobile-screen' },
    'softwares.html': { name: 'Software Tools', slug: 'softwares', icon: 'fa-laptop-code' },
    'vpnsocks.html': { name: 'VPN & Socks', slug: 'vpnsocks', icon: 'fa-user-secret' },
    'ssn-fulllz.html': { name: 'SSN & Fullz', slug: 'ssn-fulllz', icon: 'fa-id-card' },
    'webassist.html': { name: 'Web Assist', slug: 'webassist', icon: 'fa-globe' },
    
    // Shipping & Others
    'upsfedex.html': { name: 'UPS/FedEx', slug: 'upsfedex', icon: 'fa-truck' },
    'shopwithscrip.html': { name: 'Shop with Scrip', slug: 'shopwithscrip', icon: 'fa-shopping-cart' },
    'escrow.html': { name: 'Escrow Service', slug: 'escrow', icon: 'fa-handshake' },
    'deposit.html': { name: 'Deposits', slug: 'deposit', icon: 'fa-money-bill' },
    'rfcbu.html': { name: 'RFCBU', slug: 'rfcbu', icon: 'fa-building' },
};

// Parse HTML file and extract products
function parseProductsFromHTML(filePath) {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const products = [];
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        const title = card.querySelector('.product-title')?.textContent?.trim() || 'Untitled Product';
        const description = card.querySelector('.description-container p')?.textContent?.trim() || '';
        
        // Extract price
        const priceElements = card.querySelectorAll('.price-section');
        let price = 0;
        let balance = 0;
        
        priceElements.forEach(section => {
            const text = section.textContent;
            if (text.includes('Price:')) {
                const priceMatch = text.match(/\$?(\d+\.?\d*)/);
                if (priceMatch) price = parseFloat(priceMatch[1]);
            }
            if (text.includes('Balance:')) {
                const balanceMatch = text.match(/\$?(\d+\.?\d*)/);
                if (balanceMatch) balance = parseFloat(balanceMatch[1]);
            }
        });
        
        // Determine status
        let status = 'available';
        const soldBtn = card.querySelector('.btn-sold');
        if (soldBtn) status = 'sold';
        
        // Extract image (if present)
        const img = card.querySelector('.product-image img');
        const image = img ? img.getAttribute('src') : '';
        
        products.push({
            title,
            description,
            price,
            balance,
            status,
            image,
            order: index
        });
    });
    
    return products;
}

// Main import function
async function importAllProducts() {
    console.log('🚀 Starting bulk import...\n');
    
    let totalCategories = 0;
    let totalProducts = 0;
    
    try {
        // First, create all categories
        console.log('📁 Creating categories...');
        const categoryIds = {};
        
        for (const [filename, categoryInfo] of Object.entries(categoryMap)) {
            const filePath = path.join(__dirname, filename);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${filename} (file not found)`);
                continue;
            }
            
            // Create category in Firestore
            const categoryRef = await db.collection('categories').add({
                name: categoryInfo.name,
                slug: categoryInfo.slug,
                icon: categoryInfo.icon,
                active: true,
                order: totalCategories,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            categoryIds[filename] = categoryRef.id;
            totalCategories++;
            console.log(`✅ Created category: ${categoryInfo.name}`);
        }
        
        console.log(`\n✨ Created ${totalCategories} categories\n`);
        
        // Now import products for each category
        console.log('📦 Importing products...\n');
        
        for (const [filename, categoryInfo] of Object.entries(categoryMap)) {
            const filePath = path.join(__dirname, filename);
            
            if (!fs.existsSync(filePath) || !categoryIds[filename]) {
                continue;
            }
            
            console.log(`Processing ${filename}...`);
            const products = parseProductsFromHTML(filePath);
            
            // Add products to Firestore
            const batch = db.batch();
            let batchCount = 0;
            
            for (const product of products) {
                const productRef = db.collection('products').doc();
                batch.set(productRef, {
                    ...product,
                    categoryId: categoryIds[filename],
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                batchCount++;
                totalProducts++;
                
                // Firestore batch limit is 500
                if (batchCount === 500) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
            
            if (batchCount > 0) {
                await batch.commit();
            }
            
            console.log(`  ✅ Imported ${products.length} products from ${filename}`);
        }
        
        console.log('\n🎉 Import complete!');
        console.log(`📊 Summary: ${totalCategories} categories, ${totalProducts} products`);
        console.log('\n✨ You can now manage all products via the admin panel!');
        
    } catch (error) {
        console.error('❌ Error during import:', error);
    }
    
    process.exit(0);
}

// Run the import
importAllProducts();
