// Comprehensive error handling for KNUST Enterprise Hub

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.setupGlobalErrorHandling();
    }

    // Setup global error handling
    setupGlobalErrorHandling() {
        // Handle uncaught JavaScript errors (only log, don't show user errors)
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // Only show error for critical errors, not minor ones
            if (this.isCriticalError(event.message)) {
                this.handleError({
                    type: 'JavaScript Error',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            }
        });

        // Handle unhandled promise rejections (only log, don't show user errors)
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            
            // Only show error for critical promise rejections
            if (this.isCriticalError(event.reason?.message || '')) {
                this.handleError({
                    type: 'Unhandled Promise Rejection',
                    message: event.reason?.message || 'Unknown promise rejection',
                    reason: event.reason
                });
            }
        });

        // Handle network errors
        window.addEventListener('offline', () => {
            this.showNetworkError('You are offline. Please check your internet connection.');
        });

        window.addEventListener('online', () => {
            this.showNetworkSuccess('Connection restored!');
        });
    }

    // Determine if error is critical enough to show to user
    isCriticalError(message) {
        if (!message) return false;
        
        const criticalKeywords = [
            'network',
            'fetch failed',
            'server error',
            'database',
            'authentication',
            'payment',
            'security'
        ];
        
        const nonCriticalKeywords = [
            'favicon.ico',
            'google-analytics',
            'gtag',
            'adsense',
            'tracking',
            'analytics',
            'undefined',
            'null',
            'resize',
            'scroll'
        ];
        
        // Don't show errors for non-critical issues
        if (nonCriticalKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
            return false;
        }
        
        // Show errors for critical issues
        return criticalKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    // Handle different types of errors
    handleError(errorInfo) {
        console.error('Error caught by ErrorHandler:', errorInfo);
        
        // Store error for debugging
        this.errors.push({
            ...errorInfo,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Show user-friendly error message
        this.showErrorMessage(this.getFriendlyErrorMessage(errorInfo));

        // Send error to server (if needed)
        this.reportError(errorInfo);
    }

    // Convert technical errors to user-friendly messages
    getFriendlyErrorMessage(errorInfo) {
        const { type, message } = errorInfo;

        // Network-related errors
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to load')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }

        // Database-related errors
        if (message.includes('database') || message.includes('connection')) {
            return 'There seems to be a problem with our servers. Please try again in a few moments.';
        }

        // Form validation errors
        if (message.includes('validation') || message.includes('required')) {
            return 'Please check your form inputs and try again.';
        }

        // File upload errors
        if (message.includes('file') || message.includes('upload')) {
            return 'There was a problem uploading your file. Please try again with a different file.';
        }

        // Permission errors
        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'You don\'t have permission to perform this action.';
        }

        // Default fallback
        return 'Something went wrong. Please refresh the page and try again.';
    }

    // Show error message to user
    showErrorMessage(message, type = 'error') {
        // Remove existing error alerts
        const existingAlerts = document.querySelectorAll('.alert-danger, .error-alert');
        existingAlerts.forEach(alert => {
            if (alert.classList.contains('error-alert')) {
                alert.remove();
            }
        });

        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show error-alert position-fixed top-0 start-50 translate-middle-x mt-3`;
        alert.style.zIndex = '1200';
        alert.style.maxWidth = '500px';
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                    <strong>Oops!</strong> ${message}
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                const bsAlert = bootstrap.Alert.getInstance(alert);
                if (bsAlert) {
                    bsAlert.close();
                } else {
                    alert.remove();
                }
            }
        }, 8000);
    }

    // Show network-specific errors
    showNetworkError(message) {
        const networkAlert = document.createElement('div');
        networkAlert.className = 'alert alert-warning alert-dismissible fade show network-alert position-fixed bottom-0 start-50 translate-middle-x mb-3';
        networkAlert.style.zIndex = '1200';
        networkAlert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-wifi me-2"></i>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Remove existing network alerts
        const existingNetworkAlerts = document.querySelectorAll('.network-alert');
        existingNetworkAlerts.forEach(alert => alert.remove());

        document.body.appendChild(networkAlert);
    }

    // Show network success message
    showNetworkSuccess(message) {
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-dismissible fade show network-alert position-fixed bottom-0 start-50 translate-middle-x mb-3';
        successAlert.style.zIndex = '1200';
        successAlert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-2"></i>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Remove existing network alerts
        const existingNetworkAlerts = document.querySelectorAll('.network-alert');
        existingNetworkAlerts.forEach(alert => alert.remove());

        document.body.appendChild(successAlert);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successAlert.parentNode) {
                const bsAlert = bootstrap.Alert.getInstance(successAlert);
                if (bsAlert) {
                    bsAlert.close();
                } else {
                    successAlert.remove();
                }
            }
        }, 3000);
    }

    // Report error to server (optional)
    reportError(errorInfo) {
        // Only report in production
        if (window.location.hostname === 'localhost') return;

        try {
            fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: errorInfo,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            }).catch(() => {
                // Silently fail if error reporting fails
                console.warn('Failed to report error to server');
            });
        } catch (e) {
            // Silently fail
        }
    }

    // Manually handle API errors
    handleAPIError(error, context = '') {
        let message = 'An unexpected error occurred.';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            message = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.status) {
            switch (error.status) {
                case 400:
                    message = 'Invalid request. Please check your input and try again.';
                    break;
                case 401:
                    message = 'You need to log in to perform this action.';
                    break;
                case 403:
                    message = 'You don\'t have permission to perform this action.';
                    break;
                case 404:
                    message = 'The requested resource was not found.';
                    break;
                case 500:
                    message = 'Server error. Please try again later.';
                    break;
                case 503:
                    message = 'Service temporarily unavailable. Please try again later.';
                    break;
                default:
                    message = `Server returned error ${error.status}. Please try again.`;
            }
        }

        this.showErrorMessage(message);
        console.error(`API Error in ${context}:`, error);
    }

    // Retry mechanism for failed operations
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`Attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    // Get error statistics for debugging
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.slice(-5)
        };

        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    // Clear error history
    clearErrors() {
        this.errors = [];
    }
}

// Enhanced API wrapper with error handling
const APIWithErrorHandling = {
    async request(endpoint, options = {}, retryOptions = {}) {
        const {
            maxRetries = 2,
            retryDelay = 1000,
            context = endpoint
        } = retryOptions;

        return errorHandler.retryOperation(async () => {
            try {
                const response = await fetch(`/api${endpoint}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });

                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}`);
                    error.status = response.status;
                    error.response = response;
                    throw error;
                }

                return await response.json();
            } catch (error) {
                errorHandler.handleAPIError(error, context);
                throw error;
            }
        }, maxRetries, retryDelay);
    },

    // Convenience methods with error handling
    async get(endpoint, retryOptions = {}) {
        return this.request(endpoint, { method: 'GET' }, retryOptions);
    },

    async post(endpoint, data, retryOptions = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }, retryOptions);
    },

    async put(endpoint, data, retryOptions = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, retryOptions);
    },

    async delete(endpoint, retryOptions = {}) {
        return this.request(endpoint, { method: 'DELETE' }, retryOptions);
    }
};

// Form error handling utilities
function addFormErrorHandling() {
    // Handle form submission errors
    document.addEventListener('submit', function(event) {
        const form = event.target;
        
        // Add error handling to form submissions
        if (form.tagName === 'FORM') {
            form.addEventListener('error', function(e) {
                errorHandler.handleError({
                    type: 'Form Error',
                    message: 'Form submission failed',
                    form: form.id || 'unknown',
                    error: e
                });
            });
        }
    });

    // Handle file input errors
    document.addEventListener('change', function(event) {
        if (event.target.type === 'file') {
            const files = event.target.files;
            
            Array.from(files).forEach(file => {
                // Check file size (50MB limit)
                if (file.size > 50 * 1024 * 1024) {
                    errorHandler.showErrorMessage(`File "${file.name}" is too large. Maximum size is 50MB.`);
                    event.target.value = '';
                }
                
                // Check file type for images
                if (event.target.accept && event.target.accept.includes('image')) {
                    if (!file.type.startsWith('image/')) {
                        errorHandler.showErrorMessage(`"${file.name}" is not a valid image file.`);
                        event.target.value = '';
                    }
                }
            });
        }
    });
}

// Initialize error handling
const errorHandler = new ErrorHandler();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addFormErrorHandling();
    
    // Test if all required JavaScript libraries are loaded
    if (typeof bootstrap === 'undefined') {
        errorHandler.showErrorMessage('Bootstrap library failed to load. Some features may not work properly.');
    }
});

// Simple alert function for manual use
function showAlert(message, type = 'success') {
    // Remove existing alerts of the same type
    const existingAlerts = document.querySelectorAll(`.alert-${type === 'success' ? 'success' : type === 'danger' ? 'danger' : 'warning'}.manual-alert`);
    existingAlerts.forEach(alert => alert.remove());

    const alertClass = type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-warning';
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show manual-alert position-fixed top-0 start-50 translate-middle-x mt-3`;
    alert.style.zIndex = '1200';
    alert.style.maxWidth = '500px';
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${iconClass} me-2"></i>
            <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            const bsAlert = bootstrap.Alert?.getInstance(alert);
            if (bsAlert) {
                bsAlert.close();
            } else {
                alert.remove();
            }
        }
    }, 5000);
}

// Export for global use
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;
window.APIWithErrorHandling = APIWithErrorHandling;
window.showAlert = showAlert;