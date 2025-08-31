/**
 * Route Guard for Hotel Booking App
 * Controls access to protected pages based on authentication status
 * Updated to work with AuthManager's authentication system
 */

class RouteGuard {
    constructor() {
        this.protectedRoutes = [
            'booking.html'
        ];

        this.publicRoutes = [
            'index.html',
            'availability.html',
            'room-select.html',
            'aboutus1.html',
            'contact.html',
            'login.html' // Important: login page should be public!
        ];

        this.init();
    }

    init() {
        // Only run route guard if we're not on the login page
        const currentPage = this.getCurrentPage();
        if (currentPage === 'login.html') {
            return; // Don't run route guard on login page
        }

        // One-time skip right after successful booking redirect
        try {
            const skipOnce = sessionStorage.getItem('skip_auth_check_once');
            if (skipOnce === '1') {
                sessionStorage.removeItem('skip_auth_check_once');
                // Still update navigation if already authenticated
                if (this.isAuthenticated()) {
                    this.updateNavigationForProtectedPage();
                }
                return;
            }
        } catch (e) {
            // no-op
        }

        // Check if current page requires authentication
        this.checkAccess();

        // Listen for authentication state changes
        this.setupAuthListener();
    }

    checkAccess() {
        const currentPage = this.getCurrentPage();

        if (this.isProtectedRoute(currentPage)) {
            // Special-case: allow confirmation page right after booking when it has a bookingId in URL
            if (currentPage === 'confirmation.html') {
                try {
                    const params = new URLSearchParams(window.location.search);
                    if (params.has('bookingId')) {
                        // Still update navigation if authenticated
                        if (this.isAuthenticated()) {
                            this.updateNavigationForProtectedPage();
                        }
                        return;
                    }
                } catch (e) {
                    // no-op
                }
            }

            if (!this.isAuthenticated()) {
                this.redirectToLogin();
                return;
            }
        }

        // If authenticated and on a protected page, ensure navigation shows user info
        if (this.isAuthenticated()) {
            this.updateNavigationForProtectedPage();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename || 'index.html';
    }

    isProtectedRoute(page) {
        return this.protectedRoutes.includes(page);
    }

    isAuthenticated() {
        // Use the same authentication method as AuthManager
        const customerId = localStorage.getItem('customerId');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const timestamp = localStorage.getItem('authTimestamp');

        if (!customerId || !isAuthenticated || !timestamp) return false;

        // Check if session is expired (24 hours)
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge > 24 * 60 * 60 * 1000) {
            this.clearAuthData();
            return false;
        }

        return isAuthenticated === 'true';
    }

    redirectToLogin() {
        // Store the intended destination for after login
        const fullUrl = window.location.href;
        localStorage.setItem('redirectAfterLogin', fullUrl);

        // Cache current page data before redirecting (if data cache manager is available)
        if (window.dataCacheManager) {
            window.dataCacheManager.cacheCurrentPageData();
        }

        // Redirect to login page
        window.location.href = 'login.html';
    }

    updateNavigationForProtectedPage() {
        // Ensure the navigation shows user info and logout button
        if (typeof updateAuthNavigation === 'function') {
            updateAuthNavigation();
        }
    }

    setupAuthListener() {
        // Listen for storage changes (login/logout events)
        window.addEventListener('storage', (e) => {
            if (e.key === 'customerId' || e.key === 'isAuthenticated') {
                this.handleAuthChange();
            }
        });

        // Also listen for custom auth events
        window.addEventListener('authStateChanged', () => {
            this.handleAuthChange();
        });
    }

    handleAuthChange() {
        const currentPage = this.getCurrentPage();

        // Don't redirect if we're on login page
        if (currentPage === 'login.html') {
            return;
        }

        if (this.isProtectedRoute(currentPage)) {
            if (!this.isAuthenticated()) {
                // User logged out while on protected page
                this.redirectToLogin();
            }
        }
    }

    // Method to check if user can access a specific page
    canAccess(page) {
        if (page === 'login.html') {
            return true; // Login page is always accessible
        }

        if (this.isProtectedRoute(page)) {
            return this.isAuthenticated();
        }
        return true;
    }

    // Method to get user info (compatible with AuthManager)
    getUserInfo() {
        const customerId = localStorage.getItem('customerId');
        const userName = localStorage.getItem('userName');

        if (customerId && userName) {
            return {
                customerId: customerId,
                userName: userName,
                isAuthenticated: true
            };
        }
        return null;
    }

    // Method to clear authentication data
    clearAuthData() {
        localStorage.removeItem('customerId');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
    }

    // Method to logout and redirect
    logout() {
        this.clearAuthData();

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// Initialize route guard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.routeGuard = new RouteGuard();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteGuard;
}