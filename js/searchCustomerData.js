// Sample booking data (simulate backend response)
const sampleBookingData = {
    "123456789V": {
        phone: "+94771234567",
        bookingId: "BK-2024-001",
        status: "Confirmed",
        paymentStatus: "paid", // or "pending"
        personalInfo: {
            firstName: "John",
            lastName: "Doe",
            dob: "1990-05-15",
            country: "Sri Lanka",
            nic: "123456789V",
            email: "john.doe@email.com",
            phone: "+94771234567",
            message: "Looking forward to a comfortable stay."
        },
        bookingDetails: {
            checkinDate: "2024-12-15",
            checkoutDate: "2024-12-18",
            roomType: "deluxe",
            promoCode: "SUMMER20",
            adultCount: 2,
            childCount: 1
        }
    },
    "987654321V": {
        phone: "+94779876543",
        bookingId: "BK-2024-002",
        status: "Confirmed",
        paymentStatus: "pending",
        personalInfo: {
            firstName: "Jane",
            lastName: "Smith",
            dob: "1985-08-22",
            country: "Sri Lanka",
            nic: "987654321V",
            email: "jane.smith@email.com",
            phone: "+94779876543",
            message: "Special dietary requirements - vegetarian meals."
        },
        bookingDetails: {
            checkinDate: "2024-12-20",
            checkoutDate: "2024-12-25",
            roomType: "suite",
            promoCode: "",
            adultCount: 2,
            childCount: 0
        }
    }
};

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const nicSearchInput = document.getElementById('nic-search');
const phoneSearchInput = document.getElementById('phone-search');
const loadingSpinner = document.getElementById('loading-spinner');
const noResults = document.getElementById('no-results');
const bookingDetails = document.getElementById('booking-details');
const statusNotification = document.getElementById('status-notification');
const paymentSection = document.getElementById('payment-section');
const addPaymentBtn = document.getElementById('add-payment-btn');
const editBookingBtn = document.getElementById('edit-booking-btn');
const saveBookingBtn = document.getElementById('save-booking-btn');
const cancelBookingBtn = document.getElementById('cancel-booking-btn');
const confirmBookingBtn = document.getElementById('confirm-booking-btn');
const bookingActions = document.getElementById('booking-actions');

// Current booking data
let currentBookingData = null;
let isEditingBooking = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setupCardNumberFormatting();
});

function initializeEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    nicSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    phoneSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Payment functionality
    addPaymentBtn.addEventListener('click', showPaymentForm);
    confirmBookingBtn.addEventListener('click', handlePaymentConfirmation);

    // Booking edit functionality
    editBookingBtn.addEventListener('click', enableBookingEdit);
    saveBookingBtn.addEventListener('click', saveBookingChanges);
    cancelBookingBtn.addEventListener('click', cancelBookingEdit);
}

// Search Functionality
async function handleSearch() {
    const nic = nicSearchInput.value.trim();
    const phone = phoneSearchInput.value.trim();

    if (!nic || !phone) {
        alert('Please enter both NIC and phone number');
        return;
    }

    showLoadingSpinner();
    hideAllSections();

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Search for booking data
        const bookingData = await searchBookingData(nic, phone);

        if (bookingData) {
            currentBookingData = bookingData;
            displayBookingData(bookingData);
            showBookingDetails();

            // Show payment status notification if paid
            if (bookingData.paymentStatus === 'paid') {
                showPaymentStatusNotification();
            }
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        showNoResults();
    } finally {
        hideLoadingSpinner();
    }
}

async function searchBookingData(nic, phone) {
    // Simulate backend API call
    // In real implementation, this would make an HTTP request to your backend

    const bookingData = sampleBookingData[nic];

    if (bookingData && bookingData.phone === phone) {
        return bookingData;
    }

    return null;
}

// Display Functions
function displayBookingData(data) {
    // Update booking summary
    document.getElementById('booking-id').textContent = data.bookingId;
    document.getElementById('booking-status').textContent = data.status;

    const paymentStatusEl = document.getElementById('payment-status');
    paymentStatusEl.textContent = data.paymentStatus === 'paid' ? 'Paid' : 'Pending';
    paymentStatusEl.className = `value payment-badge ${data.paymentStatus === 'paid' ? 'paid' : ''}`;

    // Update personal information
    document.getElementById('first-name').value = data.personalInfo.firstName;
    document.getElementById('last-name').value = data.personalInfo.lastName;
    document.getElementById('dob').value = data.personalInfo.dob;
    document.getElementById('country').value = data.personalInfo.country;
    document.getElementById('nic').value = data.personalInfo.nic;
    document.getElementById('email').value = data.personalInfo.email;
    document.getElementById('phone').value = data.personalInfo.phone;
    document.getElementById('message').value = data.personalInfo.message;

    // Update booking details
    document.getElementById('checkin-date').value = data.bookingDetails.checkinDate;
    document.getElementById('checkout-date').value = data.bookingDetails.checkoutDate;
    document.getElementById('room-type').value = data.bookingDetails.roomType;
    document.getElementById('promo-code').value = data.bookingDetails.promoCode;
    document.getElementById('adult-count').value = data.bookingDetails.adultCount;
    document.getElementById('child-count').value = data.bookingDetails.childCount;

    // Show/hide payment button based on payment status
    if (data.paymentStatus === 'paid') {
        addPaymentBtn.style.display = 'none';
    } else {
        addPaymentBtn.style.display = 'inline-block';
    }
}

// UI State Management
function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}

function showBookingDetails() {
    bookingDetails.classList.remove('hidden');
}

function hideBookingDetails() {
    bookingDetails.classList.add('hidden');
}

function showNoResults() {
    noResults.classList.remove('hidden');
}

function hideNoResults() {
    noResults.classList.add('hidden');
}

function showPaymentStatusNotification() {
    statusNotification.classList.remove('hidden');
    setTimeout(() => {
        statusNotification.classList.add('hidden');
    }, 5000);
}

function hideAllSections() {
    hideBookingDetails();
    hideNoResults();
    statusNotification.classList.add('hidden');
    paymentSection.classList.add('hidden');
}

// Payment Functionality
function showPaymentForm() {
    paymentSection.classList.remove('hidden');
    paymentSection.scrollIntoView({ behavior: 'smooth' });

    // Pre-fill cardholder name if available
    if (currentBookingData) {
        const fullName = `${currentBookingData.personalInfo.firstName} ${currentBookingData.personalInfo.lastName}`;
        document.getElementById('card-holder-name').value = fullName;
    }
}

async function handlePaymentConfirmation() {
    const paymentForm = document.getElementById('payment-form');

    if (!validatePaymentForm(paymentForm)) {
        return;
    }

    // Show loading state
    confirmBookingBtn.disabled = true;
    confirmBookingBtn.textContent = 'Processing...';

    try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update payment status
        if (currentBookingData) {
            currentBookingData.paymentStatus = 'paid';

            // Update UI
            const paymentStatusEl = document.getElementById('payment-status');
            paymentStatusEl.textContent = 'Paid';
            paymentStatusEl.className = 'value payment-badge paid';

            // Hide payment section and button
            paymentSection.classList.add('hidden');
            addPaymentBtn.style.display = 'none';

            // Show success notification
            showPaymentStatusNotification();

            // Clear payment form
            paymentForm.reset();
        }

        alert('Payment processed successfully!');

    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment processing failed. Please try again.');
    } finally {
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.textContent = 'CONFIRM BOOKING';
    }
}

function validatePaymentForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#e1e5e9';
        }
    });

    if (!isValid) {
        alert('Please fill in all required payment fields');
    }

    return isValid;
}

// Booking Edit Functionality
function enableBookingEdit() {
    isEditingBooking = true;

    // Enable booking detail fields
    const bookingFields = [
        'checkin-date', 'checkout-date', 'room-type',
        'promo-code', 'adult-count', 'child-count'
    ];

    bookingFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field.tagName === 'SELECT') {
            field.disabled = false;
        } else {
            field.readOnly = false;
        }
        field.style.backgroundColor = '#fff';
        field.style.cursor = 'text';
    });

    // Show action buttons
    bookingActions.classList.remove('hidden');
    editBookingBtn.style.display = 'none';
}

async function saveBookingChanges() {
    const updatedData = {
        checkinDate: document.getElementById('checkin-date').value,
        checkoutDate: document.getElementById('checkout-date').value,
        roomType: document.getElementById('room-type').value,
        promoCode: document.getElementById('promo-code').value,
        adultCount: parseInt(document.getElementById('adult-count').value),
        childCount: parseInt(document.getElementById('child-count').value)
    };

    // Validate dates
    if (new Date(updatedData.checkinDate) >= new Date(updatedData.checkoutDate)) {
        alert('Check-out date must be after check-in date');
        return;
    }

    // Show loading state
    saveBookingBtn.disabled = true;
    saveBookingBtn.textContent = 'Saving...';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update current booking data
        if (currentBookingData) {
            Object.assign(currentBookingData.bookingDetails, updatedData);
        }

        alert('Booking details updated successfully!');
        cancelBookingEdit();

    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to update booking details. Please try again.');
    } finally {
        saveBookingBtn.disabled = false;
        saveBookingBtn.textContent = 'Save Changes';
    }
}

function cancelBookingEdit() {
    isEditingBooking = false;

    // Restore original data
    if (currentBookingData) {
        displayBookingData(currentBookingData);
    }

    // Disable booking detail fields
    const bookingFields = [
        'checkin-date', 'checkout-date', 'room-type',
        'promo-code', 'adult-count', 'child-count'
    ];

    bookingFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field.tagName === 'SELECT') {
            field.disabled = true;
        } else {
            field.readOnly = true;
        }
        field.style.backgroundColor = '#f8f9fa';
        field.style.cursor = 'not-allowed';
    });

    // Hide action buttons
    bookingActions.classList.add('hidden');
    editBookingBtn.style.display = 'inline-block';
}

// Card Number Formatting
function setupCardNumberFormatting() {
    const cardNumberInput = document.getElementById('card-number');

    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;

        if (formattedValue !== e.target.value) {
            e.target.value = formattedValue;
        }
    });

    // CVC input validation
    const cvcInput = document.getElementById('cvc');
    cvcInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateNights(checkinDate, checkoutDate) {
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const timeDiff = checkout.getTime() - checkin.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        searchBookingData,
        validatePaymentForm,
        calculateNights,
        formatDate
    };
}