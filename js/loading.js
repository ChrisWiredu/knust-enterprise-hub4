// Loading states and UI feedback utilities

class LoadingManager {
    constructor() {
        this.loadingElements = new Map();
    }

    // Show loading state for a specific element
    showLoading(element, options = {}) {
        const {
            text = 'Loading...',
            spinner = true,
            disableElement = true,
            overlay = false
        } = options;

        // Store original content
        if (!this.loadingElements.has(element)) {
            this.loadingElements.set(element, {
                originalContent: element.innerHTML,
                originalDisabled: element.disabled,
                originalClasses: element.className
            });
        }

        // Disable element if requested
        if (disableElement && element.disabled !== undefined) {
            element.disabled = true;
        }

        // Create loading content
        let loadingHTML = '';
        if (spinner) {
            loadingHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${text}
            `;
        } else {
            loadingHTML = text;
        }

        // Apply loading state
        if (overlay) {
            this.createOverlay(element, loadingHTML);
        } else {
            element.innerHTML = loadingHTML;
            element.classList.add('loading-state');
        }
    }

    // Hide loading state
    hideLoading(element) {
        const original = this.loadingElements.get(element);
        if (original) {
            element.innerHTML = original.originalContent;
            element.disabled = original.originalDisabled;
            element.className = original.originalClasses;
            this.loadingElements.delete(element);
        }

        // Remove overlay if exists
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }

        element.classList.remove('loading-state');
    }

    // Create overlay for containers
    createOverlay(element, content) {
        // Remove existing overlay
        const existingOverlay = element.querySelector('.loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <div>${content}</div>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(overlay);
    }

    // Show skeleton loading for cards
    showSkeletonLoading(container, count = 3) {
        const skeletonHTML = Array(count).fill(0).map(() => `
            <div class="col">
                <div class="card h-100 skeleton-card">
                    <div class="skeleton-img"></div>
                    <div class="card-body">
                        <div class="skeleton-text skeleton-title"></div>
                        <div class="skeleton-text skeleton-subtitle"></div>
                        <div class="skeleton-text skeleton-content"></div>
                        <div class="skeleton-text skeleton-content"></div>
                        <div class="d-flex justify-content-between mt-3">
                            <div class="skeleton-text skeleton-small"></div>
                            <div class="skeleton-text skeleton-small"></div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="skeleton-text skeleton-button"></div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = skeletonHTML;
    }

    // Show loading toast notification
    showLoadingToast(message = 'Loading...') {
        // Remove existing loading toast
        const existingToast = document.querySelector('.loading-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast loading-toast position-fixed bottom-0 end-0 m-3';
        toast.style.zIndex = '1100';
        toast.innerHTML = `
            <div class="toast-body d-flex align-items-center">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                ${message}
            </div>
        `;

        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { autohide: false });
        bsToast.show();

        return toast;
    }

    // Hide loading toast
    hideLoadingToast() {
        const loadingToast = document.querySelector('.loading-toast');
        if (loadingToast) {
            const bsToast = bootstrap.Toast.getInstance(loadingToast);
            if (bsToast) {
                bsToast.hide();
            }
            setTimeout(() => loadingToast.remove(), 150);
        }
    }
}

// Global loading manager instance
const loadingManager = new LoadingManager();

// Utility functions for common loading scenarios
function showButtonLoading(button, text = 'Processing...') {
    loadingManager.showLoading(button, { text, spinner: true, disableElement: true });
}

function hideButtonLoading(button) {
    loadingManager.hideLoading(button);
}

function showPageLoading(container, text = 'Loading content...') {
    loadingManager.showLoading(container, { text, spinner: true, overlay: true });
}

function hidePageLoading(container) {
    loadingManager.hideLoading(container);
}

function showSkeletonCards(container, count = 3) {
    loadingManager.showSkeletonLoading(container, count);
}

function showLoadingToast(message) {
    return loadingManager.showLoadingToast(message);
}

function hideLoadingToast() {
    loadingManager.hideLoadingToast();
}

// Enhanced API wrapper with loading states
const APIWithLoading = {
    async request(endpoint, options = {}, loadingOptions = {}) {
        const {
            showToast = false,
            toastMessage = 'Loading...',
            buttonElement = null,
            containerElement = null
        } = loadingOptions;

        let loadingToast = null;

        try {
            // Show appropriate loading state
            if (buttonElement) {
                showButtonLoading(buttonElement, loadingOptions.buttonText);
            }
            
            if (containerElement) {
                showPageLoading(containerElement);
            }
            
            if (showToast) {
                loadingToast = showLoadingToast(toastMessage);
            }

            // Make the actual API call
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        } finally {
            // Hide loading states
            if (buttonElement) {
                hideButtonLoading(buttonElement);
            }
            
            if (containerElement) {
                hidePageLoading(containerElement);
            }
            
            if (loadingToast) {
                hideLoadingToast();
            }
        }
    },

    // Convenience methods
    async get(endpoint, loadingOptions = {}) {
        return this.request(endpoint, { method: 'GET' }, loadingOptions);
    },

    async post(endpoint, data, loadingOptions = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }, loadingOptions);
    },

    async put(endpoint, data, loadingOptions = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, loadingOptions);
    },

    async delete(endpoint, loadingOptions = {}) {
        return this.request(endpoint, { method: 'DELETE' }, loadingOptions);
    }
};

// Add loading styles if not already present
function addLoadingStyles() {
    const styleId = 'loading-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Loading overlay */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: inherit;
        }

        .loading-content {
            text-align: center;
            color: #6c757d;
        }

        /* Loading state for buttons */
        .loading-state {
            opacity: 0.7;
            cursor: not-allowed;
        }

        /* Skeleton loading animations */
        .skeleton-card {
            animation: skeleton-loading 1.5s ease-in-out infinite alternate;
        }

        .skeleton-img {
            height: 200px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s infinite;
        }

        .skeleton-text {
            height: 12px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s infinite;
            margin-bottom: 8px;
            border-radius: 4px;
        }

        .skeleton-title {
            height: 16px;
            width: 70%;
        }

        .skeleton-subtitle {
            height: 12px;
            width: 50%;
        }

        .skeleton-content {
            height: 10px;
            width: 90%;
        }

        .skeleton-small {
            height: 10px;
            width: 40%;
        }

        .skeleton-button {
            height: 32px;
            width: 100%;
        }

        @keyframes skeleton-shimmer {
            0% {
                background-position: -200% 0;
            }
            100% {
                background-position: 200% 0;
            }
        }

        @keyframes skeleton-loading {
            0% {
                opacity: 1;
            }
            100% {
                opacity: 0.7;
            }
        }

        /* Loading toast */
        .loading-toast {
            background-color: #343a40;
            color: white;
            border: none;
        }

        .loading-toast .toast-body {
            padding: 12px 16px;
        }
    `;

    document.head.appendChild(style);
}

// Initialize loading styles when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addLoadingStyles();
});

// Export for global use
window.LoadingManager = LoadingManager;
window.loadingManager = loadingManager;
window.showButtonLoading = showButtonLoading;
window.hideButtonLoading = hideButtonLoading;
window.showPageLoading = showPageLoading;
window.hidePageLoading = hidePageLoading;
window.showSkeletonCards = showSkeletonCards;
window.showLoadingToast = showLoadingToast;
window.hideLoadingToast = hideLoadingToast;
window.APIWithLoading = APIWithLoading;