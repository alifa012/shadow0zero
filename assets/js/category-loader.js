// Dynamic Category Loader for Home Page
// Loads categories from Firestore and displays them on the home page

// Firebase Configuration (use compat version for consistency)
const firebaseConfig = {
    apiKey: "AIzaSyDYon3KKPHbZ-CO4CDsWiU02AYHocXqb1s",
    authDomain: "shadowlogsshop.firebaseapp.com",
    projectId: "shadowlogsshop",
    storageBucket: "shadowlogsshop.firebasestorage.app",
    messagingSenderId: "568187276796",
    appId: "1:568187276796:web:cb900b5d70c83b0bef9ce5"
};

// Initialize Firebase only for categories
if (!window.categoriesFirebaseApp) {
    window.categoriesFirebaseApp = firebase.initializeApp(firebaseConfig, 'categories-app');
}

const db = window.categoriesFirebaseApp.firestore();

// Bank icon SVG (default for all categories)
const bankIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 11.7501H3C2.04 11.7501 1.25 10.9601 1.25 10.0001V6.68013C1.25 6.00013 1.71998 5.31013 2.34998 5.06013L11.35 1.46016C11.73 1.31016 12.27 1.31016 12.65 1.46016L21.65 5.06013C22.28 5.31013 22.75 6.01013 22.75 6.68013V10.0001C22.75 10.9601 21.96 11.7501 21 11.7501ZM12 2.84016C11.96 2.84016 11.92 2.84011 11.9 2.85011L2.90997 6.45015C2.84997 6.48015 2.75 6.61013 2.75 6.68013V10.0001C2.75 10.1401 2.86 10.2501 3 10.2501H21C21.14 10.2501 21.25 10.1401 21.25 10.0001V6.68013C21.25 6.61013 21.16 6.48015 21.09 6.45015L12.09 2.85011C12.07 2.84011 12.04 2.84016 12 2.84016Z" fill="#292D32"></path>
<path d="M22 22.75H2C1.59 22.75 1.25 22.41 1.25 22V19C1.25 18.04 2.04 17.25 3 17.25H21C21.96 17.25 22.75 18.04 22.75 19V22C22.75 22.41 22.41 22.75 22 22.75ZM2.75 21.25H21.25V19C21.25 18.86 21.14 18.75 21 18.75H3C2.86 18.75 2.75 18.86 2.75 19V21.25Z" fill="#292D32"></path>
<path d="M4 18.75C3.59 18.75 3.25 18.41 3.25 18V11C3.25 10.59 3.59 10.25 4 10.25C4.41 10.25 4.75 10.59 4.75 11V18C4.75 18.41 4.41 18.75 4 18.75Z" fill="#292D32"></path>
<path d="M8 18.75C7.59 18.75 7.25 18.41 7.25 18V11C7.25 10.59 7.59 10.25 8 10.25C8.41 10.25 8.75 10.59 8.75 11V18C8.75 18.41 8.41 18.75 8 18.75Z" fill="#292D32"></path>
<path d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V11C11.25 10.59 11.59 10.25 12 10.25C12.41 10.25 12.75 10.59 12.75 11V18C12.75 18.41 12.41 18.75 12 18.75Z" fill="#292D32"></path>
<path d="M16 18.75C15.59 18.75 15.25 18.41 15.25 18V11C15.25 10.59 15.59 10.25 16 10.25C16.41 10.25 16.75 10.59 16.75 11V18C16.75 18.41 16.41 18.75 16 18.75Z" fill="#292D32"></path>
<path d="M20 18.75C19.59 18.75 19.25 18.41 19.25 18V11C19.25 10.59 19.59 10.25 20 10.25C20.41 10.25 20.75 10.59 20.75 11V18C20.75 18.41 20.41 18.75 20 18.75Z" fill="#292D32"></path>
<path d="M23 22.75H1C0.59 22.75 0.25 22.41 0.25 22C0.25 21.59 0.59 21.25 1 21.25H23C23.41 21.25 23.75 21.59 23.75 22C23.75 22.41 23.41 22.75 23 22.75Z" fill="#292D32"></path>
<path d="M12 9.25C10.76 9.25 9.75 8.24 9.75 7C9.75 5.76 10.76 4.75 12 4.75C13.24 4.75 14.25 5.76 14.25 7C14.25 8.24 13.24 9.25 12 9.25ZM12 6.25C11.59 6.25 11.25 6.59 11.25 7C11.25 7.41 11.59 7.75 12 7.75C12.41 7.75 12.75 7.41 12.75 7C12.75 6.59 12.41 6.25 12 6.25Z" fill="#292D32"></path>
</svg>`;

// Load categories from Firestore
async function loadHomeCategories() {
    try {
        const categoriesList = document.querySelector('.categories-list');
        
        if (!categoriesList) {
            console.log('Categories list element not found');
            return;
        }
        
        // Show loading message
        categoriesList.innerHTML = '<li class="col-12 text-center"><p class="text-white">Loading categories...</p></li>';
        
        // Get only active categories from Firestore
        const snapshot = await db.collection('categories')
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('No active categories found');
            // Keep existing static categories as fallback
            return;
        }
        
        // Convert to array and sort by order
        const categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Clear the list
        categoriesList.innerHTML = '';
        
        // Add each category
        categories.forEach((category) => {
            const li = document.createElement('li');
            li.className = 'col-4 col-md-2 col-xl-2 mb-4';
            
            li.innerHTML = `
                <center>
                    <a href="/category.html?category=${encodeURIComponent(category.slug)}">
                        <div class="categories-box">
                            <i class="iconsax categories-icon" data-icon="bank">
                                ${bankIconSVG}
                            </i>
                        </div>
                        <h5 class="mt-2 text-center text-white">${category.name.toUpperCase()}</h5>
                    </a>
                </center>
            `;
            
            categoriesList.appendChild(li);
        });
        
        console.log(`✅ Loaded ${categories.length} categories from Firestore`);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        // Keep existing static HTML as fallback
    }
}

// Load categories when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHomeCategories);
} else {
    loadHomeCategories();
}
