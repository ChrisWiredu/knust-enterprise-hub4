// KNUST Enterprise Hub Frontend JavaScript

// Global state
let currentUser = null;
let cart = {
    items: [],
    addItem: function(product) {
        const id = typeof product.id === 'number' || typeof product.id === 'string' ? product.id : `${product.name}-${product.business_name || product.business}`;
        const existingItem = this.items.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, id, quantity: 1 });
        }
        this.updateCart();
        this.showNotification(`${product.name} added to cart`);
    },
    removeItem: function(productId) {
        this.items = this.items.filter(item => String(item.id) !== String(productId));
        this.updateCart();
    },
    updateQuantity: function(productId, quantity) {
        const item = this.items.find(item => String(item.id) === String(productId));
        if (item) {
            const q = parseInt(quantity, 10);
            if (!q || q <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = q;
            }
        }
        this.updateCart();
    },
    updateCart: function() {
        document.querySelector('.cart-count').textContent = this.items.length;
        this.renderCartItems();
        localStorage.setItem('cart', JSON.stringify(this.items));
    },
    renderCartItems: function() {
        const cartItemsEl = document.querySelector('.cart-items');
        
        if (this.items.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        let total = 0;
        
        this.items.forEach(item => {
            const itemTotal = Number(item.price) * Number(item.quantity);
            total += itemTotal;
            
            html += `
                <div class="cart-item border-bottom pb-3 mb-3">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${item.image_url || item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" class="img-fluid rounded" style="width: 60px; height: 60px; object-fit: cover;">
                        </div>
                        <div class="col-md-4">
                            <h6 class="mb-1">${item.name}</h6>
                            <small class="text-muted">${item.business_name || item.business || ''}</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm" 
                                   onchange="cart.updateQuantity('${item.id}', this.value)">
                        </div>
                        <div class="col-md-2 text-end">
                            <span class="fw-bold">GHS ${itemTotal.toFixed(2)}</span>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-sm btn-link text-danger" onclick="cart.removeItem('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="text-end">
                <h5>Total: GHS ${total.toFixed(2)}</h5>
            </div>
        `;
        
        cartItemsEl.innerHTML = html;
    },
    showNotification: function(message) {
        const notification = document.createElement('div');
        notification.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success alert-dismissible fade show';
        notification.style.zIndex = '1100';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 150);
        }, 3000);
    },
    clear: function() {
        this.items = [];
        this.updateCart();
    }
};

// API functions
const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Business endpoints
    async getBusinesses(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/businesses${queryString ? '?' + queryString : ''}`);
    },
    
    async getBusiness(id) {
        return this.request(`/businesses/${id}`);
    },
    
    async createBusiness(businessData) {
        return this.request('/businesses', {
            method: 'POST',
            body: JSON.stringify(businessData)
        });
    },
    
    // Product endpoints
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products${queryString ? '?' + queryString : ''}`);
    },
    
    async getProductsByBusiness(businessId) {
        return this.request(`/products/business/${businessId}`);
    },
    
    // User endpoints
    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async loginUser(credentials) {
        return this.request('/users/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
    
    // Order endpoints
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }
};

// Business registration form handling
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart.items = JSON.parse(savedCart);
        cart.updateCart();
    }

    // Business registration form
    const businessForm = document.getElementById('businessRegistrationForm');
    if (businessForm) {
        businessForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(businessForm);
            const businessData = {
                name: formData.get('businessName') || document.getElementById('businessName').value,
                description: document.getElementById('businessDescription').value,
                category: document.getElementById('businessCategory').value,
                location: document.getElementById('location').value,
                contact_number: document.getElementById('contactNumber').value,
                whatsapp_link: document.getElementById('whatsapp').value,
                instagram_handle: document.getElementById('instagram').value,
                logo_url: '', // Will be handled with file upload
                owner_id: 1 // Temporary - should come from user session
            };
            
            try {
                const result = await API.createBusiness(businessData);
                showAlert('Business registered successfully!', 'success');
                businessForm.reset();
                document.getElementById('logoPreviewContainer').style.display = 'none';
            } catch (error) {
                showAlert('Error registering business. Please try again.', 'danger');
            }
        });
    }

    // Logo preview
    const logoInput = document.getElementById('businessLogo');
    if (logoInput) {
        logoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('logoPreview');
            const previewContainer = document.getElementById('logoPreviewContainer');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }

    // Load businesses on page load
    if (window.location.hash === '#business-list' || !window.location.hash) {
        loadBusinesses();
    }
});

// Load businesses from API with loading state
async function loadBusinesses() {
    const container = document.querySelector('#business-list .row');
    
    try {
        // Show skeleton loading
        showSkeletonCards(container, 3);
        
        const result = await APIWithErrorHandling.get('/businesses', { context: 'Loading Businesses' });
        renderBusinesses(result.businesses || result);
    } catch (error) {
        console.error('Error loading businesses:', error);
        // Fallback to static data
        renderBusinesses(getStaticBusinesses());
        
        // Show a more gentle fallback message
        showAlert('Showing sample businesses. We\'re working to connect to our servers.', 'info');
    }
}

// Render businesses in the UI
function renderBusinesses(businesses) {
    const container = document.querySelector('#business-list .row');
    if (!container) return;
    
    let html = '';
    businesses.forEach(business => {
        html += `
            <div class="col">
                <div class="card h-100 fade-in">
                    <img src="${business.logo_url || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(business.name)}" 
                         class="card-img-top business-card-img" alt="${business.name}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${business.name}</h5>
                            <span class="badge category-badge">${business.category}</span>
                        </div>
                        <p class="card-text text-muted small">${business.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="rating-star">
                                    ${generateStarRating(business.average_rating || 0)}
                                    (${business.review_count || 0})
                                </span>
                            </div>
                            <span class="text-muted small">
                                <i class="fas fa-map-marker-alt"></i> ${business.location}
                            </span>
                        </div>
                    </div>
                    <div class="card-footer bg-white border-0">
                        <button class="btn btn-sm btn-outline-primary w-100" onclick="viewBusiness(${business.id})">
                            View Business
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let html = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    
    return html;
}

// View business details with loading state
async function viewBusiness(businessId) {
    const detailSection = document.getElementById('business-detail');
    
    try {
        // Navigate to detail view early for better UX
        window.location.hash = 'business-detail';
        
        // Show loading overlay
        showPageLoading(detailSection, 'Loading business details...');
        
        const business = await APIWithErrorHandling.get(`/businesses/${businessId}`, { context: 'Loading Business Details' });
        hidePageLoading(detailSection);
        showBusinessDetail(business);
    } catch (error) {
        console.error('Error loading business:', error);
        hidePageLoading(detailSection);
        // Error message will be handled by APIWithErrorHandling
    }
}

// Show business detail page
function showBusinessDetail(business) {
    // Hide other sections
    document.getElementById('business-list').style.display = 'none';
    document.getElementById('register-business').style.display = 'none';
    
    // Show business detail section
    const detailSection = document.getElementById('business-detail');
    detailSection.style.display = 'block';
    
    // Update business detail content
    updateBusinessDetailContent(business);
}

// Update business detail content
function updateBusinessDetailContent(business) {
    // Update primary info
    const titleEl = document.querySelector('#business-detail .card-title');
    const badgeEl = document.querySelector('#business-detail .badge');
    const descEl = document.querySelector('#business-detail .card-text');
    const imgEl = document.querySelector('#business-detail .card img');

    if (titleEl) titleEl.textContent = business.name || '';
    if (badgeEl) badgeEl.textContent = business.category || '';
    if (descEl) descEl.textContent = business.description || '';
    if (imgEl) imgEl.src = business.logo_url || imgEl.src;

    // Social/contact links
    const waLink = document.querySelector('#business-detail a[href^="https://wa.me/"]');
    const igLink = document.querySelector('#business-detail a[href*="instagram.com"]');
    const callLink = document.querySelector('#business-detail a[href^="tel:"]');
    if (waLink && business.whatsapp_link) waLink.href = `https://wa.me/${business.whatsapp_link.replace(/[^0-9]/g,'')}`;
    if (igLink && business.instagram_handle) igLink.href = `https://instagram.com/${business.instagram_handle.replace(/^@/, '')}`;
    if (callLink && business.contact_number) callLink.href = `tel:+${business.contact_number.replace(/[^0-9]/g,'')}`;

    // Location/date
    const locationEl = Array.from(document.querySelectorAll('#business-detail .fa-map-marker-alt'))[0]?.parentElement;
    if (locationEl && business.location) {
        locationEl.lastChild && (locationEl.lastChild.textContent = ` ${business.location}`);
    }

    const dateEl = Array.from(document.querySelectorAll('#business-detail .text-muted.small')).find(e => e.textContent.includes('Registered on'));
    if (dateEl && business.created_at) {
        const dateStr = new Date(business.created_at).toLocaleDateString();
        dateEl.textContent = `Registered on ${dateStr}`;
    }

    // Update products
    if (business.products && business.products.length > 0) {
        renderBusinessProducts(business.products);
    }

    // Update reviews
    if (business.reviews && business.reviews.length > 0) {
        renderBusinessReviews(business.reviews);
    }
}

// Render business products
function renderBusinessProducts(products) {
    const container = document.querySelector('#business-detail .row-cols-1');
    if (!container) return;
    
    let html = '';
    products.forEach(product => {
        html += `
            <div class="col">
                <div class="card h-100">
                    <img src="${product.image_url || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(product.name)}" 
                         class="card-img-top" alt="${product.name}" style="height: 150px; object-fit: cover;">
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text text-muted small">${product.description}</p> 
                        <p class="card-text fw-bold">GHS ${product.price}</p>
                        <span class="badge ${product.is_available ? 'bg-success' : 'bg-danger'}">
                            ${product.is_available ? 'Available' : 'Out of Stock'}
                        </span>
                        ${product.is_available ? `
                            <button class="btn btn-sm btn-primary mt-2 w-100 add-to-cart" 
                                    onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                                <i class="fas fa-cart-plus me-1"></i> Add to Cart
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Add to cart function
function addToCart(product) {
    cart.addItem(product);
}

// Show alert messages
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '1100';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Navigation between sections
function showSection(sectionId) {
    const sections = ['business-list', 'business-detail', 'register-business'];
    sections.forEach(section => {
        document.getElementById(section).style.display = 
            section === sectionId ? 'block' : 'none';
    });
}

// Initialize
window.addEventListener('load', function() {
    const hash = window.location.hash.substring(1) || 'business-list';
    showSection(hash);
});

window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1) || 'business-list';
    showSection(hash);
    
    if (hash === 'business-list') {
        loadBusinesses();
    }
});

// Static business data fallback
function getStaticBusinesses() {
    return [
        {
            id: 1,
            name: "Los Barbados",
            description: "Delicious homemade meals delivered to your hostel at affordable prices.",
            category: "Food & Drinks",
            location: "Unity Hall",
            average_rating: 4.0,
            review_count: 24,
            logo_url: "img2/losb.jpg"
        },
        {
            id: 2,
            name: "Ayeduase Tech Solutions",
            description: "Laptop repairs, phone screen replacements, and software installations.",
            category: "Electronics",
            location: "CCB",
            average_rating: 4.5,
            review_count: 37,
            logo_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop"
        },
        {
            id: 3,
            name: "Kwaku's Thrift Collections",
            description: "Trendy clothes and accessories for students at student-friendly prices.",
            category: "Fashion",
            location: "Africa Hall",
            average_rating: 4.2,
            review_count: 15,
            logo_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop"
        },
        {
            id: 4,
            name: "Campus Hair Studio",
            description: "Professional hairstyling and braiding services for students.",
            category: "Services",
            location: "Independence Hall",
            average_rating: 4.8,
            review_count: 32,
            logo_url: "img2/hair1.JPG"
        },
        {
            id: 5,
            name: "Fresh Braids & Beauty",
            description: "Expert braiding services with modern styles and affordable prices.",
            category: "Services", 
            location: "Africa Hall",
            average_rating: 4.6,
            review_count: 28,
            logo_url: "img2/braid1.WEBP"
        },
        {
            id: 6,
            name: "AA Digital Services",
            description: "Digital design, printing, and computer services for students.",
            category: "Services",
            location: "Kotei",
            average_rating: 4.3,
            review_count: 19,
            logo_url: "img2/AA.png"
        }
    ];
}