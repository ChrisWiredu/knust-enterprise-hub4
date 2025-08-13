// Form validation utilities for KNUST Enterprise Hub

class FormValidator {
    constructor() {
        this.errors = [];
    }

    // Validate required fields
    validateRequired(value, fieldName) {
        if (!value || value.trim() === '') {
            this.errors.push(`${fieldName} is required`);
            return false;
        }
        return true;
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.errors.push('Please enter a valid email address');
            return false;
        }
        return true;
    }

    // Validate Ghana phone number
    validatePhoneNumber(phone) {
        // Remove any spaces or special characters
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Check if it's a valid Ghana phone number (9 digits after country code)
        const phoneRegex = /^[0-9]{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            this.errors.push('Please enter a valid 9-digit phone number');
            return false;
        }
        return true;
    }

    // Validate business name
    validateBusinessName(name) {
        if (!this.validateRequired(name, 'Business name')) return false;
        
        if (name.length < 3) {
            this.errors.push('Business name must be at least 3 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.errors.push('Business name must be less than 100 characters');
            return false;
        }
        
        return true;
    }

    // Validate description
    validateDescription(description) {
        if (!this.validateRequired(description, 'Description')) return false;
        
        if (description.length < 10) {
            this.errors.push('Description must be at least 10 characters long');
            return false;
        }
        
        if (description.length > 500) {
            this.errors.push('Description must be less than 500 characters');
            return false;
        }
        
        return true;
    }

    // Validate file upload
    validateImageFile(file) {
        if (!file) {
            this.errors.push('Business logo is required');
            return false;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.errors.push('Logo must be a JPEG, PNG, or WebP image');
            return false;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.errors.push('Logo file size must be less than 5MB');
            return false;
        }

        return true;
    }

    // Validate URL format
    validateURL(url, fieldName = 'URL') {
        if (url && url.trim() !== '') {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlRegex.test(url)) {
                this.errors.push(`Please enter a valid ${fieldName}`);
                return false;
            }
        }
        return true;
    }

    // Get all validation errors
    getErrors() {
        return this.errors;
    }

    // Clear errors
    clearErrors() {
        this.errors = [];
    }

    // Check if form is valid
    isValid() {
        return this.errors.length === 0;
    }
}

// Business registration form validation
function validateBusinessForm(formData) {
    const validator = new FormValidator();
    
    // Validate business name
    validator.validateBusinessName(formData.businessName);
    
    // Validate description
    validator.validateDescription(formData.description);
    
    // Validate category
    validator.validateRequired(formData.category, 'Category');
    
    // Validate location
    validator.validateRequired(formData.location, 'Location');
    
    // Validate contact number
    validator.validatePhoneNumber(formData.contactNumber);
    
    // Validate WhatsApp (optional)
    if (formData.whatsapp) {
        validator.validatePhoneNumber(formData.whatsapp);
    }
    
    // Validate Instagram handle (optional)
    if (formData.instagram && formData.instagram.trim() !== '') {
        const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
        if (!instagramRegex.test(formData.instagram)) {
            validator.errors.push('Instagram handle can only contain letters, numbers, dots, and underscores');
        }
    }
    
    // Validate logo file
    if (formData.logoFile) {
        validator.validateImageFile(formData.logoFile);
    }
    
    return validator;
}

// Show validation errors in UI
function showValidationErrors(errors) {
    // Remove any existing error alerts
    const existingAlerts = document.querySelectorAll('.alert-danger');
    existingAlerts.forEach(alert => alert.remove());
    
    if (errors.length > 0) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        errorAlert.innerHTML = `
            <h6><i class="fas fa-exclamation-triangle me-2"></i>Please fix the following errors:</h6>
            <ul class="mb-0">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at the top of the form
        const form = document.getElementById('businessRegistrationForm');
        form.parentNode.insertBefore(errorAlert, form);
        
        // Scroll to the error alert
        errorAlert.scrollIntoView({ behavior: 'smooth' });
    }
}

// Real-time validation feedback
function addRealTimeValidation() {
    const form = document.getElementById('businessRegistrationForm');
    if (!form) return;
    
    // Business name validation
    const businessNameInput = document.getElementById('businessName');
    if (businessNameInput) {
        businessNameInput.addEventListener('blur', function() {
            validateSingleField(this, 'businessName');
        });
    }
    
    // Description validation
    const descriptionInput = document.getElementById('businessDescription');
    if (descriptionInput) {
        descriptionInput.addEventListener('blur', function() {
            validateSingleField(this, 'description');
        });
        
        // Character counter
        descriptionInput.addEventListener('input', function() {
            updateCharacterCounter(this, 500);
        });
    }
    
    // Phone number validation
    const phoneInput = document.getElementById('contactNumber');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            validateSingleField(this, 'contactNumber');
        });
        
        // Format phone number as user types
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
}

// Validate single field
function validateSingleField(input, fieldType) {
    const validator = new FormValidator();
    const value = input.value.trim();
    
    // Clear previous validation state
    input.classList.remove('is-valid', 'is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();
    
    let isValid = true;
    
    switch (fieldType) {
        case 'businessName':
            isValid = validator.validateBusinessName(value);
            break;
        case 'description':
            isValid = validator.validateDescription(value);
            break;
        case 'contactNumber':
            isValid = validator.validatePhoneNumber(value);
            break;
    }
    
    // Add visual feedback
    if (isValid) {
        input.classList.add('is-valid');
    } else {
        input.classList.add('is-invalid');
        
        // Show specific error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = validator.getErrors()[0] || 'Invalid input';
        input.parentNode.appendChild(errorDiv);
    }
}

// Update character counter
function updateCharacterCounter(input, maxLength) {
    const currentLength = input.value.length;
    let counter = input.parentNode.querySelector('.character-counter');
    
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'character-counter small text-muted mt-1';
        input.parentNode.appendChild(counter);
    }
    
    counter.textContent = `${currentLength}/${maxLength} characters`;
    
    if (currentLength > maxLength) {
        counter.classList.add('text-danger');
        counter.classList.remove('text-muted');
    } else {
        counter.classList.add('text-muted');
        counter.classList.remove('text-danger');
    }
}

// Format phone number as user types
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 9) {
        value = value.substring(0, 9); // Limit to 9 digits
    }
    
    // Format as XXX-XXX-XXX
    if (value.length >= 6) {
        value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
    } else if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    }
    
    input.value = value;
}

// Initialize validation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addRealTimeValidation();
});

// Export for global use
window.FormValidator = FormValidator;
window.validateBusinessForm = validateBusinessForm;
window.showValidationErrors = showValidationErrors;