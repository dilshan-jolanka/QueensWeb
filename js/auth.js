/**
 * Authentication JavaScript for Queens Hotel
 * Handles sign in, sign up, form validation, and API communication
 */

class AuthManager {
    constructor() {
        this.currentForm = 'signIn';
        this.apiBaseUrl = 'https://backendtestingportaljolanka.azurewebsites.net/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
        this.checkAuthStatus();
        this.handleAnchorLinks();
        this.setupTabSwitching();
        this.checkPageAuthRequirements();
        this.loadCountries();
        this.setupBrowserCloseCleanup();
    }

    handleAnchorLinks() {
        // Check if there's an anchor in the URL
        const hash = window.location.hash;
        if (hash === '#signUpForm') {
            this.showSignUpForm();
        } else if (hash === '#signInForm') {
            this.showSignInForm();
        }
    }

    setupTabSwitching() {
        // Initialize with signin tab active
        this.switchTab('signin');
    }

    checkPageAuthRequirements() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const protectedPages = ['booking.html', 'confirmation.html'];

        if (protectedPages.includes(currentPage)) {
            const customerData = this.getCustomerData();
            if (!customerData) {
                // User not authenticated, redirect to login
                window.location.href = 'login.html';
            }
        }
    }

    bindEvents() {
        // Form switching
        document.getElementById('switchToSignUp')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignUpForm();
        });

        document.getElementById('switchToSignIn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        // Header dropdown navigation
        document.getElementById('showSignIn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        document.getElementById('showSignUp')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignUpForm();
        });

        // Tab button navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = button.textContent.toLowerCase().includes('sign in') ? 'signin' : 'signup';
                this.switchTab(tab);
            });
        });

        // Form submissions
        document.getElementById('signinForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Social authentication
        document.querySelectorAll('.btn-social').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSocialAuth(btn.classList.contains('btn-facebook') ? 'facebook' : 'google');
            });
        });

        // Input validation on blur
        this.setupInputValidation();
    }

    showSignInForm() {
        this.switchTab('signin');
        this.currentForm = 'signIn';
        this.clearForms();
    }

    showSignUpForm() {
        this.switchTab('signup');
        this.currentForm = 'signUp';
        this.clearForms();
    }

    switchTab(tab) {
        const tabs = document.querySelectorAll('.tab-button');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));

        if (tab === 'signin') {
            tabs[0].classList.add('active');
            document.getElementById('signinForm').classList.add('active');
        } else {
            tabs[1].classList.add('active');
            document.getElementById('signupForm').classList.add('active');
        }
    }

    scrollToForm() {
        const formSection = document.querySelector('.auth-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    clearForms() {
        // Clear all form inputs
        document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"], input[type="tel"]').forEach(input => {
            input.value = '';
            this.removeInputState(input);
        });

        // Clear checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Clear select dropdowns
        document.querySelectorAll('select.form-control').forEach(select => {
            select.selectedIndex = 0;
            this.removeInputState(select);
        });
    }

    setupFormValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateInput(e.target);
            });
        });
    }

    setupInputValidation() {
        const inputs = document.querySelectorAll('.form-control, select.form-control');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });

            input.addEventListener('input', () => {
                this.removeInputState(input);
            });
        });

        // Ensure selects (e.g., gender) update validation on change
        document.querySelectorAll('select.form-control').forEach(select => {
            select.addEventListener('change', () => {
                this.validateInput(select);
            });
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        const fieldName = input.id;
        let isValid = true;
        let errorMessage = '';

        if (!value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        if (isValid && fieldName.includes('Email')) {
            isValid = this.isValidEmail(value);
            if (!isValid) errorMessage = 'Please enter a valid email address';
        }

        if (isValid && fieldName.includes('Password')) {
            // Basic validation - just check if not empty
            isValid = value.length > 0;
            if (!isValid) errorMessage = 'Password is required';
        }

        if (fieldName === 'registerGender') {
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a gender';
            } else {
                isValid = true;
            }
        }

        if (fieldName === 'registerCountry') {
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a country';
            } else {
                isValid = true;
            }
        }

        if (isValid && fieldName === 'confirmPassword') {
            const password = document.getElementById('registerPassword').value;
            if (value !== password) {
                isValid = false;
                errorMessage = 'Passwords do not match';
            }
        }

        this.setInputState(input, isValid, errorMessage);
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }



    setInputState(input, isValid, message = '') {
        const formGroup = input.closest('.form-group');
        const inputGroup = input.closest('.input-group');

        // Remove existing states
        this.removeInputState(input);

        if (isValid) {
            formGroup.classList.add('success');
            inputGroup.classList.add('success');
        } else {
            formGroup.classList.add('error');
            inputGroup.classList.add('error');

            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            formGroup.appendChild(errorDiv);
        }
    }

    removeInputState(input) {
        const formGroup = input.closest('.form-group');
        const inputGroup = input.closest('.input-group');

        formGroup.classList.remove('success', 'error');
        inputGroup.classList.remove('success', 'error');

        // Remove error message
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async handleSignIn() {
        const userName = document.getElementById('signinForm').querySelector('input[type="email"]').value;
        const password = document.getElementById('signinForm').querySelector('input[type="password"]').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        // Basic validation
        if (!userName || !password) {
            this.showErrorMessage('Please fill in all required fields.');
            return;
        }

        try {
            this.setButtonLoading('signinForm', true);

            // Call the Customer login API
            const response = await this.signIn(userName, password, rememberMe);

            if (response.success) {
                // Store customer data and redirect
                this.storeCustomerData(response.customerId, userName);
                this.showSuccessMessage('Sign in successful! Redirecting to booking...');

                // Always redirect to booking.html after successful sign in
                setTimeout(() => {
                    window.location.href = 'booking.html';
                }, 2000);
            } else {
                // Show error message from API
                this.showErrorMessage(response.message || 'Login failed. Please try again.');
            }

        } catch (error) {
            console.error('Sign in error:', error);
            this.showErrorMessage('An error occurred. Please try again.');
        } finally {
            this.setButtonLoading('signinForm', false);
        }
    }

    async handleSignUp() {
        const firstName = document.getElementById('registerFirstName').value.trim();
        const lName = document.getElementById('registerLastName').value.trim();
        const emailAddress = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const address = document.getElementById('registerAddress').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passportId = document.getElementById('registerPassportId').value.trim();
        const nic = document.getElementById('registerNIC').value.trim();
        const countryOfResidence_id = document.getElementById('registerCountry').value;
        const dob = document.getElementById('registerDob').value;
        const gender = document.getElementById('registerGender').value;

        // Validate required fields
        if (!firstName || !lName || !emailAddress || !phone || !address || !password || !nic || !gender || !countryOfResidence_id) {
            this.showErrorMessage('Please fill in all required fields.');
            return;
        }

        // Check password confirmation
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            this.showErrorMessage('Passwords do not match');
            return;
        }

        try {
            this.setButtonLoading('signupForm', true);
            const body = {
                firstName,
                lName,
                emailAddress,
                phone,
                address,
                password,
                passportId,
                nic,
                countryOfResidence_id,
                dob: dob || null,
                gender
            };
            const response = await this.registerCustomer(body);
            this.showSuccessMessage('Customer registered successfully! You can now sign in.');
            this.showSignInForm();
        } catch (error) {
            console.error('Customer registration error:', error);
            this.showErrorMessage(error.message || 'Registration failed. Please try again.');
        } finally {
            this.setButtonLoading('signupForm', false);
        }
    }

    async signIn(userName, password, rememberMe) {
        const response = await fetch(`${this.apiBaseUrl}/Customer/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: userName,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async registerCustomer(payload) {
        const response = await fetch(`${this.apiBaseUrl}/Customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        return contentType.includes('application/json') ? await response.json() : await response.text();
    }

    async getCustomerById(customerId) {
        const response = await fetch(`${this.apiBaseUrl}/Customer/${customerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async refreshCustomerData() {
        const customerData = this.getCustomerData();
        if (customerData && customerData.customerId) {
            try {
                const freshData = await this.getCustomerById(customerData.customerId);
                // Update stored data with fresh data
                this.storeCustomerData(customerData.customerId, customerData.userName);
                return freshData;
            } catch (error) {
                console.error('Failed to refresh customer data:', error);
                return customerData;
            }
        }
        return null;
    }

    async loadCountries() {
        try {
            const countrySelect = document.getElementById('registerCountry');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="">Loading countries...</option>';
            }

            const response = await fetch(`${this.apiBaseUrl}/Country`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.populateCountryDropdown(result.data);
            } else {
                console.error('Failed to load countries:', result.message);
                if (countrySelect) {
                    countrySelect.innerHTML = '<option value="">Error loading countries</option>';
                }
            }
        } catch (error) {
            console.error('Error loading countries:', error);
            const countrySelect = document.getElementById('registerCountry');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="">Error loading countries</option>';
            }
        }
    }

    populateCountryDropdown(countries) {
        const countrySelect = document.getElementById('registerCountry');
        if (!countrySelect) return;

        // Clear existing options except the first one
        countrySelect.innerHTML = '<option value="">Select your country</option>';

        // Add country options
        countries.forEach(country => {
            if (country.status === 1) { // Only add active countries
                const option = document.createElement('option');
                option.value = country.countryId;
                option.textContent = country.countryName;
                countrySelect.appendChild(option);
            }
        });

        // Set default to Sri Lanka (countryId: 165) if available
        const sriLankaOption = countrySelect.querySelector('option[value="165"]');
        if (sriLankaOption) {
            sriLankaOption.selected = true;
        }
    }

    handleSocialAuth(provider) {
        // Implement social authentication
        this.showInfoMessage(`Redirecting to ${provider} authentication...`);

        // Example implementation - replace with actual social auth logic
        setTimeout(() => {
            this.showInfoMessage(`${provider} authentication is not implemented yet. Please use email/password.`);
        }, 2000);
    }

    setButtonLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        if (form) {
            const button = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
            if (button) {
                if (isLoading) {
                    button.classList.add('btn-loading');
                    button.disabled = true;
                    const buttonText = button.querySelector('.btn-text');
                    if (buttonText) {
                        buttonText.innerHTML = '<span class="loading"></span> Processing...';
                    }
                } else {
                    button.classList.remove('btn-loading');
                    button.disabled = false;
                    const buttonText = button.querySelector('.btn-text');
                    if (buttonText) {
                        if (formId === 'signinForm') {
                            buttonText.textContent = 'Sign In to Your Account';
                        } else {
                            buttonText.textContent = 'Create Your Account';
                        }
                    }
                }
            }
        }
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;

        // Add message to the current active form
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            activeForm.insertBefore(messageDiv, activeForm.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);

        // Close button functionality
        messageDiv.querySelector('.message-close').addEventListener('click', () => {
            messageDiv.remove();
        });
    }

    // Store customer data for authenticated user
    storeCustomerData(customerId, userName) {
        localStorage.setItem('customerId', customerId);
        localStorage.setItem('userName', userName);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTimestamp', Date.now().toString());

        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'customerId',
            newValue: customerId
        }));

        window.dispatchEvent(new StorageEvent('storage', {
            key: 'isAuthenticated',
            newValue: 'true'
        }));

        // Trigger custom auth event for route guard
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    getCustomerData() {
        const customerId = localStorage.getItem('customerId');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const timestamp = localStorage.getItem('authTimestamp');

        if (!customerId || !isAuthenticated || !timestamp) return null;

        // Check if session is expired (24 hours)
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge > 24 * 60 * 60 * 1000) {
            this.clearCustomerData();
            return null;
        }

        return {
            customerId: customerId,
            userName: localStorage.getItem('userName'),
            isAuthenticated: true
        };
    }

    clearCustomerData() {
        localStorage.removeItem('customerId');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
    }

    hasCachedRoomData() {
        try {
            // Check if there's cached room booking data
            const hotelBookingData = localStorage.getItem('hotelBookingData');
            const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
            
            // Also check DataCacheManager if available
            if (window.dataCacheManager && window.dataCacheManager.hasCachedData()) {
                return true;
            }
            
            return !!(hotelBookingData || selectedRoomDetails);
        } catch (error) {
            console.error('Error checking cached room data:', error);
            return false;
        }
    }

    setupBrowserCloseCleanup() {
        // Add browser close detection and cleanup
        window.addEventListener('beforeunload', (event) => {
            this.handleAuthCleanupOnBrowserClose();
        });

        // Use unload event as backup
        window.addEventListener('unload', () => {
            this.handleAuthCleanupOnBrowserClose();
        });

        // Use pagehide event for mobile browsers
        window.addEventListener('pagehide', (event) => {
            if (!event.persisted) {
                this.handleAuthCleanupOnBrowserClose();
            }
        });

        console.log('Browser close cleanup for authentication setup');
    }

    handleAuthCleanupOnBrowserClose() {
        try {
            const customerData = this.getCustomerData();
            
            if (!customerData) {
                // No authentication data to clean up
                return;
            }

            // Check if this is a login page - if so, preserve auth data briefly
            const currentPage = window.location.pathname.split('/').pop();
            const isLoginFlow = ['login.html', 'index.html'].includes(currentPage);
            
            if (isLoginFlow) {
                // On login pages, preserve auth data but clear booking data
                this.clearBookingDataOnly();
                console.log('Browser closing on login page - preserving auth, clearing booking data');
            } else {
                // On other pages, check session age before clearing
                const authTimestamp = localStorage.getItem('authTimestamp');
                const sessionAge = Date.now() - parseInt(authTimestamp || '0');
                const oneHour = 60 * 60 * 1000; // 1 hour

                if (sessionAge > oneHour) {
                    // Session is old, clear everything
                    this.clearAllAuthData();
                    console.log('Browser closing - old session detected, clearing all auth data');
                } else {
                    // Recent session, just clear booking data
                    this.clearBookingDataOnly();
                    console.log('Browser closing - recent session, clearing only booking data');
                }
            }

        } catch (error) {
            console.error('Error during auth cleanup on browser close:', error);
        }
    }

    clearBookingDataOnly() {
        try {
            // Clear only booking-related data, preserve authentication
            const bookingKeys = [
                'hotelBookingData',
                'hotelBookingTimestamp',
                'selectedRoomDetails',
                'bookingSummary',
                'hotel_booking_cache',
                'redirect_after_login'
            ];

            bookingKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            console.log('Booking data cleared, authentication preserved');
        } catch (error) {
            console.error('Error clearing booking data:', error);
        }
    }

    clearAllAuthData() {
        try {
            // Clear all authentication and booking data
            this.clearCustomerData();
            this.clearBookingDataOnly();
            
            // Also clear any session storage
            sessionStorage.clear();
            
            console.log('All authentication and booking data cleared');
        } catch (error) {
            console.error('Error clearing all auth data:', error);
        }
    }

    // Enhanced logout method
    logout() {
        try {
            this.clearAllAuthData();
            
            // Use DataCacheManager if available
            if (window.dataCacheManager) {
                window.dataCacheManager.forceCleanupAllData();
            }
            
            // Redirect to home page
            window.location.href = 'index.html';
            
            console.log('User logged out successfully');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    checkAuthStatus() {
        const customerData = this.getCustomerData();
        if (customerData) {
            // User is already authenticated, redirect to booking
            this.redirectToBooking();
        }
    }

    redirectToBooking() {
        // Check if there's a redirect destination stored
        const redirectTo = localStorage.getItem('redirectAfterLogin');

        // Clear the stored redirect
        localStorage.removeItem('redirectAfterLogin');

        // Redirect to stored destination or default to availability page
        setTimeout(() => {
            if (redirectTo && redirectTo !== 'login.html') {
                // Check if we have cached data for the destination
                if (window.dataCacheManager && window.dataCacheManager.hasCachedData()) {
                    console.log('Redirecting to protected page with cached data:', redirectTo);
                }
                window.location.href = redirectTo;
            } else {
                window.location.href = 'booking.html';
            }
        }, 1500);
    }

    logout() {
        this.clearCustomerData();
        window.location.href = 'index.html';
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Global function for HTML onclick handlers
function switchTab(tab) {
    if (window.authManager) {
        window.authManager.switchTab(tab);
    }
}

// Global utility functions for other pages
function isUserAuthenticated() {
    return window.authManager ? window.authManager.getCustomerData() !== null : false;
}

function getCurrentCustomerId() {
    const customerData = window.authManager ? window.authManager.getCustomerData() : null;
    return customerData ? customerData.customerId : null;
}

function getCurrentUserName() {
    const customerData = window.authManager ? window.authManager.getCustomerData() : null;
    return customerData ? customerData.userName : null;
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// Add CSS for messages
const additionalCSS = `
    .auth-message {
        margin-bottom: 20px;
        padding: 15px;
        border-radius: 8px;
        animation: slideIn 0.3s ease;
        position: relative;
        z-index: 10;
    }
    
    .auth-message-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    
    .auth-message-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    
    .auth-message-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    
    .message-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .message-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
    }
    
    .message-close:hover {
        opacity: 1;
    }
    
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
