// ===== BOOKING DATA MANAGER =====
// Simple and robust booking data management across all pages

class BookingDataManager {
    constructor() {
        this.data = null;
        this.customerData = null;
    }

    // Initialize the data manager
    init() {
        console.log('BookingDataManager initialized');
        this.loadData();
        this.setupEventListeners();
    }

    // Load booking data from localStorage
    loadData() {
        try {
            // Try to load from different localStorage keys
            const keys = ['hotelBookingData', 'suiteBookingData', 'bookingData'];
            let foundData = false;

            for (const key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        this.data = JSON.parse(data);
                        console.log(`Loaded data from ${key}:`, this.data);
                        foundData = true;
                        break;
                    } catch (e) {
                        console.warn(`Error parsing ${key}:`, e);
                    }
                }
            }

            // Load customer data
            this.customerData = {
                name: localStorage.getItem('customerFullName') || '',
                email: localStorage.getItem('customerEmail') || '',
                phone: localStorage.getItem('phone') || '',
                address: localStorage.getItem('address') || ''
            };

            if (!foundData) {
                console.log('No booking data found in localStorage');
                this.data = null;
            }

        } catch (error) {
            console.error('Error loading booking data:', error);
            this.data = null;
        }
    }

    // Save booking data to localStorage
    saveData(data) {
        try {
            this.data = data;
            localStorage.setItem('hotelBookingData', JSON.stringify(data));
            localStorage.setItem('bookingTimestamp', Date.now().toString());
            console.log('Booking data saved:', data);
        } catch (error) {
            console.error('Error saving booking data:', error);
        }
    }

    // Save customer data
    saveCustomerData(customerData) {
        try {
            this.customerData = customerData;
            localStorage.setItem('customerFullName', customerData.name || '');
            localStorage.setItem('customerEmail', customerData.email || '');
            localStorage.setItem('phone', customerData.phone || '');
            localStorage.setItem('address', customerData.address || '');
            console.log('Customer data saved:', customerData);
        } catch (error) {
            console.error('Error saving customer data:', error);
        }
    }

    // Get booking data
    getData() {
        return this.data;
    }

    // Get customer data
    getCustomerData() {
        return this.customerData;
    }

    // Clear all data
    clearData() {
        try {
            const keys = ['hotelBookingData', 'suiteBookingData', 'bookingData', 'selectedRoomDetails', 'customerFullName', 'customerEmail', 'phone', 'address', 'bookingTimestamp'];
            keys.forEach(key => localStorage.removeItem(key));
            this.data = null;
            this.customerData = null;
            console.log('All booking data cleared');
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }

    // Check if data exists
    hasData() {
        return this.data !== null && Object.keys(this.data).length > 0;
    }

    // Setup event listeners for debugging
    setupEventListeners() {
        // Listen for storage changes (when data is updated in another tab/window)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('Booking')) {
                console.log('Storage updated:', e.key);
                this.loadData();
            }
        });
    }

    // Debug function
    debug() {
        console.log('=== BOOKING DATA DEBUG ===');
        console.log('Current data:', this.data);
        console.log('Customer data:', this.customerData);
        console.log('Has data:', this.hasData());

        // Show all localStorage keys
        console.log('All localStorage keys:', Object.keys(localStorage));
        console.log('=== END DEBUG ===');
    }
}

// Global instance
let bookingDataManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    bookingDataManager = new BookingDataManager();
    bookingDataManager.init();
});

// Global functions for easy access
window.saveBookingData = function(data) {
    if (bookingDataManager) {
        bookingDataManager.saveData(data);
    }
};

window.getBookingData = function() {
    if (bookingDataManager) {
        return bookingDataManager.getData();
    }
    return null;
};

window.saveCustomerData = function(data) {
    if (bookingDataManager) {
        bookingDataManager.saveCustomerData(data);
    }
};

window.getCustomerData = function() {
    if (bookingDataManager) {
        return bookingDataManager.getCustomerData();
    }
    return null;
};

window.clearBookingData = function() {
    if (bookingDataManager) {
        bookingDataManager.clearData();
    }
};

window.debugBookingData = function() {
    if (bookingDataManager) {
        bookingDataManager.debug();
    }
};