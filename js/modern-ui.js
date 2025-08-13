// Modern UI enhancements for KNUST Enterprise Hub

// Enhanced search functionality
function performSearch() {
    const searchTerm = document.getElementById('globalSearch').value;
    const category = document.getElementById('categoryFilter').value;
    
    console.log('Searching for:', searchTerm, 'in category:', category);
    
    // Show loading state
    const searchButton = document.querySelector('.search-box button');
    showButtonLoading(searchButton, 'Searching...');
    
    // Simulate search delay
    setTimeout(() => {
        hideButtonLoading(searchButton);
        
        if (searchTerm.trim()) {
            showAlert(`Searching for "${searchTerm}"${category ? ` in ${category}` : ''}...`, 'info');
            // Here you would implement the actual search functionality
            filterBusinesses(searchTerm, category);
        } else {
            showAlert('Please enter a search term', 'warning');
        }
    }, 1000);
}

// Filter businesses by category
function filterByCategory(category) {
    console.log('Filtering by category:', category);
    
    // Update the category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    
    // Perform the filter
    filterBusinesses('', category);
    
    // Show feedback
    showAlert(`Showing businesses in ${category}`, 'info');
}

// Enhanced business filtering
function filterBusinesses(searchTerm = '', category = '') {
    const businessGrid = document.getElementById('businessGrid');
    
    // Show skeleton loading
    showSkeletonCards(businessGrid, 6);

    // Try API first
    const params = new URLSearchParams();
    if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());
    if (category && category.trim()) params.set('category', category.trim());

    APIWithErrorHandling.get(`/businesses${params.toString() ? `?${params.toString()}` : ''}`, { context: 'Filtering Businesses' })
        .then((result) => {
            const businesses = result.businesses || result; // support controller-like or simple list
            renderBusinesses(Array.isArray(businesses) ? businesses : []);
            const businessCount = document.getElementById('businessCount');
            if (businessCount) businessCount.textContent = `${Array.isArray(businesses) ? businesses.length : 0}+`;
        })
        .catch(() => {
            // Fallback to static data
            setTimeout(() => {
                const businesses = getStaticBusinesses();
                let filtered = businesses;
                if (searchTerm.trim()) {
                    filtered = filtered.filter(b =>
                        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.description.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
                if (category) {
                    filtered = filtered.filter(b => b.category === category);
                }
                renderBusinesses(filtered);
                const businessCount = document.getElementById('businessCount');
                if (businessCount) businessCount.textContent = `${filtered.length}+`;
            }, 500);
        });
}

// Enhanced business card rendering
function renderEnhancedBusinessCard(business, index) {
    const delay = index * 100; // Stagger animation
    
    return `
        <div class="col fade-in" style="animation-delay: ${delay}ms;">
            <div class="card h-100 business-card hover-lift">
                <div class="position-relative">
                    <img src="${business.logo_url}" class="card-img-top business-card-img" alt="${business.name}">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="category-badge">${business.category}</span>
                    </div>
                    ${business.featured ? '<div class="position-absolute top-0 start-0 m-2"><span class="badge bg-warning text-dark"><i class="fas fa-star me-1"></i>Featured</span></div>' : ''}
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${business.name}</h5>
                        <div class="rating-star">
                            ${generateStarRating(business.average_rating || 0)}
                        </div>
                    </div>
                    <p class="card-text text-muted small mb-3">${business.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-map-marker-alt text-muted me-1"></i>
                            <span class="text-muted small">${business.location}</span>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">${business.review_count || 0} reviews</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewBusiness(${business.id})">
                            <i class="fas fa-eye me-1"></i> View
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="quickContact(${business.id})" title="Quick Contact">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addToFavorites(${business.id})" title="Add to Favorites">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update the main renderBusinesses function
function renderBusinesses(businesses) {
    const container = document.querySelector('#businessGrid');
    if (!container) return;
    
    if (businesses.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No businesses found</h4>
                <p class="text-muted">Try adjusting your search criteria or browse all categories.</p>
                <button class="btn btn-primary" onclick="clearFilters()">
                    <i class="fas fa-refresh me-2"></i> Show All Businesses
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    businesses.forEach((business, index) => {
        html += renderEnhancedBusinessCard(business, index);
    });
    
    container.innerHTML = html;
    
    // Trigger animations
    setTimeout(() => {
        container.querySelectorAll('.fade-in').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
}

// Quick contact functionality
function quickContact(businessId) {
    // This would open a quick contact modal or redirect to WhatsApp
    showAlert('Quick contact feature coming soon!', 'info');
}

// Add to favorites functionality
function addToFavorites(businessId) {
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.classList.add('text-danger');
        showAlert('Added to favorites!', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.classList.remove('text-danger');
        showAlert('Removed from favorites', 'info');
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('globalSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    filterBusinesses();
}

// Enhanced search with Enter key support
function setupEnhancedSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Add search suggestions (mock data)
        searchInput.addEventListener('input', function(e) {
            if (e.target.value.length > 2) {
                // Here you would implement search suggestions
                console.log('Searching for suggestions:', e.target.value);
            }
        });
    }
}

// Smooth scrolling for navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Add floating action button for quick business registration
function addFloatingActionButton() {
    const fab = document.createElement('button');
    fab.className = 'fab d-lg-none'; // Only show on mobile
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.title = 'Register Business';
    fab.onclick = () => {
        if (authManager && authManager.isAuthenticated()) {
            window.location.hash = '#register-business';
        } else {
            authManager.showAuthRequiredMessage('register a business');
        }
    };
    
    document.body.appendChild(fab);
}

// Parallax effect for hero section
function setupParallaxEffect() {
    const hero = document.querySelector('.hero-section');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            hero.style.transform = `translateY(${parallax}px)`;
        });
    }
}

// Initialize all modern UI features
function initializeModernUI() {
    setupEnhancedSearch();
    setupSmoothScrolling();
    setupLazyLoading();
    addFloatingActionButton();
    // setupParallaxEffect(); // Disabled for better performance
    
    // Load businesses with enhanced rendering
    if (window.location.hash === '#business-list' || !window.location.hash) {
        setTimeout(() => {
            loadBusinesses();
        }, 500);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeModernUI, 100);
});

// Export functions for global use
window.performSearch = performSearch;
window.filterByCategory = filterByCategory;
window.quickContact = quickContact;
window.addToFavorites = addToFavorites;
window.clearFilters = clearFilters;
