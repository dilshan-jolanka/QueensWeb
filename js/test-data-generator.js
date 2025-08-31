// ===== TEST DATA GENERATOR =====
// Generate sample booking data for testing the invoice system

class TestDataGenerator {
    constructor() {
        this.testScenarios = {
            singleRoom: this.generateSingleRoomBooking(),
            multipleRooms: this.generateMultipleRoomsBooking(),
            suiteBooking: this.generateSuiteBooking(),
            emptyData: null
        };
    }

    // Generate single room booking data
    generateSingleRoomBooking() {
        return {
            roomType: 'Deluxe Room',
            pricePerNight: 15000,
            numberOfNights: 3,
            numberOfRooms: 1,
            totalAmount: 45000,
            totalGuests: 2,
            checkIn: '2024-01-15',
            checkOut: '2024-01-18',
            bookingType: 'hotel'
        };
    }

    // Generate multiple rooms booking data
    generateMultipleRoomsBooking() {
        return {
            selectedRoomDetails: [
                {
                    roomType: 'Deluxe Room',
                    pricePerNight: 15000,
                    quantity: 2,
                    subtotalTotal: 90000,
                    features: ['WiFi', 'AC', 'Mini Bar'],
                    numberOfNights: 3
                },
                {
                    roomType: 'Executive Suite',
                    pricePerNight: 25000,
                    quantity: 1,
                    subtotalTotal: 75000,
                    features: ['WiFi', 'AC', 'Mini Bar', 'Balcony'],
                    numberOfNights: 3
                }
            ],
            totalAmount: 165000,
            numberOfNights: 3,
            totalGuests: 5,
            checkIn: '2024-01-15',
            checkOut: '2024-01-18',
            bookingType: 'hotel'
        };
    }

    // Generate suite booking data
    generateSuiteBooking() {
        return {
            selectedRoomDetails: [
                {
                    roomType: 'Presidential Suite',
                    pricePerNight: 50000,
                    quantity: 1,
                    subtotalTotal: 150000,
                    features: ['WiFi', 'AC', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Butler Service'],
                    numberOfNights: 3,
                    suiteDetails: {
                        type: 'Presidential',
                        weeklyRate: 300000,
                        monthlyRate: 1200000
                    }
                }
            ],
            totalAmount: 150000,
            numberOfNights: 3,
            totalGuests: 4,
            checkIn: '2024-01-15',
            checkOut: '2024-01-18',
            bookingType: 'suite',
            isSuiteBooking: true
        };
    }

    // Load test scenario into localStorage
    loadTestScenario(scenarioName) {
        console.log(`Loading test scenario: ${scenarioName}`);

        // Clear existing data
        this.clearAllData();

        const testData = this.testScenarios[scenarioName];

        if (testData) {
            // Store booking data
            localStorage.setItem('hotelBookingData', JSON.stringify(testData));

            // Store customer data
            localStorage.setItem('customerFullName', 'John Doe');
            localStorage.setItem('customerEmail', 'john.doe@example.com');
            localStorage.setItem('phone', '+94 77 123 4567');
            localStorage.setItem('address', '123 Main Street, Colombo, Sri Lanka');

            console.log('Test data loaded successfully:', testData);
            return true;
        } else {
            console.log('Test scenario not found');
            return false;
        }
    }

    // Clear all booking-related data from localStorage
    clearAllData() {
        const keysToRemove = [
            'hotelBookingData',
            'suiteBookingData',
            'bookingData',
            'selectedRoomDetails',
            'customerFullName',
            'customerEmail',
            'phone',
            'address',
            'checkIn',
            'checkOut'
        ];

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('All booking data cleared');
    }

    // Get all available test scenarios
    getAvailableScenarios() {
        return Object.keys(this.testScenarios);
    }

    // Display current localStorage data
    showCurrentData() {
        console.log('=== CURRENT LOCALSTORAGE DATA ===');

        const keys = [
            'hotelBookingData',
            'suiteBookingData',
            'selectedRoomDetails',
            'customerFullName',
            'customerEmail',
            'phone',
            'address'
        ];

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    console.log(`${key}:`, parsed);
                } catch (e) {
                    console.log(`${key}:`, value);
                }
            } else {
                console.log(`${key}: NOT SET`);
            }
        });

        console.log('=== END CURRENT DATA ===');
    }
}

// Global instance
let testDataGenerator;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    testDataGenerator = new TestDataGenerator();
});

// Global functions for testing
window.loadTestScenario = function(scenarioName) {
    if (testDataGenerator) {
        const success = testDataGenerator.loadTestScenario(scenarioName);
        if (success) {
            // Reload the page to apply new data
            window.location.reload();
        }
    }
};

window.clearTestData = function() {
    if (testDataGenerator) {
        testDataGenerator.clearAllData();
        window.location.reload();
    }
};

window.showTestData = function() {
    if (testDataGenerator) {
        testDataGenerator.showCurrentData();
    }
};

window.listTestScenarios = function() {
    if (testDataGenerator) {
        console.log('Available test scenarios:', testDataGenerator.getAvailableScenarios());
    }
};

// Auto-load test data if no booking data exists
document.addEventListener('DOMContentLoaded', function() {
    const hasBookingData = localStorage.getItem('hotelBookingData') ||
                          localStorage.getItem('suiteBookingData') ||
                          localStorage.getItem('selectedRoomDetails');

    if (!hasBookingData) {
        console.log('No booking data found, loading default test scenario...');
        setTimeout(() => {
            if (testDataGenerator) {
                testDataGenerator.loadTestScenario('multipleRooms');
            }
        }, 1000);
    }
});