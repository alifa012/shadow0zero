/**
 * Product Loader - Dynamically loads products from Firestore
 * Include this script on product pages (woodforest.html, paypal.html, etc.)
 * 
 * Usage in HTML:
 * <script src="assets/js/product-loader.js"></script>
 * <script>
 *   // Option 1: Load by category slug (auto-detected from filename)
 *   loadProductsFromFirestore();
 *   
 *   // Option 2: Load specific category
 *   loadProductsFromFirestore('woodforest');
 * </script>
 */

// Firebase Configuration (if not already initialized)
if (typeof firebase === 'undefined' || !firebase.apps.length) {
    const firebaseConfig = {
        apiKey: "AIzaSyDYon3KKPHbZ-CO4CDsWiU02AYHocXqb1s",
        authDomain: "shadowlogsshop.firebaseapp.com",
        projectId: "shadowlogsshop",
        storageBucket: "shadowlogsshop.firebasestorage.app",
        messagingSenderId: "568187276796",
        appId: "1:568187276796:web:cb900b5d70c83b0bef9ce5"
    };
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

/**
 * Load products from Firestore and inject into page
 * @param {string} categorySlug - Category slug (e.g., 'woodforest'). If null, auto-detect from filename
 */
async function loadProductsFromFirestore(categorySlug = null) {
    try {
        // Auto-detect category from filename if not provided
        if (!categorySlug) {
            const filename = window.location.pathname.split('/').pop().replace('.html', '');
            categorySlug = filename;
        }
        
        // Get category ID from slug
        const categorySnapshot = await db.collection('categories')
            .where('slug', '==', categorySlug)
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (categorySnapshot.empty) {
            console.log('No active category found for slug:', categorySlug);
            return false; // Keep static HTML
        }
        
        const categoryId = categorySnapshot.docs[0].id;
        
        // Get products for this category (no orderBy to avoid index requirement)
        const productsSnapshot = await db.collection('products')
            .where('categoryId', '==', categoryId)
            .get();
        
        if (productsSnapshot.empty) {
            console.log('No products found for category:', categorySlug);
            return false; // Keep static HTML
        }
        
        // Convert to array and sort by order field (client-side)
        const products = [];
        productsSnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        products.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Find the products container
        const container = document.querySelector('.row.gy-4');
        if (!container) {
            console.error('Products container not found');
            return false;
        }
        
        // Clear existing products
        container.innerHTML = '';
        
        // Render products
        products.forEach((product) => {
            const productId = product.id;
            
            const productHTML = generateProductCard(product, productId);
            container.innerHTML += productHTML;
        });
        
        console.log(`Loaded ${products.length} products from Firestore`);
        return true;
        
    } catch (error) {
        console.error('Error loading products from Firestore:', error);
        return false; // Keep static HTML on error
    }
}

/**
 * Generate product card HTML
 * @param {object} product - Product data from Firestore
 * @param {string} productId - Product document ID
 * @returns {string} HTML string
 */
function generateProductCard(product, productId) {
    const statusBadge = product.status === 'available' 
        ? '<span class="badge bg-success">Available</span>'
        : '<span class="badge bg-danger">Sold</span>';
    
    const buyButton = product.status === 'available'
        ? `<button class="dark-btn btn-available" onclick="confirmPurchase('${productId}')">
               <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Buy Now
           </button>`
        : `<button class="dark-btn btn-sold" disabled>
               <i class="fa-solid fa-times-circle" aria-hidden="true"></i> Sold Out
           </button>`;
    
    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image || 'btc.jpg'}" alt="placeholder">
                </div>

                <!-- Product Title -->
                <h5 class="product-title">${escapeHtml(product.title)}</h5>

                <!-- Scrollable Description -->
                <div class="description-container">
                    ${product.description}
                </div>

                <!-- Price Section -->
                <div class="price-section">
                    <span>Price:</span>
                    <span class="price-text">$${product.price.toFixed(2)}</span>
                </div>
                ${product.balance ? `
                <div class="price-section">
                    <span>Balance:</span>
                    <span class="price-text">$${product.balance.toFixed(2)}</span>
                </div>` : ''}

                <!-- Status & Actions -->
                <div class="status-container">
                    ${buyButton}
                    ${statusBadge}
                </div>
            </div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load dynamic navigation menu from categories
 */
async function loadDynamicNavigation() {
    try {
        const snapshot = await db.collection('categories')
            .where('active', '==', true)
            .orderBy('order', 'asc')
            .get();
        
        if (snapshot.empty) return;
        
        // Find the sidebar navigation container
        const navContainer = document.querySelector('.link-section');
        if (!navContainer) return;
        
        // Find the existing product links section
        let productLinksSection = null;
        navContainer.querySelectorAll('li').forEach(li => {
            const link = li.querySelector('a');
            if (link && link.textContent.includes('BANK LOGS')) {
                if (!productLinksSection) {
                    productLinksSection = li;
                }
            }
        });
        
        // Inject category links
        snapshot.forEach((doc) => {
            const category = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <a class="pages" href="/${category.slug}.html">
                    ${category.icon ? `<i class="fas ${category.icon}"></i>` : ''}
                    ${category.name}
                </a>
            `;
            
            if (productLinksSection) {
                productLinksSection.parentNode.insertBefore(li, productLinksSection);
            } else {
                navContainer.appendChild(li);
            }
        });
        
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
}

/**
 * Initialize on page load
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Auto-load products if on a product page
        if (document.querySelector('.row.gy-4')) {
            loadProductsFromFirestore();
        }
    });
} else {
    // DOM already loaded
    if (document.querySelector('.row.gy-4')) {
        loadProductsFromFirestore();
    }
}
