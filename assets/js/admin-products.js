// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYon3KKPHbZ-CO4CDsWiU02AYHocXqb1s",
    authDomain: "shadowlogsshop.firebaseapp.com",
    projectId: "shadowlogsshop",
    storageBucket: "shadowlogsshop.firebasestorage.app",
    messagingSenderId: "568187276796",
    appId: "1:568187276796:web:cb900b5d70c83b0bef9ce5"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
    // Simple auth check (no Firebase Auth needed)
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
    } else {
        // Initialize admin interface
        initializeAdmin();
    }
});

// Initialize admin interface
function initializeAdmin() {
    setupEventListeners();
    loadCategories();
    // Don't load products initially, wait for user to click Products tab
}

// Setup event listeners
function setupEventListeners() {
    const categoryForm = document.getElementById('categoryForm');
    const productForm = document.getElementById('productForm');
    const filterCategory = document.getElementById('filterCategory');
    const categoryName = document.getElementById('categoryName');
    const categorySlug = document.getElementById('categorySlug');
    
    if (categoryForm) {
        categoryForm.addEventListener('submit', saveCategory);
    }
    
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }
    
    if (filterCategory) {
        filterCategory.addEventListener('change', loadProducts);
    }
    
    // Auto-generate slug from category name
    if (categoryName && categorySlug) {
        categoryName.addEventListener('input', (e) => {
            const slug = e.target.value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            categorySlug.value = slug;
        });
    }
    
    // Load products when Products tab is clicked
    const productTabBtn = document.querySelector('[data-bs-target="#products-tab"]');
    if (productTabBtn) {
        productTabBtn.addEventListener('click', function() {
            loadProducts();
        });
    }
}

// ==================== CATEGORY FUNCTIONS ====================

async function loadCategories() {
    try {
        // Remove orderBy to avoid index requirements on empty database
        const snapshot = await db.collection('categories')
            .get();
        
        const categoriesList = document.getElementById('categoriesList');
        const categorySelect = document.getElementById('productCategory');
        const filterSelect = document.getElementById('filterCategory');
        const importCategorySelect = document.getElementById('importCategory');
        const categoryCount = document.getElementById('categoryCount');
        
        if (!categoriesList) return; // Tab not loaded yet
        
        if (categorySelect) categorySelect.innerHTML = '<option value="">Select category...</option>';
        if (filterSelect) filterSelect.innerHTML = '<option value="">All Categories</option>';
        if (importCategorySelect) importCategorySelect.innerHTML = '<option value="">Select category...</option>';
        
        if (snapshot.empty) {
            categoriesList.innerHTML = '<p class="text-muted"><i class="fas fa-info-circle"></i> No categories yet. Add your first category using the form!</p>';
            if (categoryCount) categoryCount.textContent = '0';
            return;
        }
        
        if (categoryCount) categoryCount.textContent = snapshot.size;
        
        // Convert to array and sort by order field
        const categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        categories.forEach((category) => {
            const categoryId = category.id;
            
            // Add to list
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-grip-vertical drag-handle"></i>
                        ${category.icon ? `<i class="fas ${category.icon} me-2"></i>` : ''}
                        <strong>${category.name}</strong>
                        <span class="badge ${category.active ? 'bg-success' : 'bg-secondary'} ms-2">
                            ${category.active ? 'Active' : 'Inactive'}
                        </span>
                        <small class="text-muted ms-2">/${category.slug}.html</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-success" onclick="editCategory('${categoryId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${categoryId}', '${category.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
            
            // Add to dropdowns
            const option = `<option value="${categoryId}">${category.name}</option>`;
            if (categorySelect) categorySelect.innerHTML += option;
            if (filterSelect) filterSelect.innerHTML += option;
            if (importCategorySelect) importCategorySelect.innerHTML += option;
        });
        
        // Initialize drag & drop
        if (categoriesList) {
            new Sortable(categoriesList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: updateCategoryOrder
            });
        }
        
    } catch (error) {
        console.error('Error loading categories:', error);
        const categoriesList = document.getElementById('categoriesList');
        const categoryCount = document.getElementById('categoryCount');
        if (categoriesList) {
            categoriesList.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Error loading categories. This is normal for a new database. Try adding your first category!</div>';
        }
        if (categoryCount) categoryCount.textContent = '0';
        Swal.fire({
            icon: 'info',
            title: 'Welcome!',
            text: 'Your database is empty. Start by adding your first category using the form on the left!',
            confirmButtonColor: '#28a745'
        });
    }
}

async function saveCategory(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        name: document.getElementById('categoryName').value,
        slug: document.getElementById('categorySlug').value,
        icon: document.getElementById('categoryIcon').value,
        active: document.getElementById('categoryActive').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (categoryId) {
            // Update existing
            await db.collection('categories').doc(categoryId).update(categoryData);
            Swal.fire('Success', 'Category updated!', 'success');
        } else {
            // Create new
            const snapshot = await db.collection('categories').get();
            categoryData.order = snapshot.size;
            categoryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('categories').add(categoryData);
            Swal.fire('Success', 'Category created!', 'success');
        }
        
        resetCategoryForm();
        loadCategories();
        
    } catch (error) {
        console.error('Error saving category:', error);
        Swal.fire('Error', 'Failed to save category', 'error');
    }
}

async function editCategory(categoryId) {
    try {
        const doc = await db.collection('categories').doc(categoryId).get();
        const category = doc.data();
        
        document.getElementById('categoryId').value = categoryId;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categorySlug').value = category.slug;
        document.getElementById('categoryIcon').value = category.icon || '';
        document.getElementById('categoryActive').checked = category.active;
        
        // Scroll to form
        document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading category:', error);
        Swal.fire('Error', 'Failed to load category', 'error');
    }
}

async function deleteCategory(categoryId, categoryName) {
    // Check if category has products
    const productsSnapshot = await db.collection('products')
        .where('categoryId', '==', categoryId)
        .get();
    
    if (!productsSnapshot.empty) {
        Swal.fire('Cannot Delete', 
            `This category has ${productsSnapshot.size} product(s). Please delete or move the products first.`, 
            'warning');
        return;
    }
    
    const result = await Swal.fire({
        title: 'Delete Category?',
        text: `Are you sure you want to delete "${categoryName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, delete it'
    });
    
    if (result.isConfirmed) {
        try {
            await db.collection('categories').doc(categoryId).delete();
            Swal.fire('Deleted!', 'Category deleted successfully', 'success');
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            Swal.fire('Error', 'Failed to delete category', 'error');
        }
    }
}

function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryActive').checked = true;
}

async function updateCategoryOrder(evt) {
    const categoriesList = document.getElementById('categoriesList');
    const items = categoriesList.querySelectorAll('.category-item');
    
    const batch = db.batch();
    
    items.forEach((item, index) => {
        const button = item.querySelector('button[onclick^="editCategory"]');
        const categoryId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        const ref = db.collection('categories').doc(categoryId);
        batch.update(ref, { order: index });
    });
    
    try {
        await batch.commit();
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// ==================== PRODUCT FUNCTIONS ====================

async function loadProducts() {
    try {
        const filterCategoryEl = document.getElementById('filterCategory');
        const productsList = document.getElementById('productsList');
        const productCount = document.getElementById('productCount');
        
        if (!productsList) return; // Tab not loaded yet
        
        const filterCategory = filterCategoryEl ? filterCategoryEl.value : '';
        
        let query = db.collection('products');
        
        if (filterCategory) {
            query = query.where('categoryId', '==', filterCategory);
        }
        
        // Remove orderBy to avoid index requirement
        const snapshot = await query.get();
        
        productsList.innerHTML = '';
        
        if (snapshot.empty) {
            productsList.innerHTML = '<p class="text-muted"><i class="fas fa-info-circle"></i> No products yet. Add your first product!</p>';
            if (productCount) productCount.textContent = '0';
            return;
        }
        
        if (productCount) productCount.textContent = snapshot.size;
        
        // Convert to array and sort by order
        const products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        products.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        products.forEach((product) => {
            const productId = product.id;
            
            const statusColors = {
                available: 'success',
                sold: 'danger',
                pending: 'warning'
            };
            
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <i class="fas fa-grip-vertical drag-handle"></i>
                        <strong>${product.title}</strong>
                        <span class="badge bg-${statusColors[product.status]} ms-2">${product.status}</span>
                        <br>
                        <small class="text-muted">${product.description.substring(0, 100)}...</small>
                        <br>
                        <span class="badge bg-dark mt-1">Price: $${product.price}</span>
                        ${product.balance ? `<span class="badge bg-info mt-1">Balance: $${product.balance}</span>` : ''}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-success" onclick="editProduct('${productId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${productId}', '${product.title}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            productsList.appendChild(productItem);
        });
        
        // Initialize drag & drop
        if (productsList) {
            new Sortable(productsList, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: updateProductOrder
            });
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        const productsList = document.getElementById('productsList');
        const productCount = document.getElementById('productCount');
        if (productsList) {
            productsList.innerHTML = '<div class="alert alert-warning"><i class="fas fa-info-circle"></i> No products yet. Add categories first, then add products!</div>';
        }
        if (productCount) productCount.textContent = '0';
    }
}

async function saveProduct(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        categoryId: document.getElementById('productCategory').value,
        title: document.getElementById('productTitle').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        balance: parseFloat(document.getElementById('productBalance').value) || 0,
        status: document.getElementById('productStatus').value,
        image: document.getElementById('productImage').value || 'btc.jpg',
        active: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (productId) {
            // Update existing
            await db.collection('products').doc(productId).update(productData);
            Swal.fire('Success', 'Product updated!', 'success');
        } else {
            // Create new
            const snapshot = await db.collection('products')
                .where('categoryId', '==', productData.categoryId)
                .get();
            productData.order = snapshot.size;
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            Swal.fire('Success', 'Product created!', 'success');
        }
        
        resetProductForm();
        loadProducts();
        
    } catch (error) {
        console.error('Error saving product:', error);
        Swal.fire('Error', 'Failed to save product', 'error');
    }
}

async function editProduct(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        const product = doc.data();
        
        document.getElementById('productId').value = productId;
        document.getElementById('productCategory').value = product.categoryId;
        document.getElementById('productTitle').value = product.title;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productBalance').value = product.balance || '';
        document.getElementById('productStatus').value = product.status;
        document.getElementById('productImage').value = product.image || '';
        
        // Show image preview if image exists
        if (product.image) {
            showImagePreview(product.image);
        }
        
        // Switch to products tab and scroll to form
        const productsTab = new bootstrap.Tab(document.querySelector('[data-bs-target="#products-tab"]'));
        productsTab.show();
        document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading product:', error);
        Swal.fire('Error', 'Failed to load product', 'error');
    }
}

async function deleteProduct(productId, productTitle) {
    const result = await Swal.fire({
        title: 'Delete Product?',
        text: `Are you sure you want to delete "${productTitle}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, delete it'
    });
    
    if (result.isConfirmed) {
        try {
            await db.collection('products').doc(productId).delete();
            Swal.fire('Deleted!', 'Product deleted successfully', 'success');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            Swal.fire('Error', 'Failed to delete product', 'error');
        }
    }
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    clearImagePreview(); // Clear image preview when resetting form
}

async function updateProductOrder(evt) {
    const productsList = document.getElementById('productsList');
    const items = productsList.querySelectorAll('.product-item');
    
    const batch = db.batch();
    
    items.forEach((item, index) => {
        const button = item.querySelector('button[onclick^="editProduct"]');
        const productId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        const ref = db.collection('products').doc(productId);
        batch.update(ref, { order: index });
    });
    
    try {
        await batch.commit();
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// ==================== IMPORT FUNCTIONS ====================

async function importFromHTML() {
    const fileName = document.getElementById('importFile').value;
    const categoryId = document.getElementById('importCategory').value;
    
    if (!fileName || !categoryId) {
        Swal.fire('Missing Information', 'Please select both file and category', 'warning');
        return;
    }
    
    Swal.fire({
        title: 'Import Not Yet Implemented',
        html: 'This feature requires server-side HTML parsing.<br><br>For now, you can:<br>1. Manually copy product details from HTML files<br>2. Use the product form to add them one by one<br><br>In a future update, we can add a bulk CSV import feature.',
        icon: 'info'
    });
}

// ==================== IMAGE UPLOAD & PREVIEW ====================

// Handle image file selection
document.addEventListener('DOMContentLoaded', function() {
    const imageFileInput = document.getElementById('productImageFile');
    const imageUrlInput = document.getElementById('productImage');
    
    if (imageFileInput) {
        imageFileInput.addEventListener('change', handleImageUpload);
    }
    
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', handleImageURL);
    }
});

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        Swal.fire('Invalid File', 'Please upload a valid image file (JPG, PNG, GIF, WebP)', 'error');
        e.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        Swal.fire('File Too Large', 'Image must be less than 5MB', 'error');
        e.target.value = '';
        return;
    }
    
    // Store only the filename (not base64)
    const fileName = file.name;
    document.getElementById('productImage').value = fileName;
    
    // Read and preview image for visual confirmation
    const reader = new FileReader();
    reader.onload = function(event) {
        showImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    
    // Show instructions to user
    Swal.fire({
        icon: 'info',
        title: 'Image Upload Instructions',
        html: `<p>Image filename: <strong>${fileName}</strong></p>
               <p>Please ensure this image file is placed in the <code>assets/images/</code> folder before deploying.</p>
               <p>After adding the file, run: <code>firebase deploy --only hosting</code></p>`,
        confirmButtonText: 'Got it!'
    });
}

function handleImageURL(e) {
    const url = e.target.value.trim();
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
        showImagePreview(url);
    }
}

function showImagePreview(src) {
    const preview = document.getElementById('imagePreview');
    const img = document.getElementById('previewImg');
    img.src = src;
    preview.style.display = 'block';
}

function clearImagePreview() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productImageFile').value = '';
}

// ==================== EXPORT TO JSON ====================

async function exportToJSON() {
    try {
        const categoryId = document.getElementById('exportCategory')?.value || '';
        
        // Show loading
        Swal.fire({
            title: 'Exporting...',
            text: 'Please wait while we prepare your data',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch categories
        const categoriesSnapshot = await db.collection('categories').get();
        const categories = {};
        categoriesSnapshot.forEach(doc => {
            categories[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // Fetch products
        let productsQuery = db.collection('products');
        if (categoryId) {
            productsQuery = productsQuery.where('categoryId', '==', categoryId);
        }
        const productsSnapshot = await productsQuery.get();
        
        const products = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // Create export object
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            categories: Object.values(categories),
            products: products,
            totalCategories: Object.keys(categories).length,
            totalProducts: products.length
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Complete!',
            html: `
                <p><strong>${exportData.totalCategories}</strong> categories</p>
                <p><strong>${exportData.totalProducts}</strong> products</p>
            `,
            confirmButtonColor: '#28a745'
        });
        
    } catch (error) {
        console.error('Export error:', error);
        Swal.fire('Error', 'Failed to export data: ' + error.message, 'error');
    }
}

// ==================== IMPORT FROM JSON ====================

async function importFromJSON() {
    const fileInput = document.getElementById('importJSONFile');
    const file = fileInput.files[0];
    
    if (!file) {
        Swal.fire('No File', 'Please select a JSON file to import', 'warning');
        return;
    }
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
        Swal.fire('Invalid File', 'Please select a valid JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.categories || !data.products) {
                throw new Error('Invalid JSON structure. Expected categories and products arrays.');
            }
            
            // Confirm import
            const result = await Swal.fire({
                title: 'Confirm Import',
                html: `
                    <p>This will import:</p>
                    <p><strong>${data.categories.length}</strong> categories</p>
                    <p><strong>${data.products.length}</strong> products</p>
                    <p class="text-danger mt-3">⚠️ Existing items with same names may be duplicated</p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Import',
                confirmButtonColor: '#28a745'
            });
            
            if (!result.isConfirmed) return;
            
            // Show progress
            const progress = document.getElementById('jsonImportProgress');
            const progressBar = document.getElementById('jsonProgressBar');
            const progressText = document.getElementById('jsonProgressText');
            progress.style.display = 'block';
            
            let imported = 0;
            const total = data.categories.length + data.products.length;
            
            // Import categories first
            const categoryMapping = {}; // Map old IDs to new IDs
            for (const category of data.categories) {
                const oldId = category.id;
                delete category.id; // Remove old ID
                
                // Add timestamps
                category.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                category.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                const docRef = await db.collection('categories').add(category);
                categoryMapping[oldId] = docRef.id;
                
                imported++;
                const percent = (imported / total) * 100;
                progressBar.style.width = percent + '%';
                progressText.textContent = `Imported ${imported} of ${total} items...`;
            }
            
            // Import products
            for (const product of data.products) {
                delete product.id; // Remove old ID
                
                // Map to new category ID
                if (product.categoryId && categoryMapping[product.categoryId]) {
                    product.categoryId = categoryMapping[product.categoryId];
                }
                
                // Add timestamps
                product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                product.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                await db.collection('products').add(product);
                
                imported++;
                const percent = (imported / total) * 100;
                progressBar.style.width = percent + '%';
                progressText.textContent = `Imported ${imported} of ${total} items...`;
            }
            
            // Complete
            progress.style.display = 'none';
            progressBar.style.width = '0%';
            
            await Swal.fire({
                icon: 'success',
                title: 'Import Complete!',
                html: `
                    <p>Successfully imported:</p>
                    <p><strong>${data.categories.length}</strong> categories</p>
                    <p><strong>${data.products.length}</strong> products</p>
                `,
                confirmButtonColor: '#28a745'
            });
            
            // Reload data
            loadCategories();
            loadProducts();
            fileInput.value = '';
            
        } catch (error) {
            console.error('Import error:', error);
            document.getElementById('jsonImportProgress').style.display = 'none';
            Swal.fire('Import Failed', error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Load export category dropdown when import/export tab is shown
document.addEventListener('DOMContentLoaded', function() {
    const importExportTab = document.querySelector('[data-bs-target="#import-tab"]');
    if (importExportTab) {
        importExportTab.addEventListener('click', async function() {
            const exportCategorySelect = document.getElementById('exportCategory');
            if (exportCategorySelect && exportCategorySelect.options.length === 1) {
                try {
                    const snapshot = await db.collection('categories').get();
                    snapshot.forEach(doc => {
                        const category = doc.data();
                        const option = document.createElement('option');
                        option.value = doc.id;
                        option.textContent = category.name;
                        exportCategorySelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading categories for export:', error);
                }
            }
        });
    }
});
