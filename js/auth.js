// Authentication system for KNUST Enterprise Hub Frontend

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        // Check if user is already logged in
        await this.checkAuthStatus();
        this.updateUI();
        this.setupEventListeners();
        this.initialized = true;
    }

    // Check authentication status
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/verify', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    this.currentUser = data.user;
                    this.token = localStorage.getItem('token');
                    return true;
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }

        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('token');
        return false;
    }

    // Update UI based on authentication status
    updateUI() {
        const authNavLink = document.getElementById('authNavLink');
        const authNavText = document.getElementById('authNavText');
        const authDropdownMenu = document.getElementById('authDropdownMenu');
        
        if (this.currentUser) {
            // User is logged in - update the welcome text and dropdown
            if (authNavText) {
                authNavText.textContent = this.currentUser.firstName || 'User';
            }

            // Update dropdown menu for logged in user
            if (authDropdownMenu) {
                authDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="#" id="profileLink">
                        <i class="fas fa-user me-2"></i> Profile
                    </a></li>
                    <li><a class="dropdown-item" href="#" id="myBusinessesLink">
                        <i class="fas fa-store me-2"></i> My Businesses
                    </a></li>
                    <li><a class="dropdown-item" href="#" id="ordersLink">
                        <i class="fas fa-shopping-bag me-2"></i> Orders
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">
                        <i class="fas fa-sign-out-alt me-2"></i> Logout
                    </a></li>
                `;

                // Add event listeners for dropdown items
                document.getElementById('profileLink')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showProfileModal();
                });

                document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }

            // Show success welcome message (only once per session)
            if (!sessionStorage.getItem('welcomeShown')) {
                this.showWelcomeMessage();
                sessionStorage.setItem('welcomeShown', 'true');
            }

        } else {
            // User is not logged in - show login/register options
            if (authNavText) {
                authNavText.textContent = 'Sign in / Register';
            }

            // Update dropdown menu for guest user
            if (authDropdownMenu) {
                authDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="#" id="loginLink">
                        <i class="fas fa-sign-in-alt me-2"></i> Login
                    </a></li>
                    <li><a class="dropdown-item" href="#" id="registerLink">
                        <i class="fas fa-user-plus me-2"></i> Register
                    </a></li>
                `;

                // Add event listeners for auth links
                document.getElementById('loginLink')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'login.html';
                });

                document.getElementById('registerLink')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'register.html';
                });
            }
        }
    }

    // Create user dropdown menu
    createUserDropdown(authNavLink) {
        // Remove existing dropdown
        const existingDropdown = authNavLink.nextElementSibling;
        if (existingDropdown?.classList.contains('auth-dropdown')) {
            existingDropdown.remove();
        }

        // Create new dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'auth-dropdown dropdown-menu dropdown-menu-end position-absolute';
        dropdown.style.cssText = `
            top: 100%;
            right: 0;
            display: none;
            min-width: 200px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            border: none;
            margin-top: 8px;
        `;

        dropdown.innerHTML = `
            <a class="dropdown-item" href="#" id="profileLink">
                <i class="fas fa-user me-2"></i> Profile
            </a>
            <a class="dropdown-item" href="#" id="myBusinessesLink">
                <i class="fas fa-store me-2"></i> My Businesses
            </a>
            <a class="dropdown-item" href="#" id="ordersLink">
                <i class="fas fa-shopping-bag me-2"></i> Orders
            </a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item text-danger" href="#" id="logoutBtn">
                <i class="fas fa-sign-out-alt me-2"></i> Logout
            </a>
        `;

        // Insert dropdown after auth link
        authNavLink.parentNode.style.position = 'relative';
        authNavLink.parentNode.appendChild(dropdown);

        // Add click handler to toggle dropdown
        authNavLink.onclick = (e) => {
            e.preventDefault();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        };

        // Add event listeners for dropdown items
        dropdown.querySelector('#profileLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.style.display = 'none';
            this.showProfileModal();
        });

        dropdown.querySelector('#logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.style.display = 'none';
            this.logout();
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!authNavLink.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Override business registration to require auth
        const businessForm = document.getElementById('businessRegistrationForm');
        if (businessForm) {
            // Remove existing listeners and add auth check
            const newForm = businessForm.cloneNode(true);
            businessForm.parentNode.replaceChild(newForm, businessForm);
            
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.currentUser) {
                    this.showAuthRequiredMessage('register a business');
                    return;
                }
                this.handleBusinessRegistration(e);
            });
        }
    }

    // Show welcome message
    showWelcomeMessage() {
        if (this.currentUser) {
            showAlert(`Welcome back, ${this.currentUser.firstName}!`, 'success');
        }
    }

    // Show authentication required message
    showAuthRequiredMessage(action) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '1200';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-info-circle me-2"></i>
                <div>
                    <strong>Authentication Required</strong><br>
                    Please <a href="#" class="alert-link" onclick="authManager.showLoginModal()">login</a> 
                    or <a href="#" class="alert-link" onclick="authManager.showRegisterModal()">register</a> 
                    to ${action}.
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                const bsAlert = bootstrap.Alert.getInstance(alertDiv);
                if (bsAlert) {
                    bsAlert.close();
                } else {
                    alertDiv.remove();
                }
            }
        }, 8000);
    }

    // Show login modal
    showLoginModal() {
        this.createAuthModal('login');
    }

    // Show register modal
    showRegisterModal() {
        this.createAuthModal('register');
    }

    // Show profile modal
    showProfileModal() {
        console.log('Current user data:', this.currentUser); // Debug log
        
        // Use existing profile modal or create new one
        const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
        this.populateProfileForm();
        this.setupProfileFormHandler();
        profileModal.show();
    }

    // Setup profile form submission handler
    setupProfileFormHandler() {
        const profileForm = document.querySelector('#profileModal form');
        // Find save button by text content
        const saveButton = Array.from(document.querySelectorAll('#profileModal button')).find(btn => 
            btn.textContent.includes('Save Changes')
        );
        
        if (profileForm && saveButton) {
            // Remove existing listeners
            const newSaveButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
            
            newSaveButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleProfileUpdate();
            });
        }
    }

    // Handle profile update
    async handleProfileUpdate() {
        const saveButton = document.querySelector('#profileModal button[type="button"]');
        
        try {
            showButtonLoading(saveButton, 'Saving...');

            // Collect form data
            const formData = {
                firstName: document.querySelector('#profileModal input[placeholder*="Chris"]')?.value,
                lastName: document.querySelector('#profileModal input[placeholder*="Elliot"]')?.value,
                hallOfResidence: document.querySelector('#profileModal select')?.value,
                department: document.querySelector('#profileModal input[placeholder*="Computer Science"]')?.value,
                phoneNumber: document.querySelector('#profileModal input[placeholder*="25-727-0471"]')?.value?.replace(/\D/g, '') // Remove non-digits
            };

            // Only send fields that have values
            const updateData = {};
            Object.entries(formData).forEach(([key, value]) => {
                if (value && value.trim()) {
                    updateData[key] = value.trim();
                }
            });

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update current user data
                this.currentUser = { ...this.currentUser, ...data.user };
                
                // Update UI
                this.updateUI();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                modal.hide();
                
                // Show success message
                showAlert('Profile updated successfully!', 'success');
            } else {
                throw new Error(data.error || 'Profile update failed');
            }

        } catch (error) {
            console.error('Profile update error:', error);
            showAlert(error.message || 'Failed to update profile. Please try again.', 'danger');
        } finally {
            hideButtonLoading(saveButton);
        }
    }

    // Create authentication modal
    createAuthModal(type) {
        // Remove existing auth modal
        const existingModal = document.getElementById('authModal');
        if (existingModal) {
            existingModal.remove();
        }

        const isLogin = type === 'login';
        const modalTitle = isLogin ? 'Login to KNUST Enterprise Hub' : 'Join KNUST Enterprise Hub';
        const submitText = isLogin ? 'Login' : 'Register';
        const switchText = isLogin ? 'Don\'t have an account?' : 'Already have an account?';
        const switchLink = isLogin ? 'Register here' : 'Login here';
        const switchAction = isLogin ? 'register' : 'login';

        const modalHTML = `
            <div class="modal fade" id="authModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">${modalTitle}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="authForm">
                                ${isLogin ? this.getLoginFormHTML() : this.getRegisterFormHTML()}
                                
                                <div class="d-grid gap-2 mt-4">
                                    <button type="submit" class="btn btn-primary btn-lg" id="authSubmitBtn">
                                        <i class="fas fa-${isLogin ? 'sign-in-alt' : 'user-plus'} me-2"></i>
                                        ${submitText}
                                    </button>
                                </div>
                                
                                <div class="text-center mt-3">
                                    <p class="mb-0">
                                        ${switchText} 
                                        <a href="#" id="switchAuthMode" class="text-decoration-none">
                                            ${switchLink}
                                        </a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('authModal'));
        modal.show();

        // Add event listeners
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (isLogin) {
                this.handleLogin(e);
            } else {
                this.handleRegister(e);
            }
        });

        document.getElementById('switchAuthMode').addEventListener('click', (e) => {
            e.preventDefault();
            modal.hide();
            setTimeout(() => {
                this.createAuthModal(switchAction);
            }, 300);
        });

        // Remove modal from DOM when hidden
        document.getElementById('authModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('authModal').remove();
        });
    }

    // Get login form HTML
    getLoginFormHTML() {
        return `
            <div class="row">
                <div class="col-md-12">
                    <div class="mb-3">
                        <label for="loginUsername" class="form-label">Username or Email</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-user"></i></span>
                            <input type="text" class="form-control" id="loginUsername" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="loginPassword" class="form-label">Password</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-lock"></i></span>
                            <input type="password" class="form-control" id="loginPassword" required>
                            <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('loginPassword')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="rememberMe">
                        <label class="form-check-label" for="rememberMe">
                            Remember me
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    // Get register form HTML
    getRegisterFormHTML() {
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerUsername" class="form-label">Username *</label>
                        <input type="text" class="form-control" id="registerUsername" required 
                               minlength="3" placeholder="Choose a unique username">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerEmail" class="form-label">KNUST Email *</label>
                        <input type="email" class="form-control" id="registerEmail" required 
                               placeholder="yourname@knust.edu.gh">
                        <div class="form-text">Use your official KNUST email address</div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerFirstName" class="form-label">First Name *</label>
                        <input type="text" class="form-control" id="registerFirstName" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerLastName" class="form-label">Last Name *</label>
                        <input type="text" class="form-control" id="registerLastName" required>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerIndexNumber" class="form-label">Index Number *</label>
                        <input type="text" class="form-control" id="registerIndexNumber" required 
                               pattern="[0-9]{8,10}" placeholder="e.g., 20512345">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerHall" class="form-label">Hall of Residence *</label>
                        <select class="form-select" id="registerHall" required>
                            <option value="">Select your hall</option>
                            <option value="Unity Hall">Unity Hall</option>
                            <option value="Africa Hall">Africa Hall</option>
                            <option value="Independence Hall">Independence Hall</option>
                            <option value="Queen's Hall">Queen's Hall</option>
                            <option value="Katanga Hall">Katanga Hall</option>
                            <option value="Republic Hall">Republic Hall</option>
                            <option value="Hall 6">Hall 6</option>
                            <option value="Ayeduase">Ayeduase</option>
                            <option value="Kotei">Kotei</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerDepartment" class="form-label">Department *</label>
                        <input type="text" class="form-control" id="registerDepartment" required 
                               placeholder="e.g., Computer Science">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerPhone" class="form-label">Phone Number *</label>
                        <div class="input-group">
                            <span class="input-group-text">+233</span>
                            <input type="tel" class="form-control" id="registerPhone" required 
                                   pattern="[0-9]{9}" placeholder="257270471">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerPassword" class="form-label">Password *</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="registerPassword" required 
                                   minlength="6" placeholder="Min. 6 characters">
                            <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('registerPassword')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="form-text">At least 6 characters with letters and numbers</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="registerConfirmPassword" class="form-label">Confirm Password *</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="registerConfirmPassword" required>
                            <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('registerConfirmPassword')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="agreeTerms" required>
                    <label class="form-check-label" for="agreeTerms">
                        I agree to the <a href="#" class="text-decoration-none">Terms of Service</a> 
                        and <a href="#" class="text-decoration-none">Privacy Policy</a>
                    </label>
                </div>
            </div>
        `;
    }

    // Handle login
    async handleLogin(event) {
        const submitBtn = document.getElementById('authSubmitBtn');
        
        try {
            showButtonLoading(submitBtn, 'Logging in...');

            const formData = {
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store token
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.token = data.token;

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                modal.hide();

                // Update UI
                this.updateUI();

                // Show success message
                showAlert(`Welcome back, ${data.user.firstName}!`, 'success');

            } else {
                throw new Error(data.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            showAlert(error.message || 'Login failed. Please try again.', 'danger');
        } finally {
            hideButtonLoading(submitBtn);
        }
    }

    // Handle registration
    async handleRegister(event) {
        const submitBtn = document.getElementById('authSubmitBtn');
        
        try {
            showButtonLoading(submitBtn, 'Creating account...');

            const formData = {
                username: document.getElementById('registerUsername').value,
                email: document.getElementById('registerEmail').value,
                firstName: document.getElementById('registerFirstName').value,
                lastName: document.getElementById('registerLastName').value,
                indexNumber: document.getElementById('registerIndexNumber').value,
                hallOfResidence: document.getElementById('registerHall').value,
                department: document.getElementById('registerDepartment').value,
                phoneNumber: document.getElementById('registerPhone').value,
                password: document.getElementById('registerPassword').value,
                confirmPassword: document.getElementById('registerConfirmPassword').value
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store token
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.token = data.token;

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                modal.hide();

                // Update UI
                this.updateUI();

                // Show success message
                showAlert(`Welcome to KNUST Enterprise Hub, ${data.user.firstName}!`, 'success');

            } else {
                if (data.details && Array.isArray(data.details)) {
                    throw new Error(data.details.join('<br>'));
                } else {
                    throw new Error(data.error || 'Registration failed');
                }
            }

        } catch (error) {
            console.error('Registration error:', error);
            showAlert(error.message || 'Registration failed. Please try again.', 'danger');
        } finally {
            hideButtonLoading(submitBtn);
        }
    }

    // Handle business registration (protected)
    async handleBusinessRegistration(event) {
        // This would use the existing business registration logic
        // but now with authentication
        console.log('Business registration with authenticated user:', this.currentUser);
        
        // Call the existing business registration handler
        // but pass the user ID from the token
        const formData = new FormData(event.target);
        formData.append('owner_id', this.currentUser.id);
        
        // TODO: Implement actual business registration API call
        showAlert('Business registration coming soon with user authentication!', 'info');
    }

    // Populate profile form with current user data
    populateProfileForm() {
        if (!this.currentUser) return;

        // Map field names to actual input selectors in the profile modal
        const fieldMappings = [
            { field: 'firstName', selector: '#profileModal input[placeholder*="Chris"]' },
            { field: 'lastName', selector: '#profileModal input[placeholder*="Elliot"]' },
            { field: 'email', selector: '#profileModal input[type="email"]' },
            { field: 'indexNumber', selector: '#profileModal input[placeholder*="8571321"]' },
            { field: 'department', selector: '#profileModal input[placeholder*="Computer Science"]' },
            { field: 'phoneNumber', selector: '#profileModal input[placeholder*="25-727-0471"]' }
        ];

        // Populate each field
        fieldMappings.forEach(({ field, selector }) => {
            const input = document.querySelector(selector);
            const value = this.currentUser[field];
            
            if (input && value) {
                input.value = value;
                // Clear placeholder to show the actual value
                input.placeholder = '';
            }
        });

        // Set hall of residence dropdown
        const hallSelect = document.querySelector('#profileModal select');
        if (hallSelect && this.currentUser.hallOfResidence) {
            // Find and select the correct option
            for (let option of hallSelect.options) {
                if (option.text === this.currentUser.hallOfResidence) {
                    option.selected = true;
                    break;
                }
            }
        }

        // Update account status section
        const statusCard = document.querySelector('#profileModal .card-body');
        if (statusCard) {
            const accountInfo = statusCard.querySelector('p.small');
            if (accountInfo) {
                const joinDate = new Date(this.currentUser.createdAt || new Date()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short'
                });
                accountInfo.textContent = `Member since: ${joinDate}`;
            }
        }

        // Update profile picture placeholder
        const profileImg = document.querySelector('#profileModal img');
        if (profileImg) {
            if (this.currentUser.profilePictureUrl) {
                profileImg.src = this.currentUser.profilePictureUrl;
            } else {
                // Use a placeholder with user initials
                const initials = `${this.currentUser.firstName?.[0] || ''}${this.currentUser.lastName?.[0] || ''}`.toUpperCase();
                profileImg.alt = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
                // You could replace this with a service like UI Avatars
                profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.firstName + ' ' + this.currentUser.lastName)}&size=150&background=007bff&color=fff`;
            }
        }
    }

    // Logout
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            // Clear local data regardless of response
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('token');
            sessionStorage.removeItem('welcomeShown');

            // Update UI
            this.updateUI();

            // Show logout message
            showAlert('You have been logged out successfully.', 'info');

        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local data
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('token');
            this.updateUI();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get auth token
    getToken() {
        return this.token;
    }
}

// Utility function to toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', function() {
    authManager = new AuthManager();
});

// Export for global use
window.AuthManager = AuthManager;
window.togglePasswordVisibility = togglePasswordVisibility;
