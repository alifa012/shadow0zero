const express = require('express');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = 3000;

// Get list of category HTML files
function getCategoryFiles() {
    const files = fs.readdirSync('.')
        .filter(f => f.endsWith('.html') && 
                !f.includes('.ddbak') && 
                !f.includes(' - Copy') &&
                !f.match(/^(index|login|home|admin-products|admin-simple|topup|deposit)/));
    return files;
}

// Parse products from HTML file
function parseProducts(filename) {
    const html = fs.readFileSync(filename, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const products = [];
    const productCards = doc.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        const title = card.querySelector('.product-title')?.textContent.trim() || '';
        const description = card.querySelector('.product-description')?.textContent.trim() || '';
        const price = card.querySelector('.product-price')?.textContent.trim() || '';
        const balance = card.querySelector('.product-balance')?.textContent.trim() || '';
        const statusBadge = card.querySelector('.badge');
        const status = statusBadge?.textContent.trim() || 'Available';
        const image = card.querySelector('.product-image img')?.getAttribute('src') || '';
        
        products.push({
            index,
            title,
            description,
            price,
            balance,
            status,
            image,
            html: card.outerHTML
        });
    });
    
    const categoryName = filename.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return {
        filename,
        category: categoryName,
        products
    };
}

// Update product status in HTML file
function updateProductStatus(filename, productIndex, newStatus) {
    let html = fs.readFileSync(filename, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const productCards = doc.querySelectorAll('.product-card');
    if (productIndex >= productCards.length) {
        throw new Error('Product index out of range');
    }
    
    const card = productCards[productIndex];
    const statusBadge = card.querySelector('.badge');
    
    if (statusBadge) {
        // Update badge text
        statusBadge.textContent = newStatus;
        
        // Update badge classes
        statusBadge.className = 'badge';
        if (newStatus === 'Available') {
            statusBadge.classList.add('bg-success');
        } else if (newStatus === 'Sold') {
            statusBadge.classList.add('bg-danger');
        } else if (newStatus === 'Pending') {
            statusBadge.classList.add('bg-warning');
        }
    }
    
    // Write back to file
    fs.writeFileSync(filename, dom.serialize(), 'utf8');
    return true;
}

// Add new product to HTML file
function addProduct(filename, productData) {
    let html = fs.readFileSync(filename, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Find the products container (row with gy-4 class)
    const container = doc.querySelector('.row.gy-4');
    if (!container) {
        throw new Error('Products container not found');
    }
    
    // Create new product HTML
    const statusClass = productData.status === 'Available' ? 'bg-success' : 
                       productData.status === 'Sold' ? 'bg-danger' : 'bg-warning';
    
    const productHTML = `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${productData.image || 'btc.jpg'}" alt="${productData.title}">
                        </div>
                        <div class="product-info">
                            <h5 class="product-title">${productData.title}</h5>
                            <p class="product-description">${productData.description}</p>
                            <div class="product-price-row">
                                <span class="product-price">${productData.price}</span>
                                <span class="product-balance">${productData.balance}</span>
                            </div>
                            <span class="badge ${statusClass}">${productData.status}</span>
                            <div class="product-actions">
                                <button class="btn-add-cart" onclick="addToCart(this)">
                                    <i class="fas fa-shopping-cart"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
    
    // Add to container
    container.insertAdjacentHTML('beforeend', productHTML);
    
    // Write back to file
    fs.writeFileSync(filename, dom.serialize(), 'utf8');
    return true;
}

// Delete product from HTML file
function deleteProduct(filename, productIndex) {
    let html = fs.readFileSync(filename, 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    const productCards = doc.querySelectorAll('.product-card');
    if (productIndex >= productCards.length) {
        throw new Error('Product index out of range');
    }
    
    // Remove the parent col div
    const card = productCards[productIndex];
    const colDiv = card.parentElement;
    if (colDiv) {
        colDiv.remove();
    }
    
    // Write back to file
    fs.writeFileSync(filename, dom.serialize(), 'utf8');
    return true;
}

// Create new category HTML file
function createCategory(categoryName) {
    const filename = categoryName.toLowerCase().replace(/\s+/g, '-') + '.html';
    
    // Check if file already exists
    if (fs.existsSync(filename)) {
        throw new Error('Category already exists');
    }
    
    // Use barclays.html as template
    let template = fs.readFileSync('barclays.html', 'utf8');
    
    // Replace title
    template = template.replace(/<title>.*?<\/title>/, `<title>${categoryName} — Inventory</title>`);
    
    // Clear all products (find the row.gy-4 container and empty it)
    const dom = new JSDOM(template);
    const doc = dom.window.document;
    const container = doc.querySelector('.row.gy-4');
    if (container) {
        container.innerHTML = '\n                ';
    }
    
    // Write new file
    fs.writeFileSync(filename, dom.serialize(), 'utf8');
    return filename;
}

// API Routes
app.get('/api/categories', (req, res) => {
    try {
        const files = getCategoryFiles();
        const categories = files.map(f => parseProducts(f));
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/update-status', (req, res) => {
    try {
        const { filename, productIndex, status } = req.body;
        updateProductStatus(filename, productIndex, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/add-product', (req, res) => {
    try {
        const { filename, product } = req.body;
        addProduct(filename, product);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/delete-product', (req, res) => {
    try {
        const { filename, productIndex } = req.body;
        deleteProduct(filename, productIndex);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/create-category', (req, res) => {
    try {
        const { categoryName } = req.body;
        const filename = createCategory(categoryName);
        res.json({ success: true, filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ Product Manager running at http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT}/admin-simple.html in your browser\n`);
});
