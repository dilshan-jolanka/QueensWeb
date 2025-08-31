/**
 * Data Cache Manager for Hotel Booking Flow
 * Handles caching and restoring user input data across the booking process
 */
class DataCacheManager {
    constructor() {
        this.cacheKey = 'hotel_booking_cache';
        // Prefer camelCase key, but support legacy snake_case for backward compatibility
        this.redirectKey = 'redirectAfterLogin';
        this.legacyRedirectKey = 'redirect_after_login';
        this.init();
    }

    init() {
        // Listen for form submissions and page navigation
        this.setupFormListeners();
        this.setupNavigationListeners();
        
        // Setup browser close detection
        this.setupBrowserCloseDetection();
        
        // Check if we need to restore data after login
        this.checkForDataRestoration();
        
        // Show data preservation notice on login page if we have cached data
        this.showDataPreservationNotice();
    }

    /**
     * Cache form data from availability page
     */
    cacheAvailabilityData() {
        const formData = {
            checkIn: document.getElementById('date-range2')?.value || '',
            checkOut: document.getElementById('date-range3')?.value || '',
            roomType: document.getElementById('room-type')?.value || '',
            promocode: document.getElementById('promocode')?.value || '',
            adults: document.getElementById('adults')?.value || '',
            children: document.getElementById('children')?.value || '',
            timestamp: Date.now()
        };

        // Only cache if we have meaningful data
        if (formData.checkIn && formData.checkOut) {
            this.setCache('availability', formData);
            console.log('Availability data cached:', formData);
        }
    }

    /**
     * Cache room selection data
     */
    cacheRoomSelectionData(roomData) {
        const cachedData = this.getCache('availability') || {};
        const selectionData = {
            ...cachedData,
            selectedRoom: roomData,
            timestamp: Date.now()
        };

        this.setCache('roomSelection', selectionData);
        console.log('Room selection data cached:', selectionData);
    }

    /**
     * Get cached data for a specific step
     */
    getCache(step) {
        try {
            const allCache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            return allCache[step] || null;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    /**
     * Set cache data for a specific step
     */
    setCache(step, data) {
        try {
            const allCache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            allCache[step] = data;
            localStorage.setItem(this.cacheKey, JSON.stringify(allCache));
        } catch (error) {
            console.error('Error setting cache:', error);
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        localStorage.removeItem(this.redirectKey);
        console.log('All cached data cleared');
    }

    /**
     * Set redirect destination after login
     */
    setRedirectDestination(destination) {
        localStorage.setItem(this.redirectKey, destination);
        console.log('Redirect destination set to:', destination);
    }

    /**
     * Get redirect destination
     */
    getRedirectDestination() {
        // Try new key first, then fall back to legacy key
        return localStorage.getItem(this.redirectKey) || localStorage.getItem(this.legacyRedirectKey);
    }

    /**
     * Check if we need to restore data after login
     */
    checkForDataRestoration() {
        const redirectDest = this.getRedirectDestination();
        if (redirectDest && redirectDest.includes('booking.html')) {
            // We're coming back from login, restore data
            this.restoreCachedData();
            // Clear both new and legacy keys
            localStorage.removeItem(this.redirectKey);
            localStorage.removeItem(this.legacyRedirectKey);
        }
    }

    /**
     * Restore cached data to forms
     */
    restoreCachedData() {
        const availabilityData = this.getCache('availability');
        const roomSelectionData = this.getCache('roomSelection');

        if (availabilityData) {
            this.restoreAvailabilityForm(availabilityData);
        }

        if (roomSelectionData && roomSelectionData.selectedRoom) {
            this.restoreRoomSelection(roomSelectionData.selectedRoom);
        }

        // Clear redirect destination
        localStorage.removeItem(this.redirectKey);
    }

    /**
     * Restore availability form data
     */
    restoreAvailabilityForm(data) {
        const elements = {
            'date-range2': data.checkIn,
            'date-range3': data.checkOut,
            'room-type': data.roomType,
            'promocode': data.promocode,
            'adults': data.adults,
            'children': data.children
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
                // Trigger change event for date pickers
                if (element.dispatchEvent) {
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        console.log('Availability form data restored');
    }

    /**
     * Restore room selection data
     */
    restoreRoomSelection(roomData) {
        // This will be implemented based on the room selection UI
        console.log('Room selection data restored:', roomData);
    }

    /**
     * Setup form listeners for automatic caching
     */
    setupFormListeners() {
        // Listen for form changes in availability page
        if (window.location.pathname.includes('availability.html')) {
            const formElements = ['date-range2', 'date-range3', 'room-type', 'promocode', 'adults', 'children'];
            
            formElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', () => {
                        this.cacheAvailabilityData();
                    });
                }
            });

            // Cache data when "Check Availability" button is clicked
            const checkAvailabilityBtn = document.querySelector('.btn.btn-orange[onclick="checkAvailability()"]');
            if (checkAvailabilityBtn) {
                checkAvailabilityBtn.addEventListener('click', () => {
                    this.cacheAvailabilityData();
                });
            }
        }
    }

    /**
     * Setup navigation listeners
     */
    setupNavigationListeners() {
        // Intercept clicks on protected pages
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && this.isProtectedPage(link.href)) {
                e.preventDefault();
                this.handleProtectedPageAccess(link.href);
            }
        });

        // Also handle programmatic navigation
        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            if (args[2] && this.isProtectedPage(args[2])) {
                this.handleProtectedPageAccess(args[2]);
                return;
            }
            return originalPushState.apply(history, args);
        }.bind(this);
    }

    /**
     * Check if a page requires authentication
     */
    isProtectedPage(url) {
        const protectedPages = ['booking.html', 'confirmation.html'];
        return protectedPages.some(page => url.includes(page));
    }

    /**
     * Handle access to protected pages
     */
    handleProtectedPageAccess(destination) {
        // Check if user is authenticated (align with route-guard/auth manager)
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('customerId');

        if (!isAuthenticated) {
            // Cache current page data before redirecting
            this.cacheCurrentPageData();
            
            // Set redirect destination
            this.setRedirectDestination(destination);
            
            // Redirect to login
            window.location.href = 'login.html';
        } else {
            // User is authenticated, allow access
            window.location.href = destination;
        }
    }

    /**
     * Cache data from current page before redirecting
     */
    cacheCurrentPageData() {
        if (window.location.pathname.includes('availability.html')) {
            this.cacheAvailabilityData();
        } else if (window.location.pathname.includes('room-select.html')) {
            // Cache room selection data if available
            const roomData = this.getCurrentRoomSelection();
            if (roomData) {
                this.cacheRoomSelectionData(roomData);
            }
        }
    }

    /**
     * Get current room selection data
     */
    getCurrentRoomSelection() {
        // This will be implemented based on the room selection UI
        // For now, return basic info
        return {
            page: 'room-select.html',
            timestamp: Date.now()
        };
    }

    /**
     * Check if there's cached data available
     */
    hasCachedData() {
        const cache = localStorage.getItem(this.cacheKey);
        return cache && Object.keys(JSON.parse(cache || '{}')).length > 0;
    }

    /**
     * Get summary of cached data for display
     */
    getCachedDataSummary() {
        const availability = this.getCache('availability');
        const roomSelection = this.getCache('roomSelection');
        
        if (!availability && !roomSelection) {
            return null;
        }

        let summary = '';
        if (availability) {
            summary += `Check-in: ${availability.checkIn}, Check-out: ${availability.checkOut}`;
            if (availability.adults) summary += `, Adults: ${availability.adults}`;
            if (availability.children) summary += `, Children: ${availability.children}`;
        }
        
        if (roomSelection && roomSelection.selectedRoom) {
            summary += ` | Room: ${roomSelection.selectedRoom.name || 'Selected'}`;
        }

        return summary;
    }

    /**
     * Show data preservation notice on login page
     */
    showDataPreservationNotice() {
        if (window.location.pathname.includes('login.html')) {
            const notice = document.getElementById('dataPreservationNotice');
            const summaryDiv = document.getElementById('cachedDataSummary');
            
            if (notice && this.hasCachedData()) {
                const summary = this.getCachedDataSummary();
                if (summary && summaryDiv) {
                    summaryDiv.textContent = summary;
                }
                
                notice.style.display = 'block';
                console.log('Data preservation notice shown');
            }
        }
    }

    /**
     * Setup browser close detection and cleanup
     */
    setupBrowserCloseDetection() {
        // Set up session storage flag to detect browser close
        const sessionId = 'hotel_booking_session_' + Date.now();
        sessionStorage.setItem('hotel_booking_session_active', sessionId);
        
        // Use beforeunload event to detect when user is closing browser/tab
        window.addEventListener('beforeunload', (event) => {
            this.handleBrowserClose(event);
        });

        // Use unload event as backup
        window.addEventListener('unload', () => {
            this.cleanupOnBrowserClose();
        });

        // Use pagehide event for mobile browsers
        window.addEventListener('pagehide', (event) => {
            if (event.persisted) {
                // Page is being cached, don't clear data
                return;
            }
            this.cleanupOnBrowserClose();
        });

        // Use visibilitychange to detect when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Mark that the page is hidden
                sessionStorage.setItem('hotel_booking_page_hidden', Date.now().toString());
            } else if (document.visibilityState === 'visible') {
                // Page is visible again, remove hidden flag
                sessionStorage.removeItem('hotel_booking_page_hidden');
            }
        });

        // Check if this is a new session (browser was closed and reopened)
        this.checkForNewSession();
    }

    /**
     * Handle browser close event
     */
    handleBrowserClose(event) {
        // Check if user is authenticated
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (!isAuthenticated) {
            // User is not logged in, clear all cached data
            this.cleanupOnBrowserClose();
            console.log('Browser closing - clearing cached data (user not authenticated)');
        } else {
            // User is logged in, preserve some data but clear sensitive information
            this.cleanupSensitiveData();
            console.log('Browser closing - clearing sensitive cached data (user authenticated)');
        }

        // Mark the session as ending
        sessionStorage.setItem('hotel_booking_browser_closing', 'true');
    }

    /**
     * Clean up all cached data on browser close
     */
    cleanupOnBrowserClose() {
        try {
            // Clear all hotel booking related localStorage
            let keysToRemove = [
                'hotel_booking_cache',
                'redirect_after_login',
                'redirectAfterLogin',
                'hotelBookingData',
                'hotelBookingTimestamp',
                'selectedRoomDetails',
                'bookingSummary'
            ];

            // Preserve booking cache if it exists (avoid wiping selection between room-select/login/booking)
            const hasBookingCache = !!localStorage.getItem('hotelBookingData');
            if (hasBookingCache) {
                keysToRemove = keysToRemove.filter(k => ![
                    'hotelBookingData',
                    'hotelBookingTimestamp',
                    'selectedRoomDetails',
                    'bookingSummary'
                ].includes(k));
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear authentication data if user is not on a login flow
            const currentPage = window.location.pathname.split('/').pop();
            if (!['login.html', 'index.html'].includes(currentPage)) {
                localStorage.removeItem('customerId');
                localStorage.removeItem('userName');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('authTimestamp');
            }

            // Clear session storage but preserve any explicit auth-skip flags
            const skipOnce = sessionStorage.getItem('skip_auth_check_once');
            sessionStorage.clear();
            if (skipOnce === '1') {
                sessionStorage.setItem('skip_auth_check_once', '1');
            }

            console.log('All cached data cleared on browser close');
        } catch (error) {
            console.error('Error clearing cached data:', error);
        }
    }

    /**
     * Clean up only sensitive cached data
     */
    cleanupSensitiveData() {
        try {
            // Remove sensitive booking data but keep user session
            const sensitiveKeys = [
                'hotelBookingData',
                'selectedRoomDetails',
                'bookingSummary'
            ];

            sensitiveKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            console.log('Sensitive cached data cleared');
        } catch (error) {
            console.error('Error clearing sensitive cached data:', error);
        }
    }

    /**
     * Check if this is a new browser session
     */
    checkForNewSession() {
        try {
            // Check if session storage has our session flag
            const sessionActive = sessionStorage.getItem('hotel_booking_session_active');
            const browserClosing = sessionStorage.getItem('hotel_booking_browser_closing');
            
            if (!sessionActive || browserClosing === 'true') {
                // This is a new session or browser was closed
                console.log('New browser session detected - clearing old cached data');
                
                // Clear old cached data
                this.cleanupOnBrowserClose();
                
                // Set new session
                const newSessionId = 'hotel_booking_session_' + Date.now();
                sessionStorage.setItem('hotel_booking_session_active', newSessionId);
                sessionStorage.removeItem('hotel_booking_browser_closing');
            }
        } catch (error) {
            console.error('Error checking for new session:', error);
        }
    }

    /**
     * Force clear all data (utility method)
     */
    forceCleanupAllData() {
        this.cleanupOnBrowserClose();
        
        // Also clear any additional localStorage items that might exist
        const allKeys = Object.keys(localStorage);
        const hotelRelatedKeys = allKeys.filter(key => 
            key.includes('hotel') || 
            key.includes('booking') || 
            key.includes('room') || 
            key.includes('customer') ||
            key.includes('auth')
        );
        
        hotelRelatedKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('Force cleanup completed - all hotel booking data cleared');
    }
}

// Initialize the data cache manager
const dataCacheManager = new DataCacheManager();

// Make it globally accessible
window.dataCacheManager = dataCacheManager;
