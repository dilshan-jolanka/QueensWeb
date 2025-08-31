let countriesData = [];

// Function to parse URL parameters
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        checkIn: urlParams.get('checkIn'),
        checkOut: urlParams.get('checkOut'),
        adults: parseInt(urlParams.get('adults')) || 0,
        children: parseInt(urlParams.get('children')) || 0,
        roomIds: urlParams.get('roomIds')?.split(',') || [],
        roomQuantities: urlParams.get('roomQuantities') ? JSON.parse(urlParams.get('roomQuantities')) : {},
        totalAmount: parseFloat(urlParams.get('totalAmount')) || 0,
        bd: urlParams.get('bd')
    };
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return {
        day: day,
        monthYear: `${month}, ${year}`,
        weekday: weekday
    };
}

// Function to calculate nights between dates
function calculateNights(checkIn, checkOut) {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Function to load cached room data from room selection
function loadCachedRoomData() {
    try {
        // Get cached room data from multiple sources
        const hotelBookingData = localStorage.getItem('hotelBookingData');
        const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
        
        if (hotelBookingData) {
            const bookingData = JSON.parse(hotelBookingData);
            console.log('Found cached hotel booking data:', bookingData);
            
            // Update the reservation display with cached data
            updateReservationFromCache(bookingData);
            return true;
        }
        
        // If full booking data isn't found, try to reconstruct from room details + URL or availability cache
        if (selectedRoomDetails) {
            const roomDetails = JSON.parse(selectedRoomDetails);
            console.log('Found cached room details (no full booking data). Attempting reconstruction.');

            // Prefer URL params for dates/guests/amount
            const params = getUrlParams();

            // Fallback to DataCacheManager availability cache if URL missing
            let checkIn = params.checkIn;
            let checkOut = params.checkOut;
            let adults = params.adults;
            let children = params.children;
            let totalAmount = params.totalAmount;
            let numberOfNights = params.checkIn && params.checkOut ? calculateNights(params.checkIn, params.checkOut) : null;

            if ((!checkIn || !checkOut) && window.dataCacheManager) {
                try {
                    const availability = window.dataCacheManager.getCache('availability');
                    if (availability) {
                        checkIn = checkIn || availability.checkIn;
                        checkOut = checkOut || availability.checkOut;
                        adults = adults || parseInt(availability.adults || '0', 10);
                        children = children || parseInt(availability.children || '0', 10);
                        numberOfNights = numberOfNights || (availability.checkIn && availability.checkOut ? calculateNights(availability.checkIn, availability.checkOut) : null);
                    }
                } catch (e) {
                    // no-op
                }
            }

            // Compute totals if missing
            const computedTotal = roomDetails.reduce((sum, r) => sum + (r.subtotalTotal || 0), 0);

            // Only use computed total if URL totalAmount is 0 or undefined
            if (!totalAmount || totalAmount === 0) {
                totalAmount = computedTotal || 0;
            }
            const totalGuests = (adults || 0) + (children || 0);

            const reconstructed = {
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                numberOfNights: numberOfNights || null,
                adults: adults || 0,
                children: children || 0,
                totalGuests: totalGuests,
                selectedRoomDetails: roomDetails,
                totalRooms: roomDetails.reduce((sum, r) => sum + (parseInt(r.quantity || 0, 10) || 0), 0),
                totalAmount: totalAmount
            };

            updateReservationFromCache(reconstructed);
            return true;
        }
        
        // Check DataCacheManager if available
        if (window.dataCacheManager) {
            const cachedData = window.dataCacheManager.getCache('roomSelection');
            if (cachedData) {
                console.log('Found cached data from DataCacheManager:', cachedData);
                // Try reconstructing minimal reservation data from availability cache
                try {
                    const availability = window.dataCacheManager.getCache('availability');
                    if (availability) {
                        const reconstructed = {
                            checkIn: availability.checkIn || null,
                            checkOut: availability.checkOut || null,
                            numberOfNights: (availability.checkIn && availability.checkOut) ? calculateNights(availability.checkIn, availability.checkOut) : null,
                            adults: parseInt(availability.adults || '0', 10),
                            children: parseInt(availability.children || '0', 10),
                            totalGuests: (parseInt(availability.adults || '0', 10) + parseInt(availability.children || '0', 10)),
                            selectedRoomDetails: [],
                            totalRooms: 0,
                            totalAmount: 0
                        };
                        updateReservationFromCache(reconstructed);
                        return true;
                    }
                } catch (e) {
                    // no-op
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error loading cached room data:', error);
        return false;
    }
}

// Function to update reservation display from cached data
function updateReservationFromCache(bookingData) {
    if (!bookingData) return;
    
    // Update check-in date
    if (bookingData.checkIn) {
        const checkInFormatted = formatDate(bookingData.checkIn);
        document.getElementById('checkin-day').textContent = checkInFormatted.day;
        document.getElementById('checkin-date').innerHTML = `${checkInFormatted.monthYear}<br>${checkInFormatted.weekday}`;
    }

    // Update check-out date
    if (bookingData.checkOut) {
        const checkOutFormatted = formatDate(bookingData.checkOut);
        document.getElementById('checkout-day').textContent = checkOutFormatted.day;
        document.getElementById('checkout-date').innerHTML = `${checkOutFormatted.monthYear}<br>${checkOutFormatted.weekday}`;
    }

    // Update nights
    if (bookingData.numberOfNights) {
        document.getElementById('total-nights').textContent = bookingData.numberOfNights;
    }

    // Update total guests
    if (bookingData.totalGuests) {
        document.getElementById('total-guests').textContent = bookingData.totalGuests;
    }

    // Update promocode display if available
    const promocode = getPromocode();
    if (promocode) {
        const promocodeDisplay = document.getElementById('promocode-display');
        const appliedPromocode = document.getElementById('applied-promocode');
        if (promocodeDisplay && appliedPromocode) {
            promocodeDisplay.style.display = 'block';
            appliedPromocode.textContent = promocode;
        }
    }

    // Update reservation table with room details
    const tbody = document.getElementById('reservation-details');
    tbody.innerHTML = '';

    if (bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
        bookingData.selectedRoomDetails.forEach(room => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${room.quantity} ${room.roomType} x ${bookingData.numberOfNights} Night${bookingData.numberOfNights > 1 ? 's' : ''}</td>
                <td>LKR ${room.subtotalTotal.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } else if (bookingData.totalRooms && bookingData.numberOfNights) {
        // Fallback display
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bookingData.totalRooms} Room${bookingData.totalRooms > 1 ? 's' : ''} x ${bookingData.numberOfNights} Night${bookingData.numberOfNights > 1 ? 's' : ''}</td>
            <td>LKR ${bookingData.totalAmount.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    }

    // Update total amount
    if (bookingData.totalAmount) {
        document.getElementById('total-amount').textContent = `LKR ${bookingData.totalAmount.toLocaleString()}`;
    }
}

// Function to update reservation display
function updateReservation() {
    // First try to load from cached data
    let hasCachedData = loadCachedRoomData();
    
    // If no cached data, try URL-embedded base64 minimal payload
    if (!hasCachedData) {
        try {
            const params = getUrlParams();
            if (params.bd) {
                const json = decodeURIComponent(escape(atob(params.bd)));
                const embedded = JSON.parse(json);
                // Render immediately
                updateReservationFromCache(embedded);
                // Persist to localStorage for subsequent steps
                try {
                    localStorage.setItem('hotelBookingData', JSON.stringify(embedded));
                    localStorage.setItem('selectedRoomDetails', JSON.stringify(embedded.selectedRoomDetails || []));
                    localStorage.setItem('hotelBookingTimestamp', Date.now().toString());
                } catch (e) {}
                hasCachedData = true;
            }
        } catch (e) {
            console.warn('Failed to parse embedded booking data (bd):', e);
        }
    }

    // If still no data, try cookie fallback
    if (!hasCachedData) {
        try {
            const cookieMatch = document.cookie.match(/(?:^|; )booking_cache=([^;]*)/);
            if (cookieMatch && cookieMatch[1]) {
                const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(cookieMatch[1])))));
                updateReservationFromCache(decoded);
                try {
                    localStorage.setItem('hotelBookingData', JSON.stringify(decoded));
                    localStorage.setItem('selectedRoomDetails', JSON.stringify(decoded.selectedRoomDetails || []));
                    localStorage.setItem('hotelBookingTimestamp', Date.now().toString());
                } catch (e) {}
                hasCachedData = true;
            }
        } catch (e) {
            console.warn('Failed to read booking_cache cookie:', e);
        }
    }
    
    if (!hasCachedData) {
        // Fallback to URL parameters
        const params = getUrlParams();
        updateReservationFromParams(params);
    }
}

// Function to update reservation from URL parameters (fallback)
function updateReservationFromParams(params) {
    if (params.checkIn && params.checkOut) {
        // Update check-in date
        const checkInFormatted = formatDate(params.checkIn);
        document.getElementById('checkin-day').textContent = checkInFormatted.day;
        document.getElementById('checkin-date').innerHTML = `${checkInFormatted.monthYear}<br>${checkInFormatted.weekday}`;

        // Update check-out date
        const checkOutFormatted = formatDate(params.checkOut);
        document.getElementById('checkout-day').textContent = checkOutFormatted.day;
        document.getElementById('checkout-date').innerHTML = `${checkOutFormatted.monthYear}<br>${checkOutFormatted.weekday}`;

        // Calculate and update nights
        const nights = calculateNights(params.checkIn, params.checkOut);
        document.getElementById('total-nights').textContent = nights;

        // Update total guests
        const totalGuests = params.adults + params.children;
        document.getElementById('total-guests').textContent = totalGuests;

        // Update promocode display if available
        const promocode = getPromocode();
        if (promocode) {
            const promocodeDisplay = document.getElementById('promocode-display');
            const appliedPromocode = document.getElementById('applied-promocode');
            if (promocodeDisplay && appliedPromocode) {
                promocodeDisplay.style.display = 'block';
                appliedPromocode.textContent = promocode;
            }
        }

        // Update reservation table
        const tbody = document.getElementById('reservation-details');
        tbody.innerHTML = '';

        // Calculate total rooms
        const totalRooms = Object.values(params.roomQuantities).reduce((sum, qty) => sum + qty, 0) || params.roomIds.length;

        // Add room details
        if (totalRooms > 0 && params.totalAmount > 0) {
            tbody.innerHTML = `
                <tr>
                    <td>${totalRooms} Room${totalRooms > 1 ? 's' : ''} x ${nights} Night${nights > 1 ? 's' : ''}</td>
                    <td>LKR ${params.totalAmount.toLocaleString()}</td>
                </tr>
            `;
        }

        // Update total amount
        if (params.totalAmount > 0) {
            document.getElementById('total-amount').textContent = `LKR ${params.totalAmount.toLocaleString()}`;
        }
    }
}

// Global variable to store customer ID
let savedCustomerId = null;

// Function to fetch customer data by ID and prefill the form
async function loadCustomerData() {
    try {
        // Check if user is authenticated
        let customerId = localStorage.getItem('customerId');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (!customerId || !isAuthenticated) {
            console.log('No authenticated customer found');
            return false;
        }

        console.log('Loading customer data for ID:', customerId);
        
        // Show loading state
        showLoadingMessage('Loading your information...');

        // Fetch customer data from API
        const response = await fetch(`https://backendtestingportaljolanka.azurewebsites.net/api/Customer/${customerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const customerData = await response.json();
        console.log('Customer data fetched:', customerData);

        // Store customer ID globally
        savedCustomerId = customerId;

        // Store customer name for header display
        if (customerData.firstName && customerData.lName) {
            const fullName = `${customerData.firstName} ${customerData.lName}`;
            localStorage.setItem('customerFullName', fullName);
        }
        if (customerData.emailAddress) {
            localStorage.setItem('customerEmail', customerData.emailAddress);
        }

        // Prefill form with customer data
        await prefillCustomerForm(customerData);
        
        // Update header with actual customer data
        updateAccountHeader(customerData);
        
        // Hide loading message
        hideLoadingMessage();
        
        // Show success message
        showInfoMessage('Your personal information has been loaded from your account. You can edit it if needed and proceed to payment.');

        return true;

    } catch (error) {
        console.error('Error loading customer data:', error);
        hideLoadingMessage();
        
        // Show error but don't block the user - they can still fill the form manually
        showInfoMessage('Unable to load your saved information. Please fill in your details manually.', 'warning');
        
        return false;
    }
}

// Function to prefill the customer form with fetched data
async function prefillCustomerForm(customerData) {
    try {
        // Map customer data to form fields
        const fieldMappings = {
            'firstName': customerData.firstName,
            'lastName': customerData.lName || customerData.lastName,
            'email': customerData.emailAddress || customerData.email,
            'phone': customerData.phone,
            'address': customerData.address,
            'passportId': customerData.passportId,
            'nic': customerData.nic,
            'dob': customerData.dob ? customerData.dob.split('T')[0] : '', // Format date for input
            'gender': customerData.gender
        };

        // Fill form fields
        Object.entries(fieldMappings).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
                
                // Trigger change event for validation
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Handle country field - now directly available as countryName
        if (customerData.countryName) {
            const countryField = document.getElementById('country');
            if (countryField) {
                countryField.value = customerData.countryName;
                countryField.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        console.log('Customer form prefilled successfully');

    } catch (error) {
        console.error('Error prefilling customer form:', error);
    }
}

// Country field is now set directly from API response (countryName field)

// Function to show loading message
function showLoadingMessage(message) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.booking-message, .booking-error, .loading-message');
    existingMessages.forEach(msg => msg.remove());

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.style.cssText = `
        background-color: #e1f5fe;
        color: #01579b;
        padding: 15px;
        border: 1px solid #b3e5fc;
        border-radius: 5px;
        margin-bottom: 20px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `;

    loadingDiv.innerHTML = `
        <div style="border: 2px solid #f3f3f3; border-top: 2px solid #01579b; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
        <span>${message}</span>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Insert at the top of the personal info section
    const personalInfoSection = document.querySelector('.personal-info');
    if (personalInfoSection) {
        personalInfoSection.insertBefore(loadingDiv, personalInfoSection.firstChild);
    }
}

// Function to hide loading message
function hideLoadingMessage() {
    const loadingMessages = document.querySelectorAll('.loading-message');
    loadingMessages.forEach(msg => msg.remove());
}

// Function to show info message
function showInfoMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.booking-message, .booking-error, .loading-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = 'booking-message';
    
    const colors = {
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
    };
    
    const colorScheme = colors[type] || colors.info;
    
    messageDiv.style.cssText = `
        background-color: ${colorScheme.bg};
        color: ${colorScheme.text};
        padding: 15px;
        border: 1px solid ${colorScheme.border};
        border-radius: 5px;
        margin-bottom: 20px;
        text-align: center;
    `;

    messageDiv.textContent = message;

    // Insert at the top of the personal info section
    const personalInfoSection = document.querySelector('.personal-info');
    if (personalInfoSection) {
        personalInfoSection.insertBefore(messageDiv, personalInfoSection.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function getPersonalInfo() {
    const countryInput = document.getElementById('country');
    const selectedCountryName = countryInput.value.trim();

    // Find the country object to get the countryId (still needed for API calls that require ID)
    const selectedCountry = window.countriesData ? window.countriesData.find(country => country.countryName === selectedCountryName) : null;
    const countryOfResidence_id = selectedCountry ? selectedCountry.countryId : null;

    return {
        firstName: document.getElementById('firstName').value.trim(),
        lName: document.getElementById('lastName').value.trim(),
        emailAddress: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        passportId: document.getElementById('passportId').value.trim(),
        nic: document.getElementById('nic').value.trim(),
        countryOfResidence_id: countryOfResidence_id, // Country ID for API calls
        countryName: selectedCountryName, // Country name for display
        dob: document.getElementById('dob').value || null,
        gender: document.getElementById('gender').value,
    };
}

// Function to save credit card details
async function saveCreditCard(cardData) {
    try {
        console.log('Saving credit card:', cardData);
        
        const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/CreditCard/insert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || `Server error: ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Credit card saved successfully:', result);
        
        return {
            success: true,
            cardId: result.creditCardId || result.id || result.cardId,
            message: result.message || 'Credit card saved successfully',
            data: result
        };

    } catch (error) {
        console.error('Error saving credit card:', error);
        throw error;
    }
}

// Function to get card type ID based on card type name
function getCardTypeId(cardType) {
    const cardTypeMap = {
        'visa': 1,
        'mastercard': 2,
        'amex': 3
    };
    return cardTypeMap[cardType.toLowerCase()] || 0;
}

// Function to collect and validate payment information
function getPaymentInfo() {
    const cardType = document.getElementById('cardType').value;
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardHolderName = document.getElementById('cardHolderName').value.trim();
    const cvc = document.getElementById('cvc').value.trim();
    const expiryMonth = parseInt(document.getElementById('expiryMonth').value) || 0;
    const expiryYear = parseInt(document.getElementById('expiryYear').value) || 0;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'card';
    const payLaterSelected = document.getElementById('payLaterCheckbox')?.checked === true;

    return {
        cardType,
        cardNumber,
        cardHolderName,
        cvc,
        expiryMonth,
        expiryYear,
        paymentMethod,
        payLaterSelected,
        hasValidCard: !!(cardType && cardNumber && cardHolderName && cvc && expiryMonth && expiryYear)
    };
}

// Function to validate payment details
function validatePaymentDetails(paymentInfo) {
    const errors = [];

    if (!paymentInfo.payLaterSelected && paymentInfo.paymentMethod === 'card') {
        if (!paymentInfo.cardType) {
            errors.push('Card type is required');
        }
        if (!paymentInfo.cardNumber) {
            errors.push('Card number is required');
        }
        if (!paymentInfo.cardHolderName) {
            errors.push('Card holder name is required');
        }
        if (!paymentInfo.cvc) {
            errors.push('CVC is required');
        }
        if (!paymentInfo.expiryMonth) {
            errors.push('Expiry month is required');
        }
        if (!paymentInfo.expiryYear) {
            errors.push('Expiry year is required');
        }
    }

    // Validate terms and conditions (must use the specific Terms checkbox)
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
        errors.push('You must agree to the terms and conditions');
    }

    return errors;
}

// Function to get promocode from URL or localStorage
function getPromocode() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const promocode = urlParams.get('promocode') || urlParams.get('promo') || urlParams.get('code');
    
    if (promocode) {
        return promocode;
    }
    
    // Check cached availability data for promocode
    try {
        if (window.dataCacheManager) {
            const availabilityData = window.dataCacheManager.getCache('availability');
            if (availabilityData && availabilityData.promocode) {
                return availabilityData.promocode;
            }
        }
        
        // Check localStorage directly as fallback
        const cachedData = localStorage.getItem('dataCacheManager_cache');
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.availability && parsed.availability.promocode) {
                return parsed.availability.promocode;
            }
        }
        
        // Check localStorage for promocode
        const cachedPromocode = localStorage.getItem('promocode');
        if (cachedPromocode) {
            return cachedPromocode;
        }
    } catch (error) {
        console.warn('Error retrieving promocode from cache:', error);
    }
    
    return null;
}

// Function to get travel agency ID from promocode
async function getTravelAgencyId(promocode) {
    if (!promocode) return 0;
    
    try {
        // You might need to implement an API call to validate promocode and get agency ID
        // For now, we'll return a default value or implement basic validation
        const response = await fetch(`https://backendtestingportaljolanka.azurewebsites.net/api/Promocode/validate?code=${encodeURIComponent(promocode)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            return result.travelAgencyId || result.agencyId || 0;
        }
        
        return 0;
    } catch (error) {
        console.warn('Could not validate promocode, proceeding without travel agency ID:', error);
        return 0;
    }
}

// Updated function to validate customer details
function validateCustomerDetails(personalInfo) {
    const errors = [];

    if (!personalInfo.firstName) {
        errors.push('First name is required');
    }
    if (!personalInfo.lName) {
        errors.push('Last name is required');
    }
    if (!personalInfo.emailAddress) {
        errors.push('Email is required');
    }
    if (!personalInfo.phone) {
        errors.push('Phone number is required');
    }
    if (!personalInfo.nic) {
        errors.push('NIC is required');
    }
    if (!personalInfo.countryName && !personalInfo.countryOfResidence_id) {
        errors.push('Country is required');
    }
    if (!personalInfo.gender) {
        errors.push('Gender is required');
    }

    return errors;
}

// Function to validate user details (personal information) - keeping for backward compatibility
function validateUserDetails(personalInfo) {
    return validateCustomerDetails(personalInfo);
}

// Function to check if payment details are provided
function hasPaymentDetails(paymentInfo) {
    return !!(paymentInfo.cardNumber &&
        paymentInfo.cardHolderName &&
        paymentInfo.cvc);
}

// Customer loading functions removed - not needed since user is already authenticated

// Function to show loading state
function showLoading(show = true) {
    const button = document.querySelector('#confirm-booking-btn');
    if (show) {
        button.textContent = 'PROCESSING...';
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.7';
    } else {
        button.textContent = 'CONFIRM BOOKING';
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
    }
}

// Function to show error messages
function showErrors(errors) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.booking-error, .booking-message');
    existingMessages.forEach(message => message.remove());

    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'booking-error';
        errorDiv.style.cssText = `
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            margin-bottom: 20px;
        `;

        const errorList = document.createElement('ul');
        errorList.style.margin = '0';
        errorList.style.paddingLeft = '20px';

        errors.forEach(error => {
            const errorItem = document.createElement('li');
            errorItem.textContent = error;
            errorList.appendChild(errorItem);
        });

        errorDiv.appendChild(errorList);

        // Insert before the appropriate button
        const saveCustomerBtn = document.getElementById('save-customer-btn');
        const confirmBookingBtn = document.getElementById('confirm-booking-btn');

        if (saveCustomerBtn && saveCustomerBtn.closest('.card-btn')) {
            const cardBtn = saveCustomerBtn.closest('.card-btn');
            cardBtn.parentNode.insertBefore(errorDiv, cardBtn);
        } else if (confirmBookingBtn && confirmBookingBtn.closest('.card-btn')) {
            const cardBtn = confirmBookingBtn.closest('.card-btn');
            cardBtn.parentNode.insertBefore(errorDiv, cardBtn);
        }

        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Customer success messages removed - not needed since user is already authenticated

// Function to show payment warning message
function showPaymentWarningMessage() {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.booking-message, .booking-error');
    existingMessages.forEach(message => message.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = 'booking-message';
    messageDiv.style.cssText = `
        background-color: #fff3cd;
        color: #856404;
        padding: 20px;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    messageDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">
            Booking Pending Payment
        </h3>
        <p style="margin: 0; font-size: 16px; color: #d63384; font-weight: 500;">
            Your booking will be cancelled after today 7 PM if payment is not completed.
        </p>
    `;

    // Insert before the confirm button
    const cardBtn = document.querySelector('#confirm-booking-btn').closest('.card-btn');
    cardBtn.parentNode.insertBefore(messageDiv, cardBtn);

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to show beautiful success modal
function showSuccessModal(reservationId, billingId, confirmationParams) {
    // Remove any existing success modals
    const existingModal = document.getElementById('booking-success-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal HTML
    const modalHTML = `
        <div id="booking-success-modal" class="booking-success-modal-overlay">
            <div class="booking-success-modal">
                <div class="modal-header">
                    <div class="success-icon">
                        <i class="fa fa-check-circle"></i>
                    </div>
                    <h2 class="modal-title">Booking Confirmed!</h2>
                    <p class="modal-subtitle">Your reservation has been successfully created</p>
                </div>

                <div class="modal-body">
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Reservation ID:</span>
                            <span class="detail-value">${reservationId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Billing ID:</span>
                            <span class="detail-value">${billingId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-confirmed">Confirmed</span>
                        </div>
                    </div>

                    <div class="next-steps">
                        <p><i class="fa fa-info-circle"></i> You will be redirected to your booking confirmation page where you can view your invoice and booking details.</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button id="view-confirmation-btn" class="btn-primary">
                        <i class="fa fa-eye"></i> View Booking Details
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add modal styles
    const modalStyles = `
        <style>
            .booking-success-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }

            .booking-success-modal {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                overflow: hidden;
                animation: slideUp 0.4s ease-out;
            }

            .modal-header {
                text-align: center;
                padding: 30px 20px 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }

            .success-icon {
                font-size: 48px;
                margin-bottom: 15px;
                animation: bounce 0.6s ease-out;
            }

            .modal-title {
                font-size: 28px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .modal-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
            }

            .modal-body {
                padding: 30px;
            }

            .booking-details {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .detail-row:last-child {
                border-bottom: none;
            }

            .detail-label {
                font-weight: 500;
                color: #495057;
            }

            .detail-value {
                font-weight: 600;
                color: #212529;
                font-family: monospace;
            }

            .status-confirmed {
                color: #28a745 !important;
            }

            .next-steps {
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }

            .next-steps p {
                margin: 0;
                color: #1976d2;
                font-size: 14px;
                line-height: 1.5;
            }

            .modal-footer {
                padding: 20px 30px 30px;
                text-align: center;
            }

            .btn-primary {
                background: linear-gradient(135deg, #2196F3, #1976d2);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
            }

            .btn-primary:active {
                transform: translateY(0);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }

            @media (max-width: 768px) {
                .booking-success-modal {
                    margin: 20px;
                    width: calc(100% - 40px);
                }

                .modal-header {
                    padding: 20px 15px 15px;
                }

                .modal-body {
                    padding: 20px;
                }

                .modal-footer {
                    padding: 15px 20px 20px;
                }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', modalStyles);

    // Add event listener to the button
    document.getElementById('view-confirmation-btn').addEventListener('click', function() {
        // Navigate to confirmation page
        const confirmationUrl = `confirmation.html?${confirmationParams}`;
        console.log('Navigating to confirmation page:', confirmationUrl);

        // Refresh auth state and set a one-time skip for guard
        try {
            const customerId = localStorage.getItem('customerId');
            if (customerId) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('authTimestamp', Date.now().toString());
            }
            sessionStorage.setItem('skip_auth_check_once', '1');
        } catch (e) {
            console.warn('Unable to refresh auth state before redirect:', e);
        }

        // Navigate to confirmation page
        window.location.href = confirmationUrl;
    });

    // Auto-redirect after 10 seconds if user doesn't click
    setTimeout(() => {
        const modal = document.getElementById('booking-success-modal');
        if (modal && modal.parentNode) {
            console.log('Auto-redirecting to confirmation page after 10 seconds...');
            document.getElementById('view-confirmation-btn').click();
        }
    }, 10000);

    console.log('Success modal displayed with auto-redirect timer set');
}

// Function to show success message (legacy function for backward compatibility)
function showSuccess() {
    alert('Booking confirmed successfully! Redirecting to confirmation page...');
}

// Customer data is already saved - user is authenticated
// No need for additional customer saving functionality

// Function to send booking data without payment (for reservation hold)
async function sendBookingWithoutPayment(bookingData) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Sending booking without payment (attempt ${attempt}/${maxRetries}):`, bookingData);

            const response = await fetch('/api/bookings/hold', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...bookingData,
                    status: 'pending_payment',
                    cancellation_time: new Date(new Date().setHours(19, 0, 0, 0)).toISOString()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || `Server error: ${response.status}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();

            console.log('Booking hold successful:', result);
            return {
                success: true,
                booking_id: result.booking_id || result.bookingId || result.id,
                message: result.message || 'Booking held successfully',
                data: result
            };

        } catch (error) {
            console.error(`Booking hold attempt ${attempt} failed:`, error);
            lastError = error;

            if (attempt === maxRetries) {
                break;
            }

            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Failed to hold booking after ${maxRetries} attempts: ${lastError.message}`);
}

// Function to send complete booking data with payment
async function sendCompleteBooking(reservationData) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Sending reservation (attempt ${attempt}/${maxRetries}):`, reservationData);

            const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/Reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(reservationData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || `Server error: ${response.status}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Reservation API response:', result);

            // Validate that we got a valid reservation ID
            const reservationId = result.reservationId || result.id || result.reservation_id;
            if (!reservationId || reservationId === 'DEFAULT_RESERVATION_ID') {
                throw new Error('Invalid reservation ID received from server');
            }

            // Additional validation - check if the response contains expected fields
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response format from reservation API');
            }

            console.log('Reservation created successfully with ID:', reservationId);
            return {
                success: true,
                reservation_id: reservationId,
                message: result.message || 'Reservation confirmed successfully',
                data: result
            };

        } catch (error) {
            console.error(`Reservation attempt ${attempt} failed:`, error);
            lastError = error;

            if (attempt === maxRetries) {
                break;
            }

            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Failed to create reservation after ${maxRetries} attempts: ${lastError.message}`);
}


// Function to create billing record after successful reservation
async function createBillingRecord(reservationId, bookingData, paymentInfo) {
    try {
        console.log('Creating billing record for reservation ID:', reservationId);

        // Fix payment method values to be within valid range (1-10)
        let billingPaymentMethodId = 1; // Default to card payment

        if (paymentInfo.payLaterSelected || paymentInfo.paymentMethod === 'cash') {
            billingPaymentMethodId = 2; // Use 2 for cash/pay later payments
        } else if (paymentInfo.paymentMethod === 'card') {
            billingPaymentMethodId = 1; // Use 1 for card payments
        }

        console.log('Billing payment method determination:', {
            payLaterSelected: paymentInfo.payLaterSelected,
            paymentMethod: paymentInfo.paymentMethod,
            finalBillingPaymentMethodId: billingPaymentMethodId
        });

        // Ensure totalAmount is a valid number
        let totalAmount = parseFloat(bookingData.totalAmount) || 0;

        // If totalAmount is still 0, try to calculate from booking data
        if (totalAmount === 0) {
            // Try to get booking data and recalculate
            const currentBookingData = getCurrentBookingData();
            if (currentBookingData && currentBookingData.selectedRoomDetails && currentBookingData.selectedRoomDetails.length > 0) {
                totalAmount = currentBookingData.selectedRoomDetails.reduce((sum, room) => {
                    return sum + (room.subtotalTotal || 0);
                }, 0);
            }
        }

        // Prepare billing data
        const billingData = {
            billingDate: new Date().toISOString(),
            totalAmount: totalAmount,
            isNoShowCharge: false, // Default to false for new bookings
            paymentStatus: paymentInfo.payLaterSelected ? 'Pending' : 'Paid',
            paymentMethod: billingPaymentMethodId, // Use valid payment method ID
            createdBy: bookingData.personalInfo?.emailAddress || 'online-booking',
            reservationId: parseInt(reservationId, 10)
        };

        console.log('Billing data to send:', billingData);

        const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/Billing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(billingData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;

            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || `Server error: ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            console.warn('Billing creation failed:', errorMessage);
            // Don't throw error - billing failure shouldn't block reservation confirmation
            return {
                success: false,
                message: errorMessage,
                data: null
            };
        }

        const result = await response.json();
        console.log('Billing API response:', result);
        console.log('Billing API response keys:', Object.keys(result));

        // Validate that we got a valid billing ID
        const billingId = result.data?.billingId || result.billingId || result.id;
        console.log('Extracted billing ID:', billingId, 'from response fields:', {
            resultDataBillingId: result.data?.billingId,
            resultBillingId: result.billingId,
            resultId: result.id,
            fullResult: result
        });

        // Ensure we have a valid billing ID
        if (!billingId || billingId === 'N/A') {
            console.warn('⚠️ No valid billing ID found in response, using fallback');
            // Don't fail the entire process, just log the issue
        }



        return {
            success: true,
            billing_id: billingId,
            message: result.message || 'Billing record created successfully',
            data: result
        };

    } catch (error) {
        console.error('Error creating billing record:', error);
        // Don't throw error - billing failure shouldn't block reservation confirmation
        return {
            success: false,
            message: error.message || 'Billing creation failed',
            data: { billingId: 'N/A' }
        };
    }
}

// Function to validate reservation data before sending to API
function validateReservationData(reservationData) {
    const errors = [];

    // Check required fields
    if (!reservationData.checkInDate || reservationData.checkInDate === 'Invalid Date') {
        errors.push('Invalid check-in date');
    }

    if (!reservationData.checkOutDate || reservationData.checkOutDate === 'Invalid Date') {
        errors.push('Invalid check-out date');
    }

    if (!reservationData.customer_Id || reservationData.customer_Id <= 0) {
        errors.push('Invalid customer ID');
    }

    if (reservationData.numberOfGuests <= 0) {
        errors.push('Number of guests must be greater than 0');
    }

    // Check suite/room selection
    if (reservationData.suite_id > 0 && reservationData.room_ID > 0) {
        errors.push('Cannot select both suite and room');
    }

    if (reservationData.suite_id <= 0 && reservationData.room_ID <= 0) {
        errors.push('Must select either a suite or a room');
    }

    // Validate date range
    if (reservationData.checkInDate && reservationData.checkOutDate) {
        const checkIn = new Date(reservationData.checkInDate);
        const checkOut = new Date(reservationData.checkOutDate);

        if (checkIn >= checkOut) {
            errors.push('Check-out date must be after check-in date');
        }

        // Check if dates are not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkIn < today) {
            errors.push('Check-in date cannot be in the past');
        }
    }

    return errors;
}

// Main function to handle booking confirmation
async function confirmBooking() {
    console.log('🚀 CONFIRM BOOKING FUNCTION CALLED - Starting API calls...');
    console.log('Current timestamp:', new Date().toISOString());
    console.log('Customer ID from localStorage:', localStorage.getItem('customerId'));
    console.log('Is authenticated:', localStorage.getItem('isAuthenticated'));

    try {
        // Get customer ID from authentication (user is already logged in)
        const customerId = localStorage.getItem('customerId');
        if (!customerId) {
            console.error('❌ No customer ID found in localStorage');
            showErrors(['Authentication error. Please sign in again.']);
            return;
        }

        console.log('✅ Customer authenticated with ID:', customerId);

        // Set the global customer ID
        savedCustomerId = customerId;

        // Collect booking data
        const urlParams = getUrlParams();
        const personalInfo = getPersonalInfo();
        const paymentInfo = getPaymentInfo();

        // Get dates and guest information from cached availability data
        const dateData = getDatesAndGuestsWithBackup();
        let { checkInDate, checkOutDate, numberOfGuests, isSuiteBooking, selectedSuiteId, selectedRoomId } = dateData;
        
        // First check if dates are already available from displaySelectedDates function
        if (window.selectedCheckInDate && window.selectedCheckOutDate && window.selectedNumberOfGuests) {
            checkInDate = window.selectedCheckInDate;
            checkOutDate = window.selectedCheckOutDate;
            numberOfGuests = window.selectedNumberOfGuests;
            console.log('Using dates from displaySelectedDates:', { checkInDate, checkOutDate, numberOfGuests });
        }
        
        // Get suite information for display
        let selectedSuiteName = '';
        const suiteBookingData = localStorage.getItem('suiteBookingData');
        if (suiteBookingData) {
            try {
                const parsed = JSON.parse(suiteBookingData);
                isSuiteBooking = parsed.bookingType === 'suite';
                if (isSuiteBooking && parsed.selectedSuite) {
                    // Try to get suite name from the suite data
                    const suites = JSON.parse(localStorage.getItem('availableSuites') || '[]');
                    const selectedSuite = suites.find(s => s.id === parsed.selectedSuite.id);
                    selectedSuiteName = selectedSuite ? selectedSuite.suiteName : 'Selected Suite';
                }
            } catch (e) {
                console.warn('Error parsing suite booking data:', e);
            }
        }
        
        // Additional validation for suite data
        if (isSuiteBooking && (!selectedSuiteId || selectedSuiteId <= 0)) {
            console.warn('Suite booking detected but no valid suite ID found. Attempting to extract from multiple sources...');
            
            // Try to get suite ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const urlSuiteId = urlParams.get('suiteId');
            if (urlSuiteId) {
                selectedSuiteId = parseInt(urlSuiteId, 10);
                console.log('Extracted suite ID from URL parameters:', selectedSuiteId);
            }
            
            // Try to get suite ID from localStorage suiteBookingData
            if (suiteBookingData && (!selectedSuiteId || selectedSuiteId <= 0)) {
                try {
                    const parsed = JSON.parse(suiteBookingData);
                    if (parsed.selectedSuite && parsed.selectedSuite.id) {
                        selectedSuiteId = parseInt(parsed.selectedSuite.id, 10);
                        console.log('Extracted suite ID from localStorage selectedSuite:', selectedSuiteId);
                    } else if (parsed.selectedData && parsed.selectedData.id) {
                        selectedSuiteId = parseInt(parsed.selectedData.id, 10);
                        console.log('Extracted suite ID from localStorage selectedData:', selectedSuiteId);
                    }
                } catch (e) {
                    console.warn('Error extracting suite ID from localStorage:', e);
                }
            }
            
            if (selectedSuiteId && selectedSuiteId > 0) {
                console.log('✅ Suite ID successfully extracted:', selectedSuiteId);
            } else {
                console.error('❌ Failed to extract valid suite ID from all sources');
            }
        }
        
        console.log('Final date values:', { checkInDate, checkOutDate, numberOfGuests, isSuiteBooking, selectedSuiteId, selectedRoomId });
        
        // Validate that we have valid dates
        if (!checkInDate || !checkOutDate) {
            showErrors(['Unable to retrieve check-in and check-out dates. Please go back to availability page and try again.']);
            return;
        }

        // Check payment method
        const method = paymentInfo.paymentMethod;
        const payLaterSelected = paymentInfo.payLaterSelected;
        const isCash = method === 'cash';
        const hasPayment = !payLaterSelected && !isCash && paymentInfo.hasValidCard;

        let isUnpaid = false;
        let savedCardId = 0;
        
        if (!hasPayment) {
            console.log('Proceeding with unpaid reservation');
            showPaymentWarningMessage();
            isUnpaid = true;
        } else {
            const paymentErrors = validatePaymentDetails(paymentInfo);
            if (paymentErrors.length > 0) {
                showErrors(paymentErrors);
                return;
            }
            
            // Save credit card if payment method is card
            try {
                const cardData = {
                    cardHolderName: paymentInfo.cardHolderName,
                    cardNumber: paymentInfo.cardNumber,
                    cardType: paymentInfo.cardType,
                    expiryMonth: paymentInfo.expiryMonth,
                    expiryYear: paymentInfo.expiryYear,
                    cvv: paymentInfo.cvc,
                    isDefault: true,
                    status: true,
                    customer_Id: parseInt(customerId, 10),
                    cardType_id: getCardTypeId(paymentInfo.cardType),
                    companyMaster_Id: 1 // Default company ID, adjust as needed
                };
                
                const cardResult = await saveCreditCard(cardData);
                savedCardId = cardResult.cardId;
                console.log('Credit card saved with ID:', savedCardId);
                
            } catch (cardError) {
                console.error('Failed to save credit card:', cardError);
                showErrors(['Failed to save credit card details. Please try again.']);
                return;
            }
        }

        // Get promocode and travel agency ID
        const promocode = getPromocode();
        const travelAgencyId = await getTravelAgencyId(promocode);

        // Get current booking data to access room details
        console.log('🔍 Getting current booking data...');
        const bookingData = getCurrentBookingData();
        console.log('📊 Retrieved booking data for room ID extraction:', bookingData);

        if (!bookingData) {
            console.error('❌ No booking data retrieved!');
            showErrors(['Unable to retrieve booking data. Please go back and select your rooms again.']);
            return;
        }

        console.log('✅ Booking data validation:', {
            hasCheckIn: !!bookingData.checkIn,
            hasCheckOut: !!bookingData.checkOut,
            hasRoomDetails: !!(bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0),
            roomCount: bookingData.selectedRoomDetails ? bookingData.selectedRoomDetails.length : 0,
            totalAmount: bookingData.totalAmount
        });

        // Ensure totalAmount is valid - recalculate if needed
        if (!bookingData.totalAmount || bookingData.totalAmount === 0) {
            if (bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
                const recalculatedTotal = bookingData.selectedRoomDetails.reduce((sum, room) => {
                    return sum + (room.subtotalTotal || 0);
                }, 0);
                bookingData.totalAmount = recalculatedTotal;
            }
        }

        // Prepare reservation data according to the new API format
        // Note: paymentCardDetails_Id field has been removed from the new API specification
        let suiteId = 0;
        let roomId = 0;

        if (isSuiteBooking) {
            // If it's a suite booking, set suite_id and default room_ID to 0
            suiteId = selectedSuiteId || 0;
            roomId = 0; // Default value when suite is provided
            console.log('Suite booking - Suite ID:', suiteId);
        } else {
            // If it's a room booking, try to get room ID from booking data
            if (bookingData && bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
                // Get the first room ID from the selected room details
                const firstRoom = bookingData.selectedRoomDetails[0];
                roomId = firstRoom.roomId || selectedRoomId || 0;
                console.log('Room booking - Room ID from booking data:', roomId, 'Room details:', firstRoom);
            } else {
                roomId = selectedRoomId || 0;
                console.log('Room booking - Room ID from URL/params:', roomId);
            }
            suiteId = 0; // Default value when room is provided
        }

        // Fix payment method values to be within valid range (1-10)
        let paymentMethodId = 1; // Default to card payment

        if (isUnpaid || isCash) {
            paymentMethodId = 2; // Use 2 for cash/unpaid payments
        } else if (paymentInfo.paymentMethod === 'card') {
            paymentMethodId = 1; // Use 1 for card payments
        }

        console.log('Payment method determination:', {
            isUnpaid,
            isCash,
            paymentMethod: paymentInfo.paymentMethod,
            payLaterSelected: paymentInfo.payLaterSelected,
            finalPaymentMethodId: paymentMethodId
        });

        const reservationData = {
            checkInDate: new Date(checkInDate).toISOString(),
            checkOutDate: new Date(checkOutDate).toISOString(),
            numberOfGuests: numberOfGuests,
            paymentMethodI_Id: paymentMethodId,
            createBy: personalInfo.emailAddress || 'online-booking',
            customer_Id: parseInt(savedCustomerId || customerId || '0', 10) || 0,
            status: (isUnpaid || isCash) ? 'Pending' : 'Confirmed',
            mealPlan_id: 0,
            suite_id: suiteId,
            room_ID: roomId,
            travalAgency_Id: travelAgencyId
        };

        // Validate reservation data before sending
        const validationErrors = validateReservationData(reservationData);
        if (validationErrors.length > 0) {
            showErrors(validationErrors);
            return;
        }

        console.log('=== BOOKING CONFIRMATION START ===');
        console.log('Processing reservation with data:', reservationData);
        console.log('URL Parameters:', urlParams);
        console.log('Personal Info:', personalInfo);
        console.log('Payment Info:', paymentInfo);
        console.log('Payment Method Details:', {
            isUnpaid,
            isCash,
            payLaterSelected: paymentInfo.payLaterSelected,
            paymentMethod: paymentInfo.paymentMethod,
            finalPaymentMethodId: reservationData.paymentMethodI_Id
        });
        console.log('Promocode:', promocode);
        console.log('Travel Agency ID:', travelAgencyId);
        console.log('Booking Type:', isSuiteBooking ? 'Suite' : 'Normal Room');
        console.log('Suite ID:', selectedSuiteId);
        console.log('Room ID:', selectedRoomId);
        console.log('Note: paymentCardDetails_Id not required in new API specification');

        showLoading(true);

        // Create reservation first
        console.log('🔄 MAKING API CALL: Creating reservation...');
        console.log('Reservation data being sent:', reservationData);
        const result = await sendCompleteBooking(reservationData);
        console.log('✅ Reservation API call completed');

        // Extract reservation ID from the response
        const reservationId = result.reservation_id || result.reservationId || result.id || 'DEFAULT_RESERVATION_ID';
        console.log('Reservation created successfully with ID:', reservationId);
        console.log('Full API response for debugging:', result);

        // Save the reservation ID to localStorage for confirmation page
        localStorage.setItem('lastReservationId', reservationId);
        localStorage.setItem('reservationTimestamp', Date.now().toString());
        console.log('Reservation ID saved to localStorage:', reservationId);

        // Create billing record after successful reservation
        console.log('🔄 MAKING API CALL: Creating billing record...');

        // Prepare billing data with the actual calculated total amount
        // Ensure we have the correct total amount from booking data
        let finalTotalAmount = bookingData.totalAmount;

        // If totalAmount is still 0, try to recalculate from room details
        if (!finalTotalAmount || finalTotalAmount === 0) {
            if (bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
                finalTotalAmount = bookingData.selectedRoomDetails.reduce((sum, room) => {
                    return sum + (room.subtotalTotal || 0);
                }, 0);
                console.log('Recalculated totalAmount for billing:', finalTotalAmount);
            }
        }

        const billingBookingData = {
            totalAmount: finalTotalAmount,
            personalInfo: personalInfo
        };

        let billingResult;
        try {
            billingResult = await createBillingRecord(reservationId, billingBookingData, paymentInfo);
            console.log('✅ Billing API call completed');
        } catch (billingError) {
            console.error('❌ Billing API call failed:', billingError);
            // Create a fallback billing result so we can still proceed
            billingResult = {
                success: false,
                message: 'Billing creation failed, but reservation was successful',
                data: { billingId: 'N/A' }
            };
        }


        console.log('✅ Reservation and billing API calls completed');
        console.log('Reservation ID:', reservationId);
        console.log('Billing result:', billingResult);
        console.log('Billing data:', billingResult.data);

        // Extract billing ID safely
        let billingId = 'N/A';

        if (billingResult && billingResult.success && billingResult.data) {
            billingId = billingResult.data.billingId || billingResult.data.id || 'N/A';
        } else if (billingResult && billingResult.billingId) {
            billingId = billingResult.billingId;
        }

        console.log('Final extracted Billing ID:', billingId);
        console.log('Billing result structure:', billingResult);

        // Proceed with navigation immediately after successful API calls
        console.log('🎉 Proceeding with navigation to confirmation page');

        // Store the IDs for confirmation page (only if valid)
        localStorage.setItem('lastReservationId', reservationId);

        if (billingId && billingId !== 'N/A' && billingId !== '-') {
            localStorage.setItem('lastBillingId', billingId.toString());
            sessionStorage.setItem('confirmationBillingId', billingId.toString());
            console.log('Stored valid billing ID:', billingId);

            // Also store the full billing data for fallback
            try {
                localStorage.setItem('lastBillingData', JSON.stringify(billingResult.data || billingResult));
                console.log('Stored full billing data for fallback');
            } catch (e) {
                console.warn('Could not store billing data:', e);
            }
        } else {
            console.warn('Not storing invalid billing ID:', billingId);
        }

        localStorage.setItem('bookingSuccessTimestamp', Date.now().toString());

        // Create URL parameters for confirmation page
        const confirmationParams = new URLSearchParams({
            bookingId: reservationId,  // This is the actual reservation ID from API
            reservationId: reservationId,  // Also pass as reservationId for clarity
            billingId: (billingId && billingId !== 'N/A' && billingId !== '-') ? billingId : '',  // Only pass valid billing ID
            checkIn: urlParams.checkIn,
            checkOut: urlParams.checkOut,
            totalAmount: urlParams.totalAmount,
            guests: urlParams.adults + urlParams.children,
            unpaid: (isUnpaid || isCash) ? '1' : '0'
        });

        // Ensure reservationId is also stored in sessionStorage as additional backup
        sessionStorage.setItem('confirmationReservationId', reservationId);

        // Show success confirmation modal (user must click OK to proceed)
        console.log('About to show success confirmation modal...');
        showBookingSuccessModal(reservationId, confirmationParams.toString());

    } catch (error) {
        showLoading(false);

        // Clear any partial data that might have been saved
        try {
            localStorage.removeItem('lastReservationId');
            localStorage.removeItem('lastBillingData');
            sessionStorage.removeItem('confirmationReservationId');
        } catch (cleanupError) {
            console.warn('Error during cleanup:', cleanupError);
        }
    }
}

// Function to setup form event listeners
function setupEventListeners() {
    // Handle confirm booking button click
    const confirmButton = document.getElementById('confirm-booking-btn');
    if (confirmButton) {
        confirmButton.addEventListener('click', function(e) {
            e.preventDefault();
            confirmBooking();
        });
    }

    // Pay later checkbox handler
    const payLaterCheckbox = document.getElementById('payLaterCheckbox');
    if (payLaterCheckbox) {
        payLaterCheckbox.addEventListener('change', function() {
            togglePaymentFields(this.checked);
            // If user unchecks pay-later, default to Card
            if (!this.checked) {
                const cardRadio = document.getElementById('payByCard');
                if (cardRadio) cardRadio.checked = true;
            }
        });
    }

    // Payment method radios
    const payByCard = document.getElementById('payByCard');
    const payByCash = document.getElementById('payByCash');
    if (payByCard) {
        payByCard.addEventListener('change', function() {
            if (this.checked) setPaymentMethodUI('card');
        });
    }
    if (payByCash) {
        payByCash.addEventListener('change', function() {
            if (this.checked) setPaymentMethodUI('cash');
        });
    }

    // Card input field event listeners
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
        });
        
        cardNumberInput.addEventListener('blur', function() {
            if (this.value.trim() && !validateCardNumber(this.value)) {
                this.setCustomValidity('Please enter a valid card number');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    const cvcInput = document.getElementById('cvc');
    if (cvcInput) {
        cvcInput.addEventListener('blur', function() {
            const cardType = document.getElementById('cardType').value;
            if (this.value.trim() && !validateCVV(this.value, cardType)) {
                this.setCustomValidity('Please enter a valid CVV');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    const expiryMonthInput = document.getElementById('expiryMonth');
    const expiryYearInput = document.getElementById('expiryYear');
    if (expiryMonthInput && expiryYearInput) {
        const validateExpiry = () => {
            if (expiryMonthInput.value && expiryYearInput.value) {
                if (!validateExpiryDate(parseInt(expiryMonthInput.value), parseInt(expiryYearInput.value))) {
                    expiryMonthInput.setCustomValidity('Expiry date cannot be in the past');
                    expiryYearInput.setCustomValidity('Expiry date cannot be in the past');
                } else {
                    expiryMonthInput.setCustomValidity('');
                    expiryYearInput.setCustomValidity('');
                }
            }
        };
        
        expiryMonthInput.addEventListener('change', validateExpiry);
        expiryYearInput.addEventListener('change', validateExpiry);
    }

    // Handle form submission for payment form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            confirmBooking();
        });
    }

    // Clear messages when user starts typing in any field
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const messages = document.querySelectorAll('.booking-message, .booking-error');
            messages.forEach(message => message.remove());
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateReservation();
    setupEventListeners();
    setupBookingPageCleanup();
    setupAccountHeader();
    
    // Immediately try to set reservation from localStorage
    setReservationFromLocalStorage();
    
    // Display selected dates from availability
    displaySelectedDates();
    
    // Load customer data if user is authenticated
    loadCustomerData();

    // Initialize payment UI visibility based on selected method
    try {
        const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'card';
        setPaymentMethodUI(selectedMethod);
    } catch (e) {
        // no-op
    }
});

// Setup browser close cleanup for booking page
function setupBookingPageCleanup() {
    // Add browser close detection specific to booking page
    window.addEventListener('beforeunload', (event) => {
        handleBookingPageCleanup();
    });

    // Use unload event as backup
    window.addEventListener('unload', () => {
        handleBookingPageCleanup();
    });

    // Use pagehide event for mobile browsers
    window.addEventListener('pagehide', (event) => {
        if (!event.persisted) {
            handleBookingPageCleanup();
        }
    });

    console.log('Booking page cleanup handlers setup');
}

// Handle cleanup when user closes browser on booking page
function handleBookingPageCleanup() {
    try {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (!isAuthenticated) {
            // User not authenticated, clear all data
            clearAllBookingData();
            console.log('Browser closing on booking page - user not authenticated, clearing all data');
        } else {
            // User authenticated, preserve auth but clear sensitive booking data
            clearSensitiveBookingData();
            console.log('Browser closing on booking page - user authenticated, clearing sensitive data only');
        }

        // Mark cleanup as completed
        sessionStorage.setItem('booking_cleanup_completed', 'true');

    } catch (error) {
        console.error('Error during booking page cleanup:', error);
    }
}

// Clear all booking-related data
function clearAllBookingData() {
    try {
        const allBookingKeys = [
            'hotelBookingData',
            'hotelBookingTimestamp',
            'selectedRoomDetails',
            'bookingSummary',
            'hotel_booking_cache',
            'redirect_after_login',
            'customerId',
            'userName',
            'isAuthenticated',
            'authTimestamp'
        ];

        allBookingKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear session storage
        sessionStorage.clear();

        console.log('All booking data cleared');
    } catch (error) {
        console.error('Error clearing all booking data:', error);
    }
}

// Clear only sensitive booking data, preserve authentication
function clearSensitiveBookingData() {
    try {
        const sensitiveKeys = [
            'hotelBookingData',
            'selectedRoomDetails',
            'bookingSummary'
        ];

        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear sensitive session storage items but keep auth-related ones
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
            if (key.includes('booking') || key.includes('room') || key.includes('hotel')) {
                sessionStorage.removeItem(key);
            }
        });

        console.log('Sensitive booking data cleared, authentication preserved');
    } catch (error) {
        console.error('Error clearing sensitive booking data:', error);
    }
}

// Setup account header functionality
function setupAccountHeader() {
    const customerId = localStorage.getItem('customerId');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userName = localStorage.getItem('userName');
    const customerFullName = localStorage.getItem('customerFullName');
    const customerEmail = localStorage.getItem('customerEmail');
    
    const accountDropdown = document.getElementById('accountDropdown');
    const signInButton = document.getElementById('signInButton');
    const signUpButton = document.getElementById('signUpButton');
    
    if (customerId && isAuthenticated === 'true') {
        // User is authenticated - show account dropdown
        if (accountDropdown) {
            accountDropdown.style.display = 'block';
            
            // Set customer name in dropdown
            const customerNameDisplay = document.getElementById('customerNameDisplay');
            const customerEmailDisplay = document.getElementById('customerEmailDisplay');
            
            if (customerNameDisplay) {
                // Use full name if available, otherwise use username
                customerNameDisplay.textContent = customerFullName || userName || 'Account';
            }
            
            if (customerEmailDisplay) {
                // Use customer email if available, otherwise use username
                customerEmailDisplay.textContent = customerEmail || userName || 'user@example.com';
            }
        }
        
        // Hide sign in/sign up buttons
        if (signInButton) signInButton.style.display = 'none';
        if (signUpButton) signUpButton.style.display = 'none';
        
    } else {
        // User is not authenticated - show sign in/sign up buttons
        if (accountDropdown) {
            accountDropdown.style.display = 'none';
        }
        
        if (signInButton) signInButton.style.display = 'block';
        if (signUpButton) signUpButton.style.display = 'block';
    }
}

// Update account header with fetched customer data
function updateAccountHeader(customerData) {
    if (!customerData) return;
    
    const customerNameDisplay = document.getElementById('customerNameDisplay');
    const customerEmailDisplay = document.getElementById('customerEmailDisplay');
    
    if (customerNameDisplay && customerData.firstName && customerData.lName) {
        customerNameDisplay.textContent = `${customerData.firstName} ${customerData.lName}`;
    }
    
    if (customerEmailDisplay && customerData.emailAddress) {
        customerEmailDisplay.textContent = customerData.emailAddress;
    }
}

// Show account information modal/alert
function showAccountInfo() {
    const customerId = localStorage.getItem('customerId');
    const userName = localStorage.getItem('userName');
    const authTimestamp = localStorage.getItem('authTimestamp');

    if (authTimestamp) {
        const loginDate = new Date(parseInt(authTimestamp)).toLocaleString();
        showModernAlert(`Account Information:\n\nCustomer ID: ${customerId}\nUsername: ${userName}\nLast Login: ${loginDate}`, 'info');
    } else {
        showModernAlert(`Account Information:\n\nCustomer ID: ${customerId}\nUsername: ${userName}`, 'info');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        // Clear all authentication and booking data
        localStorage.removeItem('customerId');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('customerFullName');
        localStorage.removeItem('customerEmail');
        
        // Clear booking data
        clearSensitiveBookingData();
        
        // Use DataCacheManager if available
        if (window.dataCacheManager) {
            window.dataCacheManager.forceCleanupAllData();
        }
        
        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// Add a cleanup button for manual cleanup (for testing/debugging)
function addManualCleanupButton() {
    // Only add in development/testing environment
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('test')) {
        const cleanupBtn = document.createElement('button');
        cleanupBtn.textContent = 'Clear All Cache (Dev)';
        cleanupBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 10px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        cleanupBtn.addEventListener('click', () => {
            if (confirm('Clear all cached data? This cannot be undone.')) {
                clearAllBookingData();
                if (window.dataCacheManager) {
                    window.dataCacheManager.forceCleanupAllData();
                }
                alert('All cached data cleared!');
                window.location.href = 'index.html';
            }
        });
        
        document.body.appendChild(cleanupBtn);
    }
}

// Updated load countries function
async function loadCountries() {
    try {
        // Fetch countries from your API
        const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/country');
        const data = await response.json();

        // Store countries data globally for later use
        countriesData = data.filter(country => country.status === 1); // Only active countries

        // Get country names and sort them
        const countryNames = countriesData
            .map(country => country.countryName)
            .sort();

        // Find your input field
        const countryInput = document.querySelector('input[placeholder="Country"]');

        // Make sure the input has an id for easier access
        if (!countryInput.id) {
            countryInput.id = 'country';
        }

        // Create datalist for autocomplete
        const existingDatalist = document.getElementById('countries');
        if (existingDatalist) {
            existingDatalist.remove();
        }

        const datalist = document.createElement('datalist');
        datalist.id = 'countries';

        // Add countries to datalist
        countryNames.forEach(countryName => {
            const option = document.createElement('option');
            option.value = countryName;
            datalist.appendChild(option);
        });

        // Connect datalist to input
        countryInput.setAttribute('list', 'countries');
        document.body.appendChild(datalist);

        // Add event listener to validate country selection
        countryInput.addEventListener('change', function() {
            const selectedCountryName = this.value.trim();
            const isValidCountry = countriesData.some(country => country.countryName === selectedCountryName);

            if (selectedCountryName && !isValidCountry) {
                this.setCustomValidity('Please select a valid country from the list');
            } else {
                this.setCustomValidity('');
            }
        });

        // Add input event listener for real-time validation
        countryInput.addEventListener('input', function() {
            const selectedCountryName = this.value.trim();
            if (selectedCountryName) {
                const isValidCountry = countriesData.some(country => country.countryName === selectedCountryName);
                if (!isValidCountry) {
                    this.setCustomValidity('Please select a valid country from the list');
                } else {
                    this.setCustomValidity('');
                }
            } else {
                this.setCustomValidity('');
            }
        });

        console.log('Countries loaded successfully:', countriesData.length, 'countries');

    } catch (error) {
        console.error('Failed to load countries:', error);
        // Error silently handled - country field will still work with manual input
    }
}

// Helper function to get country ID by name (optional - for debugging)
function getCountryIdByName(countryName) {
    const country = countriesData.find(c => c.countryName === countryName);
    return country ? country.countryId : null;
}

// Helper function to get country name by ID (optional - for debugging)
function getCountryNameById(countryId) {
    const country = countriesData.find(c => c.countryId === countryId);
    return country ? country.countryName : null;
}
// Call the function
loadCountries();

function togglePaymentFields(payLater) {
    const paymentSection = document.getElementById('payment-section');
    const fieldIds = ['cardType','cardNumber','cardHolderName','cvc','expiryMonth','expiryYear'];
    const methodRadios = document.querySelectorAll('input[name="payment_method"]');

    // Helper to get the visual container for a field (column div)
    function getFieldContainer(el) {
        if (!el) return null;
        // climb up to the nearest column or form-group
        let node = el.parentElement;
        while (node && node !== paymentSection) {
            if (node.classList && (node.classList.contains('col-md-6') || node.classList.contains('col-md-3') || node.classList.contains('form-group'))) {
                return node;
            }
            node = node.parentElement;
        }
        return null;
    }

    if (payLater) {
        // Hide card inputs and clear/disable values
        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.disabled = true;
                const container = getFieldContainer(el);
                if (container) container.style.display = 'none';
            }
        });
        methodRadios.forEach(r => { r.disabled = true; });
        if (paymentSection) paymentSection.classList.add('pay-later');
    } else {
        // Show/enable card inputs
        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.disabled = false;
                const container = getFieldContainer(el);
                if (container) container.style.display = '';
            }
        });
        methodRadios.forEach(r => { r.disabled = false; });
        if (paymentSection) paymentSection.classList.remove('pay-later');
    }
}

function setPaymentMethodUI(method) {
    const payLaterCheckbox = document.getElementById('payLaterCheckbox');
    const isCash = method === 'cash';
    if (payLaterCheckbox) {
        payLaterCheckbox.checked = isCash; // cash implies no card now
    }
    togglePaymentFields(isCash); // hide if cash
}

// Function to format card number with spaces
function formatCardNumber(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    input.value = formattedValue;
}

// Function to validate card number (Luhn algorithm)
function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Function to validate expiry date
function validateExpiryDate(month, year) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear) {
        return false;
    }
    
    if (year === currentYear && month < currentMonth) {
        return false;
    }
    
    return true;
}

// Function to validate CVV
function validateCVV(cvv, cardType) {
    const cleanCVV = cvv.replace(/\s+/g, '');
    
    if (cardType === 'amex') {
        return /^\d{4}$/.test(cleanCVV);
    } else {
        return /^\d{3}$/.test(cleanCVV);
    }
}

// Function to test API endpoints (for debugging)
async function testAPIEndpoints() {
    console.log('Testing API endpoints...');

    try {
        // Test credit card API
        console.log('Testing Credit Card API...');
        const testCardData = {
            cardHolderName: "Test User",
            cardNumber: "4111111111111111",
            cardType: "visa",
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: "123",
            isDefault: true,
            status: true,
            customer_Id: 1,
            cardType_id: 1,
            companyMaster_Id: 1
        };

        const cardResponse = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/CreditCard/insert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCardData)
        });

        console.log('Credit Card API Response Status:', cardResponse.status);
        if (cardResponse.ok) {
            const cardResult = await cardResponse.json();
            console.log('Credit Card API Success:', cardResult);
        } else {
            const errorText = await cardResponse.text();
            console.log('Credit Card API Error:', errorText);
        }

        // Test reservation API
        console.log('Testing Reservation API...');
        const testReservationData = {
            checkInDate: new Date().toISOString(),
            checkOutDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            numberOfGuests: 2,
            paymentMethodI_Id: 1,
            createBy: "test@example.com",
            customer_Id: 1,
            mealPlan_id: 0,
            suite_id: 0,
            room_ID: 1,
            travalAgency_Id: 0
        };

        const reservationResponse = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/Reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testReservationData)
        });

        console.log('Reservation API Response Status:', reservationResponse.status);
        if (reservationResponse.ok) {
            const reservationResult = await reservationResponse.json();
            console.log('Reservation API Success:', reservationResult);
        } else {
            const errorText = await reservationResponse.text();
            console.log('Reservation API Error:', errorText);
        }

        // Test billing API
        console.log('Testing Billing API...');
        const testBillingData = {
            billingDate: new Date().toISOString(),
            totalAmount: 10000,
            isNoShowCharge: false,
            paymentStatus: 'Paid',
            paymentMethod: 1,
            createdBy: 'test@example.com',
            reservationId: 1
        };

        const billingResponse = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/Billing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testBillingData)
        });

        console.log('Billing API Response Status:', billingResponse.status);
        if (billingResponse.ok) {
            const billingResult = await billingResponse.json();
            console.log('Billing API Success:', billingResult);
            console.log('Billing API response keys:', Object.keys(billingResult));
        } else {
            const errorText = await billingResponse.text();
            console.log('Billing API Error:', errorText);
        }

    } catch (error) {
        console.error('API Test Error:', error);
    }
}

// Function to display selected dates from availability
function displaySelectedDates() {
    try {
        let checkInDate, checkOutDate, adults, children;
        
        console.log('Starting date retrieval process using loadCachedRoomData logic...');
        
        // Use the same logic as loadCachedRoomData function
        // First try to get from hotelBookingData
        const hotelBookingData = localStorage.getItem('hotelBookingData');
        if (hotelBookingData) {
            try {
                const parsed = JSON.parse(hotelBookingData);
                console.log('Found hotelBookingData:', parsed);
                if (parsed.checkIn && parsed.checkOut) {
                    checkInDate = parsed.checkIn;
                    checkOutDate = parsed.checkOut;
                    adults = parsed.adults;
                    children = parsed.children;
                    console.log('Extracted from hotelBookingData:', { checkInDate, checkOutDate, adults, children });
                }
            } catch (e) {
                console.warn('Error parsing hotelBookingData:', e);
            }
        }
        
        // If not found, try selectedRoomDetails + availability cache (same logic as loadCachedRoomData)
        if (!checkInDate || !checkOutDate) {
            const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
            if (selectedRoomDetails) {
                try {
                    const roomDetails = JSON.parse(selectedRoomDetails);
                    console.log('Found selectedRoomDetails:', roomDetails);
                    
                    // Try to get availability data from DataCacheManager
                    if (window.dataCacheManager) {
                        const availability = window.dataCacheManager.getCache('availability');
                        if (availability) {
                            checkInDate = availability.checkIn;
                            checkOutDate = availability.checkOut;
                            adults = availability.adults;
                            children = availability.children;
                            console.log('Extracted from DataCacheManager availability:', { checkInDate, checkOutDate, adults, children });
                        }
                    }
                    
                    // If still no dates, try dataCacheManager_cache
                    if (!checkInDate || !checkOutDate) {
                        const cachedData = localStorage.getItem('dataCacheManager_cache');
                        if (cachedData) {
                            try {
                                const parsed = JSON.parse(cachedData);
                                if (parsed.availability) {
                                    checkInDate = parsed.availability.checkIn;
                                    checkOutDate = parsed.availability.checkOut;
                                    adults = parsed.availability.adults;
                                    children = parsed.availability.children;
                                    console.log('Extracted from dataCacheManager_cache:', { checkInDate, checkOutDate, adults, children });
                                }
                            } catch (e) {
                                console.warn('Error parsing dataCacheManager_cache:', e);
                            }
                        }
                    }
                    
                } catch (e) {
                    console.warn('Error parsing selectedRoomDetails:', e);
                }
            }
        }
        
        // Check if dates are already displayed in the reservation sidebar
        if (!checkInDate || !checkOutDate) {
            console.log('Attempting to extract dates from sidebar display...');
            const extractedDates = extractDatesFromSidebar();
            if (extractedDates) {
                checkInDate = extractedDates.checkInDate;
                checkOutDate = extractedDates.checkOutDate;
                numberOfGuests = extractedDates.numberOfGuests;
                console.log('Successfully extracted dates from sidebar');
            }
        }
        
        // Final fallback to URL parameters
        if (!checkInDate || !checkOutDate) {
            const urlParams = new URLSearchParams(window.location.search);
            checkInDate = urlParams.get('checkIn');
            checkOutDate = urlParams.get('checkOut');
            adults = urlParams.get('adults') || '0';
            children = urlParams.get('children') || '0';
            console.log('Using URL parameters as fallback:', { checkInDate, checkOutDate, adults, children });
        }
        
        // Display the dates if found
        if (checkInDate && checkOutDate) {
            console.log('Final date values for display:', { checkInDate, checkOutDate, adults, children });
            
            // Check if this is a suite booking
            const suiteBookingData = localStorage.getItem('suiteBookingData');
            let isSuiteBooking = false;
            let selectedSuiteName = '';
            
            if (suiteBookingData) {
                try {
                    const parsed = JSON.parse(suiteBookingData);
                    isSuiteBooking = parsed.bookingType === 'suite';
                    if (isSuiteBooking && parsed.selectedSuite) {
                        // Try to get suite name from the suite data
                        const suites = JSON.parse(localStorage.getItem('availableSuites') || '[]');
                        const selectedSuite = suites.find(s => s.id === parsed.selectedSuite.id);
                        selectedSuiteName = selectedSuite ? selectedSuite.suiteName : 'Selected Suite';
                    }
                } catch (e) {
                    console.warn('Error parsing suite booking data:', e);
                }
            }
            
            // Update the reservation display with the actual selected dates
            const checkInFormatted = formatDate(checkInDate);
            const checkOutFormatted = formatDate(checkOutDate);
            const nights = calculateNights(checkInDate, checkOutDate);
            const totalGuests = (parseInt(adults || 0, 10) + parseInt(children || 0, 10));
            
            console.log('Formatted dates:', { 
                checkInFormatted, 
                checkOutFormatted, 
                nights, 
                totalGuests,
                isSuiteBooking,
                selectedSuiteName
            });
            
            // Update the sidebar display
            if (document.getElementById('checkin-day')) {
                document.getElementById('checkin-day').textContent = checkInFormatted.day;
                document.getElementById('checkin-date').innerHTML = `${checkInFormatted.monthYear}<br>${checkInFormatted.weekday}`;
                console.log('Updated checkin-day and checkin-date elements');
            }
            
            if (document.getElementById('checkout-day')) {
                document.getElementById('checkout-day').textContent = checkOutFormatted.day;
                document.getElementById('checkout-date').innerHTML = `${checkOutFormatted.monthYear}<br>${checkOutFormatted.weekday}`;
            }
            
            if (document.getElementById('total-nights')) {
                document.getElementById('total-nights').textContent = nights;
                console.log('Updated total-nights element');
            }
            
            if (document.getElementById('total-guests')) {
                document.getElementById('total-guests').textContent = totalGuests;
                console.log('Updated total-guests element');
            }
            
            // Add a header showing the selected dates and booking type
            const existingHeader = document.querySelector('.selected-dates-header');
            if (!existingHeader) {
                const datesHeader = document.createElement('div');
                datesHeader.className = 'selected-dates-header';
                datesHeader.style.cssText = `
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border: 2px solid #2196f3;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 25px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(33, 150, 243, 0.1);
                    position: relative;
                    overflow: hidden;
                `;
                
                let headerContent = `
                    <h4 style="margin: 0 0 15px 0; color: #1976d2;">
                        <i class="fa fa-calendar" aria-hidden="true"></i> Your Selected Dates
                    </h4>
                    <p style="margin: 0; color: #333;">
                        <strong>Check-in:</strong> ${checkInFormatted.weekday}, ${checkInFormatted.monthYear} | 
                        <strong>Check-out:</strong> ${checkOutFormatted.weekday}, ${checkOutFormatted.monthYear} | 
                        <strong>Nights:</strong> ${nights} | 
                        <strong>Guests:</strong> ${totalGuests}
                    </p>
                `;
                
                // Add suite information if it's a suite booking
                if (isSuiteBooking && selectedSuiteName) {
                    headerContent += `
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
                            <strong style="color: #856404;">🏢 Suite Booking:</strong> ${selectedSuiteName}
                        </div>
                    `;
                } else if (isSuiteBooking) {
                    // Show suite booking but no suite name (might be an issue)
                    headerContent += `
                        <div style="margin-top: 15px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px;">
                            <strong style="color: #721c24;">⚠️ Suite Booking Detected</strong>
                            <p style="margin: 5px 0 0 0; font-size: 0.9em;">Suite selection issue detected. Please check console for details.</p>
                            <button onclick="debugSuiteBooking()" style="margin-top: 8px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                Debug Suite Data
                            </button>
                            <button onclick="fixSuiteBookingData()" style="margin-top: 8px; margin-left: 8px; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                Fix Suite Data
                            </button>
                        </div>
                    `;
                }
                
                datesHeader.innerHTML = headerContent;
                
                // Insert at the top of the booking content
                const bookingContent = document.querySelector('.booking-content');
                if (bookingContent) {
                    bookingContent.insertBefore(datesHeader, bookingContent.firstChild);
                    console.log('Added selected dates header');
                }
            }
            
            // Store the dates globally for use in reservation creation
            window.selectedCheckInDate = checkInDate;
            window.selectedCheckOutDate = checkOutDate;
            window.selectedNumberOfGuests = totalGuests;
            
            console.log('Dates stored globally:', {
                selectedCheckInDate: window.selectedCheckInDate,
                selectedCheckOutDate: window.selectedCheckOutDate,
                selectedNumberOfGuests: window.selectedNumberOfGuests
            });
            
        } else {
            console.warn('No dates found from any source');
            console.log('Available localStorage keys:', Object.keys(localStorage));
        }
        
    } catch (error) {
        console.error('Error displaying selected dates:', error);
    }
}

// Function to manually extract dates from the displayed reservation sidebar
function extractDatesFromSidebar() {
    try {
        const checkinDay = document.getElementById('checkin-day');
        const checkinDate = document.getElementById('checkin-date');
        const checkoutDay = document.getElementById('checkout-day');
        const checkoutDate = document.getElementById('checkout-date');
        const totalNights = document.getElementById('total-nights');
        const totalGuests = document.getElementById('total-guests');
        
        console.log('Sidebar elements found:', {
            checkinDay: checkinDay?.textContent,
            checkinDate: checkinDate?.textContent || checkinDate?.innerHTML,
            checkoutDay: checkoutDay?.textContent,
            checkoutDate: checkoutDate?.textContent || checkoutDate?.innerHTML,
            totalNights: totalNights?.textContent,
            totalGuests: totalGuests?.textContent
        });
        
        if (checkinDay && checkinDate && checkoutDay && checkoutDate) {
            const checkinText = checkinDate.textContent || checkinDate.innerHTML;
            const checkoutText = checkoutDate.textContent || checkoutDate.innerHTML;
            
            if (checkinText && checkoutText && checkinText !== '-' && checkoutText !== '-') {
                console.log('Extracting dates from sidebar text:', { checkinText, checkoutText });
                
                // Try to parse the displayed dates
                const today = new Date();
                const currentYear = today.getFullYear();
                
                // Extract month and day from the displayed text
                const checkinMatch = checkinText.match(/(\w+),\s*(\w+)\s+(\d+)/);
                const checkoutMatch = checkoutText.match(/(\w+),\s*(\w+)\s+(\d+)/);
                
                if (checkinMatch && checkoutMatch) {
                    const monthNames = {
                        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                    };
                    
                    const checkinMonth = monthNames[checkinMatch[2]];
                    const checkinDay = parseInt(checkinMatch[3]);
                    const checkoutMonth = monthNames[checkoutMatch[2]];
                    const checkoutDay = parseInt(checkoutMatch[3]);
                    
                    if (checkinMonth !== undefined && checkoutMonth !== undefined) {
                        // Create dates (assume current year)
                        const checkInDate = new Date(currentYear, checkinMonth, checkinDay);
                        const checkOutDate = new Date(currentYear, checkoutMonth, checkoutDay);
                        
                        // If check-out is before check-in, assume next year
                        if (checkOutDate <= checkInDate) {
                            checkOutDate.setFullYear(currentYear + 1);
                        }
                        
                        // Convert to ISO string format
                        const checkInISO = checkInDate.toISOString();
                        const checkOutISO = checkOutDate.toISOString();
                        
                        console.log('Successfully extracted dates:', { 
                            checkInISO, 
                            checkOutISO, 
                            checkInDate: checkInDate.toString(),
                            checkOutDate: checkOutDate.toString()
                        });
                        
                        // Store globally
                        window.selectedCheckInDate = checkInISO;
                        window.selectedCheckOutDate = checkOutISO;
                        window.selectedNumberOfGuests = parseInt(totalGuests?.textContent || '0', 10);
                        
                        return {
                            checkInDate: checkInISO,
                            checkOutDate: checkOutISO,
                            numberOfGuests: window.selectedNumberOfGuests
                        };
                    }
                }
            }
        }
        
        console.warn('Could not extract dates from sidebar');
        return null;
        
    } catch (error) {
        console.error('Error extracting dates from sidebar:', error);
        return null;
    }
}

// Function to inspect localStorage and show available data
function inspectLocalStorage() {
    console.log('=== LOCAL STORAGE INSPECTION ===');
    
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    // Check specific keys that might contain availability data
    const relevantKeys = [
        'dataCacheManager_cache',
        'hotelBookingData',
        'selectedRoomDetails',
        'checkIn',
        'checkOut',
        'adults',
        'children'
    ];
    
    relevantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            console.log(`\n--- ${key} ---`);
            try {
                const parsed = JSON.parse(value);
                console.log('Parsed value:', parsed);
                
                // If it's an object, look for date-related fields
                if (typeof parsed === 'object' && parsed !== null) {
                    const dateFields = ['checkIn', 'checkOut', 'checkInDate', 'checkOutDate'];
                    dateFields.forEach(field => {
                        if (parsed[field]) {
                            console.log(`${field}:`, parsed[field]);
                        }
                    });
                    
                    if (parsed.availability) {
                        console.log('availability sub-object:', parsed.availability);
                    }
                }
            } catch (e) {
                console.log('Raw value (not JSON):', value);
            }
        } else {
            console.log(`\n--- ${key} --- NOT FOUND`);
        }
    });
    
    console.log('\n=== END INSPECTION ===');
}

// Function to manually set reservation sidebar with dates from localStorage
function setReservationFromLocalStorage() {
    console.log('Attempting to set reservation from localStorage...');
    
    let checkInDate, checkOutDate, adults, children;
    
    // Try to get dates from localStorage using the same logic as loadCachedRoomData
    const hotelBookingData = localStorage.getItem('hotelBookingData');
    if (hotelBookingData) {
        try {
            const parsed = JSON.parse(hotelBookingData);
            console.log('Found hotelBookingData:', parsed);
            if (parsed.checkIn && parsed.checkOut) {
                checkInDate = parsed.checkIn;
                checkOutDate = parsed.checkOut;
                adults = parsed.adults;
                children = parsed.children;
                console.log('Extracted from hotelBookingData:', { checkInDate, checkOutDate, adults, children });
            }
        } catch (e) {
            console.warn('Error parsing hotelBookingData:', e);
        }
    }
    
    // If not found, try selectedRoomDetails + availability cache (same logic as loadCachedRoomData)
    if (!checkInDate || !checkOutDate) {
        const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
        if (selectedRoomDetails) {
            try {
                const roomDetails = JSON.parse(selectedRoomDetails);
                console.log('Found selectedRoomDetails:', roomDetails);
                
                // Try to get availability data from DataCacheManager
                if (window.dataCacheManager) {
                    const availability = window.dataCacheManager.getCache('availability');
                    if (availability) {
                        checkInDate = availability.checkIn;
                        checkOutDate = availability.checkOut;
                        adults = availability.adults;
                        children = availability.children;
                        console.log('Extracted from DataCacheManager availability:', { checkInDate, checkOutDate, adults, children });
                    }
                }
                
                // If still no dates, try dataCacheManager_cache
                if (!checkInDate || !checkOutDate) {
                    const cachedData = localStorage.getItem('dataCacheManager_cache');
                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            if (parsed.availability) {
                                checkInDate = parsed.availability.checkIn;
                                checkOutDate = parsed.availability.checkOut;
                                adults = parsed.availability.adults;
                                children = parsed.availability.children;
                                console.log('Extracted from dataCacheManager_cache:', { checkInDate, checkOutDate, adults, children });
                            }
                        } catch (e) {
                            console.warn('Error parsing dataCacheManager_cache:', e);
                        }
                    }
                }
                
            } catch (e) {
                console.warn('Error parsing selectedRoomDetails:', e);
            }
        }
    }
    
    // If dates found, update the sidebar using the same logic as updateReservationFromCache
    if (checkInDate && checkOutDate) {
        try {
            console.log('Dates found, updating reservation sidebar...');
            
            // Use the same formatting logic as updateReservationFromCache
            const checkInFormatted = formatDate(checkInDate);
            const checkOutFormatted = formatDate(checkOutDate);
            const nights = calculateNights(checkInDate, checkOutDate);
            const totalGuests = (parseInt(adults || 0, 10) + parseInt(children || 0, 10));
            
            console.log('Formatted dates for sidebar:', { 
                checkInFormatted, 
                checkOutFormatted, 
                nights, 
                totalGuests 
            });
            
            // Update the sidebar display using the same logic as updateReservationFromCache
            const checkinDayEl = document.getElementById('checkin-day');
            const checkinDateEl = document.getElementById('checkin-date');
            const checkoutDayEl = document.getElementById('checkout-day');
            const checkoutDateEl = document.getElementById('checkout-date');
            const totalNightsEl = document.getElementById('total-nights');
            const totalGuestsEl = document.getElementById('total-guests');
            
            if (checkinDayEl && checkinDateEl) {
                checkinDayEl.textContent = checkInFormatted.day;
                checkinDateEl.innerHTML = `${checkInFormatted.monthYear}<br>${checkInFormatted.weekday}`;
                console.log('Updated checkin elements');
            }
            
            if (checkoutDayEl && checkoutDateEl) {
                checkoutDayEl.textContent = checkOutFormatted.day;
                checkoutDateEl.innerHTML = `${checkOutFormatted.monthYear}<br>${checkOutFormatted.weekday}`;
                console.log('Updated checkout elements');
            }
            
            if (totalNightsEl) {
                totalNightsEl.textContent = nights;
                console.log('Updated total-nights element');
            }
            
            if (totalGuestsEl) {
                totalGuestsEl.textContent = totalGuests;
                console.log('Updated total-guests element');
            }
            
            // Store globally for reservation creation (same as updateReservationFromCache does)
            window.selectedCheckInDate = checkInDate;
            window.selectedCheckOutDate = checkOutDate;
            window.selectedNumberOfGuests = totalGuests;
            
            console.log('Successfully set reservation from localStorage using updateReservationFromCache logic');
            return true;
            
        } catch (error) {
            console.error('Error updating sidebar:', error);
            return false;
        }
    } else {
        console.warn('No dates found in localStorage using the same logic as loadCachedRoomData');
        return false;
    }
}

// Function to manually trigger reservation update using the same logic as updateReservation()
function manualUpdateReservation() {
    console.log('Manually triggering reservation update using updateReservation logic...');
    
    // First try to load from cached data (same as updateReservation)
    let hasCachedData = loadCachedRoomData();
    
    // If no cached data, try URL-embedded base64 minimal payload
    if (!hasCachedData) {
        try {
            const params = getUrlParams();
            if (params.bd) {
                const json = decodeURIComponent(escape(atob(params.bd)));
                const embedded = JSON.parse(json);
                console.log('Found embedded booking data:', embedded);
                // Render immediately
                updateReservationFromCache(embedded);
                // Persist to localStorage for subsequent steps
                try {
                    localStorage.setItem('hotelBookingData', JSON.stringify(embedded));
                    localStorage.setItem('selectedRoomDetails', JSON.stringify(embedded.selectedRoomDetails || []));
                    localStorage.setItem('hotelBookingTimestamp', Date.now().toString());
                } catch (e) {}
                hasCachedData = true;
            }
        } catch (e) {
            console.warn('Failed to parse embedded booking data (bd):', e);
        }
    }
    
    // If still no data, try cookie fallback
    if (!hasCachedData) {
        try {
            const cookieMatch = document.cookie.match(/(?:^|; )booking_cache=([^;]*)/);
            if (cookieMatch && cookieMatch[1]) {
                const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(cookieMatch[1])))));
                console.log('Found cookie booking data:', decoded);
                updateReservationFromCache(decoded);
                try {
                    localStorage.setItem('hotelBookingData', JSON.stringify(decoded));
                    localStorage.setItem('selectedRoomDetails', JSON.stringify(decoded.selectedRoomDetails || []));
                    localStorage.setItem('hotelBookingTimestamp', Date.now().toString());
                } catch (e) {}
                hasCachedData = true;
            }
        } catch (e) {
            console.warn('Failed to read booking_cache cookie:', e);
        }
    }
    
    if (!hasCachedData) {
        // Fallback to URL parameters
        const params = getUrlParams();
        console.log('Using URL parameters fallback:', params);
        updateReservationFromParams(params);
    }
    
    console.log('Manual reservation update completed. hasCachedData:', hasCachedData);
    return hasCachedData;
}

// Make functions available globally for debugging
window.extractDatesFromSidebar = extractDatesFromSidebar;
window.displaySelectedDates = displaySelectedDates;
window.testAPIEndpoints = testAPIEndpoints;
window.inspectLocalStorage = inspectLocalStorage;
window.setReservationFromLocalStorage = setReservationFromLocalStorage;
window.manualUpdateReservation = manualUpdateReservation;
window.getCurrentBookingData = getCurrentBookingData;
window.loadCachedRoomData = loadCachedRoomData;
window.debugBookingData = debugBookingData;
window.debugPaymentMethod = debugPaymentMethod;
window.debugSuccessModal = debugSuccessModal;

// Debug function to check booking data status
window.debugBookingData = function() {
    console.log('=== BOOKING DATA DEBUG ===');

    // Check localStorage
    const keys = ['hotelBookingData', 'selectedRoomDetails', 'suiteBookingData', 'dataCacheManager_cache'];
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
            console.log(`${key}: NOT FOUND`);
        }
    });

    // Test getCurrentBookingData
    console.log('Testing getCurrentBookingData():');
    const bookingData = getCurrentBookingData();
    console.log('Result:', bookingData);

    // Check reservation table
    const reservationTable = document.getElementById('reservation-details');
    if (reservationTable) {
        console.log('Reservation table rows:', reservationTable.children.length);
        Array.from(reservationTable.children).forEach((row, index) => {
            console.log(`Row ${index}:`, row.textContent);
        });
    } else {
        console.log('Reservation table not found');
    }

    console.log('=== END BOOKING DATA DEBUG ===');
};

// Debug function to check payment method logic
window.debugPaymentMethod = function() {
    console.log('=== PAYMENT METHOD DEBUG ===');

    // Get current payment info
    const paymentInfo = getPaymentInfo();
    console.log('Current payment info:', paymentInfo);

    // Check payment method determination logic
    const isUnpaid = !paymentInfo.hasValidCard && !paymentInfo.payLaterSelected;
    const isCash = paymentInfo.paymentMethod === 'cash';

    console.log('Payment method determination:', {
        isUnpaid,
        isCash,
        payLaterSelected: paymentInfo.payLaterSelected,
        paymentMethod: paymentInfo.paymentMethod,
        hasValidCard: paymentInfo.hasValidCard
    });

    // Show what payment method ID would be used
    let paymentMethodId = 1; // Default to card payment
    if (isUnpaid || isCash) {
        paymentMethodId = 2; // Use 2 for cash/unpaid payments
    } else if (paymentInfo.paymentMethod === 'card') {
        paymentMethodId = 1; // Use 1 for card payments
    }

    console.log('Final payment method ID that would be sent:', paymentMethodId);
    console.log('Valid range: 1-10 (API requirement)');

    console.log('=== END PAYMENT METHOD DEBUG ===');
};

// Debug function to check success modal and navigation
window.debugSuccessModal = function() {
    console.log('=== SUCCESS MODAL & NAVIGATION DEBUG ===');

    // Check if success modal exists
    const modal = document.getElementById('booking-success-modal');
    console.log('Success modal exists:', !!modal);

    if (modal) {
        console.log('Modal is visible:', modal.style.display !== 'none');
        const viewButton = document.getElementById('view-confirmation-btn');
        console.log('View confirmation button exists:', !!viewButton);
        console.log('View confirmation button text:', viewButton?.textContent);
    }

    // Check stored IDs
    console.log('Stored reservation ID:', localStorage.getItem('lastReservationId'));
    console.log('Stored billing ID:', localStorage.getItem('lastBillingId'));
    console.log('Booking success timestamp:', localStorage.getItem('bookingSuccessTimestamp'));

    // Check URL parameters that would be passed
    const reservationId = localStorage.getItem('lastReservationId');
    const billingId = localStorage.getItem('lastBillingId');

    if (reservationId && billingId) {
        const confirmationParams = new URLSearchParams({
            bookingId: reservationId,
            reservationId: reservationId,
            billingId: billingId,
            checkIn: 'test-checkin',
            checkOut: 'test-checkout',
            totalAmount: '10000',
            guests: '2',
            unpaid: '0'
        });

        console.log('Confirmation URL that would be generated:', `confirmation.html?${confirmationParams.toString()}`);
    } else {
        console.log('Missing required IDs for navigation');
    }

    console.log('=== END SUCCESS MODAL & NAVIGATION DEBUG ===');
};


// Function to handle booking confirmation
function handleBookingConfirmation() {
    console.log('=== BOOKING CONFIRMATION STARTED ===');

    try {
        // Get current booking data from the page
        const bookingData = getCurrentBookingData();

        if (!bookingData) {
            alert('No booking data found. Please complete your booking details first.');
            return;
        }

        // Get customer data from form
        const customerData = getPersonalInfo();

        if (!customerData.firstName || !customerData.emailAddress) {
            alert('Please fill in your personal information before confirming booking.');
            return;
        }

        // Validate payment information if not paying later
        const paymentInfo = getPaymentInfo();
        const payLaterSelected = document.getElementById('payLaterCheckbox')?.checked;

        if (!payLaterSelected && !paymentInfo.hasValidCard) {
            alert('Please provide valid payment information or select "Pay later" option.');
            return;
        }

        // Save booking data to localStorage with complete room details
        const bookingDataToSave = {
            ...bookingData,
            selectedRoomDetails: bookingData.selectedRoomDetails || [],
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            numberOfNights: bookingData.numberOfNights,
            totalGuests: bookingData.totalGuests,
            totalAmount: bookingData.totalAmount
        };

        localStorage.setItem('hotelBookingData', JSON.stringify(bookingDataToSave));
        localStorage.setItem('selectedRoomDetails', JSON.stringify(bookingData.selectedRoomDetails || []));
        localStorage.setItem('bookingTimestamp', Date.now().toString());

        console.log('Complete booking data saved to localStorage:', bookingDataToSave);

        // Verify that room details are properly saved
        if (bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
            const hasRoomIds = bookingData.selectedRoomDetails.some(room => room.roomId && room.roomId > 0);
            console.log('Room details verification:', {
                totalRooms: bookingData.selectedRoomDetails.length,
                hasRoomIds: hasRoomIds,
                roomDetails: bookingData.selectedRoomDetails
            });

            if (!hasRoomIds) {
                console.warn('⚠️ WARNING: Room details saved but no room IDs found!');
                console.warn('This may cause issues with the reservation API call.');
            }
        } else {
            console.warn('⚠️ WARNING: No room details found in booking data!');
        }

        // Save customer data to localStorage
        localStorage.setItem('customerFullName', `${customerData.firstName} ${customerData.lastName || ''}`.trim());
        localStorage.setItem('customerEmail', customerData.emailAddress);
        localStorage.setItem('phone', customerData.phone);
        localStorage.setItem('address', customerData.address);

        // Also save using the booking data manager if available
        if (window.bookingDataManager) {
            window.bookingDataManager.saveData(bookingData);
            window.bookingDataManager.saveCustomerData({
                name: `${customerData.firstName} ${customerData.lastName || ''}`.trim(),
                email: customerData.emailAddress,
                phone: customerData.phone,
                address: customerData.address
            });
        }

        console.log('Booking data saved:', bookingData);
        console.log('Customer data saved:', customerData);

        // Show success message
        alert('Booking confirmed successfully! Redirecting to confirmation page...');

        // Create confirmation URL with booking ID
        const confirmationParams = new URLSearchParams({
            bookingId: `BK${Date.now()}`,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            totalAmount: bookingData.totalAmount,
            guests: bookingData.totalGuests,
            unpaid: payLaterSelected ? '1' : '0'
        });

        // Redirect to confirmation page
        const confirmationUrl = `confirmation.html?${confirmationParams.toString()}`;
        console.log('Redirecting to:', confirmationUrl);
        window.location.href = confirmationUrl;

    } catch (error) {
        console.error('Error during booking confirmation:', error);
        alert('Error confirming booking. Please try again.');
    }
}

// Function to get personal information from the booking form
function getPersonalInfo() {
    try {
        return {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            emailAddress: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            address: document.getElementById('address')?.value || ''
        };
    } catch (error) {
        console.error('Error getting personal info:', error);
        return {};
    }
}

// Function to get current booking data for confirmation
function getCurrentBookingData() {
    try {
        console.log('=== GETTING CURRENT BOOKING DATA ===');

        // Priority 1: Try to load from cached room data (this should have the complete room details with IDs)
        let bookingData = loadCachedRoomData();

        // If cached data exists and has room details with IDs, use it
        if (bookingData && bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.length > 0) {
            // Check if room details have IDs
            const hasRoomIds = bookingData.selectedRoomDetails.some(room => room.roomId && room.roomId > 0);
            if (hasRoomIds) {
                console.log('✅ Using cached booking data with room IDs:', bookingData);
                return bookingData;
            } else {
                console.log('⚠️ Cached data exists but missing room IDs, will try to enhance...');
            }
        }

        // Priority 2: Try to get data from localStorage directly
        const hotelBookingData = localStorage.getItem('hotelBookingData');
        const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');

        if (hotelBookingData) {
            try {
                bookingData = JSON.parse(hotelBookingData);
                console.log('Found hotelBookingData in localStorage:', bookingData);

                // Try to merge with room details if available
                if (selectedRoomDetails) {
                    try {
                        const roomDetails = JSON.parse(selectedRoomDetails);
                        if (roomDetails && roomDetails.length > 0) {
                            bookingData.selectedRoomDetails = roomDetails;
                            console.log('✅ Enhanced booking data with room details from localStorage');
                        }
                    } catch (roomError) {
                        console.warn('Could not parse room details from localStorage:', roomError);
                    }
                }

                // Check if we now have room IDs
                const hasRoomIds = bookingData.selectedRoomDetails && bookingData.selectedRoomDetails.some(room => room.roomId && room.roomId > 0);
                if (hasRoomIds) {
                    console.log('✅ Booking data with room IDs ready:', bookingData);
                    return bookingData;
                }
            } catch (parseError) {
                console.warn('Could not parse hotelBookingData:', parseError);
            }
        }

        // Priority 3: Try to reconstruct from current page data as fallback
        console.log('⚠️ No cached data with room IDs found, reconstructing from page...');
        const checkIn = document.getElementById('checkin-day')?.textContent;
        const checkOut = document.getElementById('checkout-day')?.textContent;
        const nights = document.getElementById('total-nights')?.textContent;
        const guests = document.getElementById('total-guests')?.textContent;
        const totalAmount = document.getElementById('total-amount')?.textContent;

        if (checkIn && checkOut) {
            // Get room details from reservation table
            const roomRows = document.querySelectorAll('#reservation-details tr');
            const selectedRoomDetails = [];

            roomRows.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const description = cells[0].textContent;
                    const amountText = cells[1].textContent;

                    // Parse amount (remove LKR and commas)
                    const amount = parseFloat(amountText.replace('LKR', '').replace(/,/g, '').trim());

                    // Try to extract room info from description
                    const roomMatch = description.match(/(\d+)\s+(.+?)\s+x\s+(\d+)/);
                    let roomData = null;

                    if (roomMatch) {
                        const quantity = parseInt(roomMatch[1]);
                        const roomType = roomMatch[2];
                        const nights = parseInt(roomMatch[3]);

                        roomData = {
                            roomType: roomType,
                            quantity: quantity,
                            pricePerNight: Math.round(amount / (quantity * nights)),
                            subtotalTotal: amount,
                            numberOfNights: nights,
                            roomId: null // Will try to populate from cache
                        };
                    } else {
                        // Fallback for simple room booking
                        roomData = {
                            roomType: description,
                            quantity: 1,
                            pricePerNight: Math.round(amount / parseInt(nights || 1)),
                            subtotalTotal: amount,
                            numberOfNights: parseInt(nights || 1),
                            roomId: null // Will try to populate from cache
                        };
                    }

                    selectedRoomDetails.push(roomData);
                }
            });

            bookingData = {
                checkIn: checkIn,
                checkOut: checkOut,
                numberOfNights: parseInt(nights || 1),
                totalGuests: parseInt(guests || 1),
                totalAmount: parseFloat(totalAmount?.replace('LKR', '').replace(/,/g, '').trim() || 0),
                selectedRoomDetails: selectedRoomDetails
            };

            console.log('Reconstructed booking data from page:', bookingData);
        }

        // Priority 4: Try to enhance the booking data with cached room details that include IDs
        if (bookingData && bookingData.selectedRoomDetails) {
            try {
                const cachedRoomDetails = localStorage.getItem('selectedRoomDetails');
                if (cachedRoomDetails) {
                    const parsedRoomDetails = JSON.parse(cachedRoomDetails);
                    if (parsedRoomDetails && parsedRoomDetails.length > 0) {
                        console.log('Found cached room details with IDs:', parsedRoomDetails);

                        // Merge room IDs from cached data into the reconstructed data
                        bookingData.selectedRoomDetails = bookingData.selectedRoomDetails.map((room, index) => {
                            const cachedRoom = parsedRoomDetails[index];
                            if (cachedRoom) {
                                return {
                                    ...room,
                                    roomId: cachedRoom.roomId || room.roomId,
                                    roomType: cachedRoom.roomType || room.roomType,
                                    quantity: cachedRoom.quantity || room.quantity,
                                    pricePerNight: cachedRoom.pricePerNight || room.pricePerNight
                                };
                            }
                            return room;
                        });

                        console.log('✅ Enhanced booking data with room IDs from cache:', bookingData);
                    }
                } else {
                    console.warn('❌ No cached room details found to enhance booking data');
                }
            } catch (cacheError) {
                console.warn('Could not enhance booking data with cached room details:', cacheError);
            }
        }

        // Final check - if we still don't have room IDs, log a warning
        if (bookingData && bookingData.selectedRoomDetails) {
            const hasRoomIds = bookingData.selectedRoomDetails.some(room => room.roomId && room.roomId > 0);
            if (!hasRoomIds) {
                console.warn('⚠️ WARNING: Booking data reconstructed but no room IDs found!');
                console.warn('This may cause issues with the reservation API call.');
                console.log('Room details:', bookingData.selectedRoomDetails);
            }
        }

        console.log('=== END GETTING CURRENT BOOKING DATA ===');
        return bookingData;

    } catch (error) {
        console.error('Error getting current booking data:', error);
        return null;
    }
}

// Page load event handler to ensure data persistence
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page loaded - initializing data persistence...');

    // Load and preserve all cached booking data
    loadAndPreserveCachedData();

    // Set up the reservation display
    setReservationFromLocalStorage();

    // Display selected dates
    displaySelectedDates();

    // Add booking confirmation event listener
    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
        // Remove any existing event listeners first
        confirmBtn.removeEventListener('click', handleBookingConfirmation);
        confirmBtn.removeEventListener('click', confirmBooking);

        // Add the correct event listener
        confirmBtn.addEventListener('click', confirmBooking);
        console.log('✅ Booking confirmation button event listener added - using confirmBooking function');

        // Verify the button is properly configured
        console.log('Confirm button details:', {
            exists: true,
            text: confirmBtn.textContent,
            disabled: confirmBtn.disabled,
            hasClickListener: true
        });
    } else {
        console.warn('❌ Booking confirmation button not found');
    }

    // Ensure data is displayed after a short delay (in case of timing issues)
    setTimeout(() => {
        ensureDataDisplay();
    }, 1000);
});

// Function to ensure booking data is displayed correctly
function ensureDataDisplay() {
    console.log('Ensuring booking data is displayed...');

    // Check if reservation table has data
    const reservationTable = document.getElementById('reservation-details');
    if (reservationTable && reservationTable.children.length === 0) {
        console.log('Reservation table is empty, trying to populate it...');

        // Try to load data using the booking data manager
        if (window.bookingDataManager && window.bookingDataManager.hasData()) {
            const data = window.bookingDataManager.getData();
            console.log('Found data in booking data manager:', data);
            updateReservationFromCache(data);
        } else {
            // Try the existing methods
            const hasData = loadCachedRoomData();
            if (!hasData) {
                console.log('No cached data found, trying manual update...');
                manualUpdateReservation();
            }
        }
    }

    // Check if dates are displayed
    const checkinDay = document.getElementById('checkin-day');
    const checkoutDay = document.getElementById('checkout-day');
    if (checkinDay && (!checkinDay.textContent || checkinDay.textContent === '-')) {
        console.log('Dates not displayed, trying to display them...');
        displaySelectedDates();
    }

    // Debug the current state
    debugCurrentState();
}

// Function to debug current state
function debugCurrentState() {
    console.log('=== CURRENT BOOKING PAGE STATE ===');

    const elements = {
        checkinDay: document.getElementById('checkin-day'),
        checkinDate: document.getElementById('checkin-date'),
        checkoutDay: document.getElementById('checkout-day'),
        checkoutDate: document.getElementById('checkout-date'),
        totalNights: document.getElementById('total-nights'),
        totalGuests: document.getElementById('total-guests'),
        totalAmount: document.getElementById('total-amount'),
        reservationDetails: document.getElementById('reservation-details')
    };

    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            if (key === 'reservationDetails') {
                console.log(`${key}: ${element.children.length} rows`);
            } else {
                console.log(`${key}: "${element.textContent || element.innerHTML}"`);
            }
        } else {
            console.log(`${key}: NOT FOUND`);
        }
    });

    // Check localStorage
    const bookingData = localStorage.getItem('hotelBookingData');
    const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
    console.log('hotelBookingData exists:', !!bookingData);
    console.log('selectedRoomDetails exists:', !!selectedRoomDetails);

    console.log('=== END CURRENT STATE ===');
}

// Function to load and preserve all cached booking data
function loadAndPreserveCachedData() {
    try {
        console.log('=== LOADING AND PRESERVING CACHED DATA ===');
        
        // Get all possible data sources
        const suiteBookingData = localStorage.getItem('suiteBookingData');
        const hotelBookingData = localStorage.getItem('hotelBookingData');
        const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
        const dataCacheManager_cache = localStorage.getItem('dataCacheManager_cache');
        const urlParams = new URLSearchParams(window.location.search);
        
        console.log('Available data sources:', {
            suiteBookingData: suiteBookingData ? 'EXISTS' : 'NOT FOUND',
            hotelBookingData: hotelBookingData ? 'EXISTS' : 'NOT FOUND',
            selectedRoomDetails: selectedRoomDetails ? 'EXISTS' : 'NOT FOUND',
            dataCacheManager_cache: dataCacheManager_cache ? 'EXISTS' : 'NOT FOUND',
            urlParams: Object.fromEntries(urlParams.entries())
        });
        
        // Create a comprehensive data backup
        const dataBackup = {
            suiteBookingData: suiteBookingData ? JSON.parse(suiteBookingData) : null,
            hotelBookingData: hotelBookingData ? JSON.parse(hotelBookingData) : null,
            selectedRoomDetails: selectedRoomDetails ? JSON.parse(selectedRoomDetails) : null,
            dataCacheManager_cache: dataCacheManager_cache ? JSON.parse(dataCacheManager_cache) : null,
            urlParams: Object.fromEntries(urlParams.entries()),
            timestamp: Date.now(),
            page: 'booking.html'
        };
        
        // Save comprehensive backup
        localStorage.setItem('bookingDataBackup', JSON.stringify(dataBackup));
        console.log('Comprehensive data backup saved:', dataBackup);
        
        // Ensure critical data is preserved in multiple locations
        if (suiteBookingData) {
            const suiteData = JSON.parse(suiteBookingData);
            if (suiteData.checkIn && suiteData.checkOut) {
                // Also save to hotelBookingData for compatibility
                localStorage.setItem('hotelBookingData', JSON.stringify({
                    checkIn: suiteData.checkIn,
                    checkOut: suiteData.checkOut,
                    adults: suiteData.adults,
                    children: suiteData.children,
                    promocode: suiteData.promocode,
                    bookingType: 'suite',
                    days: suiteData.days,
                    timestamp: Date.now()
                }));
                console.log('Suite data also saved to hotelBookingData for compatibility');
            }
        }
        
        // Log final state
        console.log('Final localStorage state:', {
            suiteBookingData: localStorage.getItem('suiteBookingData'),
            hotelBookingData: localStorage.getItem('hotelBookingData'),
            selectedRoomDetails: localStorage.getItem('selectedRoomDetails'),
            dataCacheManager_cache: localStorage.getItem('dataCacheManager_cache'),
            bookingDataBackup: localStorage.getItem('bookingDataBackup')
        });
        
        console.log('=== DATA PERSISTENCE COMPLETE ===');
        
    } catch (error) {
        console.error('Error in loadAndPreserveCachedData:', error);
    }
}

// Function to restore data from backup if needed
function restoreDataFromBackup() {
    try {
        const backup = localStorage.getItem('bookingDataBackup');
        if (!backup) {
            console.log('No backup data available');
            return false;
        }
        
        const backupData = JSON.parse(backup);
        console.log('Found backup data:', backupData);
        
        // Check if any critical data is missing and restore from backup
        let restored = false;
        
        if (!localStorage.getItem('suiteBookingData') && backupData.suiteBookingData) {
            localStorage.setItem('suiteBookingData', JSON.stringify(backupData.suiteBookingData));
            console.log('Restored suiteBookingData from backup');
            restored = true;
        }
        
        if (!localStorage.getItem('hotelBookingData') && backupData.hotelBookingData) {
            localStorage.setItem('hotelBookingData', JSON.stringify(backupData.hotelBookingData));
            console.log('Restored hotelBookingData from backup');
            restored = true;
        }
        
        if (!localStorage.getItem('selectedRoomDetails') && backupData.selectedRoomDetails) {
            localStorage.setItem('selectedRoomDetails', JSON.stringify(backupData.selectedRoomDetails));
            console.log('Restored selectedRoomDetails from backup');
            restored = true;
        }
        
        if (!localStorage.getItem('dataCacheManager_cache') && backupData.dataCacheManager_cache) {
            localStorage.setItem('dataCacheManager_cache', JSON.stringify(backupData.dataCacheManager_cache));
            console.log('Restored dataCacheManager_cache from backup');
            restored = true;
        }
        
        if (restored) {
            console.log('Data restoration completed');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error restoring data from backup:', error);
        return false;
    }
}

// Enhanced function to get dates and guest information with backup restoration
function getDatesAndGuestsWithBackup() {
    let checkInDate, checkOutDate, numberOfGuests;
    let isSuiteBooking = false;
    let selectedSuiteId = 0;
    let selectedRoomId = 0;
    
    try {
        // First try to restore from backup if main data is missing
        const hasBackup = restoreDataFromBackup();
        if (hasBackup) {
            console.log('Data restored from backup, retrying data retrieval...');
        }
        
        // Check for suite booking data first
        const suiteBookingData = localStorage.getItem('suiteBookingData');
        if (suiteBookingData) {
            try {
                const parsed = JSON.parse(suiteBookingData);
                console.log('Found suite booking data:', parsed);
                
                if (parsed.checkIn && parsed.checkOut) {
                    checkInDate = parsed.checkIn;
                    checkOutDate = parsed.checkOut;
                    numberOfGuests = (parseInt(parsed.adults || 0, 10) + parseInt(parsed.children || 0, 10));
                    isSuiteBooking = parsed.bookingType === 'suite';
                    
                    if (isSuiteBooking && parsed.selectedSuite) {
                        selectedSuiteId = parseInt(parsed.selectedSuite.id, 10);
                        console.log('Suite booking detected with ID:', selectedSuiteId);
                        console.log('Selected suite details:', parsed.selectedSuite);
                    } else if (isSuiteBooking && parsed.selectedData) {
                        // Alternative suite data structure
                        selectedSuiteId = parseInt(parsed.selectedData.id, 10);
                        console.log('Suite booking detected with selectedData ID:', selectedSuiteId);
                        console.log('Selected suite details from selectedData:', parsed.selectedData);
                    } else if (isSuiteBooking) {
                        console.warn('Suite booking detected but no suite ID found in data:', parsed);
                    }
                    
                    console.log('Extracted from suite booking data:', { 
                        checkInDate, 
                        checkOutDate, 
                        numberOfGuests, 
                        isSuiteBooking, 
                        selectedSuiteId,
                        parsedSelectedSuite: parsed.selectedSuite,
                        parsedSelectedData: parsed.selectedData
                    });
                }
            } catch (e) {
                console.warn('Error parsing suite booking data:', e);
            }
        }
        
        // If no suite data, try normal booking data
        if (!checkInDate || !checkOutDate) {
            // Try hotelBookingData
            const hotelBookingData = localStorage.getItem('hotelBookingData');
            if (hotelBookingData) {
                try {
                    const parsed = JSON.parse(hotelBookingData);
                    console.log('Found hotelBookingData:', parsed);
                    if (parsed.checkIn && parsed.checkOut) {
                        checkInDate = parsed.checkIn;
                        checkOutDate = parsed.checkOut;
                        numberOfGuests = (parseInt(parsed.adults || 0, 10) + parseInt(parsed.children || 0, 10));
                        isSuiteBooking = false;
                        
                        // Try to get room ID from selectedRoomDetails
                        const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
                        if (selectedRoomDetails) {
                            try {
                                const roomDetails = JSON.parse(selectedRoomDetails);
                                if (roomDetails && roomDetails.length > 0) {
                                    selectedRoomId = parseInt(roomDetails[0].roomId, 10);
                                    console.log('Room ID extracted:', selectedRoomId);
                                }
                            } catch (e) {
                                console.warn('Error parsing room details:', e);
                            }
                        }
                        
                        console.log('Extracted from hotelBookingData:', { 
                            checkInDate, 
                            checkOutDate, 
                            numberOfGuests, 
                            isSuiteBooking, 
                            selectedRoomId 
                        });
                    }
                } catch (e) {
                    console.warn('Error parsing hotelBookingData:', e);
                }
            }
            
            // Try other data sources
            if (!checkInDate || !checkOutDate) {
                const selectedRoomDetails = localStorage.getItem('selectedRoomDetails');
                if (selectedRoomDetails) {
                    try {
                        const roomDetails = JSON.parse(selectedRoomDetails);
                        console.log('Found selectedRoomDetails:', roomDetails);
                        
                        // Try DataCacheManager
                        if (window.dataCacheManager) {
                            const availability = window.dataCacheManager.getCache('availability');
                            if (availability) {
                                checkInDate = availability.checkIn;
                                checkOutDate = availability.checkOut;
                                numberOfGuests = (parseInt(availability.adults || 0, 10) + parseInt(availability.children || 0, 10));
                                isSuiteBooking = false;
                                
                                if (roomDetails && roomDetails.length > 0) {
                                    selectedRoomId = parseInt(roomDetails[0].roomId, 10);
                                }
                                
                                console.log('Extracted from DataCacheManager:', { 
                                    checkInDate, 
                                    checkOutDate, 
                                    numberOfGuests, 
                                    isSuiteBooking, 
                                    selectedRoomId 
                                });
                            }
                        }
                        
                        // Try dataCacheManager_cache
                        if (!checkInDate || !checkOutDate) {
                            const cachedData = localStorage.getItem('dataCacheManager_cache');
                            if (cachedData) {
                                try {
                                    const parsed = JSON.parse(cachedData);
                                    if (parsed.availability) {
                                        checkInDate = parsed.availability.checkIn;
                                        checkOutDate = parsed.availability.checkOut;
                                        numberOfGuests = (parseInt(parsed.availability.adults || 0, 10) + parseInt(parsed.availability.children || 0, 10));
                                        isSuiteBooking = false;
                                        
                                        if (roomDetails && roomDetails.length > 0) {
                                            selectedRoomId = parseInt(roomDetails[0].roomId, 10);
                                        }
                                        
                                        console.log('Extracted from dataCacheManager_cache:', { 
                                            checkInDate, 
                                            checkOutDate, 
                                            numberOfGuests, 
                                            isSuiteBooking, 
                                            selectedRoomId 
                                        });
                                    }
                                } catch (e) {
                                    console.warn('Error parsing dataCacheManager_cache:', e);
                                }
                            }
                        }
                        
                    } catch (e) {
                        console.warn('Error parsing selectedRoomDetails:', e);
                    }
                }
            }
            
            // Final fallback to URL parameters
            if (!checkInDate || !checkOutDate) {
                const urlParams = new URLSearchParams(window.location.search);
                checkInDate = urlParams.get('checkIn');
                checkOutDate = urlParams.get('checkOut');
                numberOfGuests = (parseInt(urlParams.get('adults') || 0, 10) + parseInt(urlParams.get('children') || 0, 10));
                
                // Check URL for suite or room booking
                const urlBookingType = urlParams.get('bookingType');
                const urlSuiteId = urlParams.get('suiteId');
                
                if (urlBookingType === 'suite' && urlSuiteId) {
                    isSuiteBooking = true;
                    selectedSuiteId = parseInt(urlSuiteId, 10);
                }
                
                console.log('Using URL parameters as fallback:', { 
                    checkInDate, 
                    checkOutDate, 
                    numberOfGuests, 
                    isSuiteBooking, 
                    selectedSuiteId 
                });
            }
        }
        
        console.log('Final date values with backup:', { checkInDate, checkOutDate, numberOfGuests, isSuiteBooking, selectedSuiteId, selectedRoomId });
        
        return {
            checkInDate,
            checkOutDate,
            numberOfGuests,
            isSuiteBooking,
            selectedSuiteId,
            selectedRoomId
        };
        
    } catch (error) {
        console.error('Error in getDatesAndGuestsWithBackup:', error);
        return {
            checkInDate: null,
            checkOutDate: null,
            numberOfGuests: 0,
            isSuiteBooking: false,
            selectedSuiteId: 0,
            selectedRoomId: 0
        };
    }
}

// Make functions available globally for debugging
window.testAPIEndpoints = testAPIEndpoints;
window.inspectLocalStorage = inspectLocalStorage;
window.manualUpdateReservation = manualUpdateReservation;
window.loadAndPreserveCachedData = loadAndPreserveCachedData;
window.restoreDataFromBackup = restoreDataFromBackup;
window.getDatesAndGuestsWithBackup = getDatesAndGuestsWithBackup;

// Global function to check data persistence across pages
window.checkDataPersistence = function() {
    console.log('=== DATA PERSISTENCE CHECK ===');
    console.log('Current page:', window.location.href);
    console.log('Timestamp:', new Date().toISOString());
    
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    const relevantKeys = [
        'suiteBookingData',
        'hotelBookingData', 
        'selectedRoomDetails',
        'dataCacheManager_cache',
        'bookingDataBackup',
        'availableSuites'
    ];
    
    relevantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                console.log(`${key}:`, parsed);
            } catch (e) {
                console.log(`${key}:`, value);
            }
        } else {
            console.log(`${key}: NOT FOUND`);
        }
    });
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
    
    console.log('=== END DATA PERSISTENCE CHECK ===');
};

// Modern notification system
function showModernAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.modern-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert container
    const alertDiv = document.createElement('div');
    alertDiv.className = 'modern-alert';

    // Define colors and icons based on type
    const alertStyles = {
        success: {
            bg: '#d4edda',
            border: '#c3e6cb',
            text: '#155724',
            icon: '✓'
        },
        error: {
            bg: '#f8d7da',
            border: '#f5c6cb',
            text: '#721c24',
            icon: '✕'
        },
        warning: {
            bg: '#fff3cd',
            border: '#ffeaa7',
            text: '#856404',
            icon: '⚠'
        },
        info: {
            bg: '#d1ecf1',
            border: '#bee5eb',
            text: '#0c5460',
            icon: 'ℹ'
        }
    };

    const style = alertStyles[type] || alertStyles.info;

    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${style.bg};
        color: ${style.text};
        border: 1px solid ${style.border};
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    `;

    alertDiv.innerHTML = `
        <span style="font-size: 18px; font-weight: bold; flex-shrink: 0;">${style.icon}</span>
        <div style="flex: 1;">${message.replace(/\n/g, '<br>')}</div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: ${style.text};
            cursor: pointer;
            font-size: 20px;
            padding: 0;
            margin-left: 10px;
            opacity: 0.7;
        ">&times;</button>
    `;

    // Add slide-in animation
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // Add to page
    document.body.appendChild(alertDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Function to show booking success confirmation modal
function showBookingSuccessModal(reservationId, confirmationParams) {
    // Remove any existing modals
    const existingModal = document.getElementById('booking-success-confirmation-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal HTML
    const modalHTML = `
        <div id="booking-success-confirmation-modal" class="booking-success-confirmation-modal-overlay">
            <div class="booking-success-confirmation-modal">
                <div class="modal-header">
                    <div class="success-icon">
                        <i class="fa fa-check-circle"></i>
                    </div>
                    <h2 class="modal-title">Booking Confirmed!</h2>
                    <p class="modal-subtitle">Your reservation has been successfully created</p>
                </div>

                <div class="modal-body">
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Reservation ID:</span>
                            <span class="detail-value">${reservationId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-confirmed">Confirmed</span>
                        </div>
                    </div>

                    <div class="next-steps">
                        <p><i class="fa fa-info-circle"></i> Click OK to view your booking confirmation and invoice details.</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button id="booking-success-ok-btn" class="btn-primary">
                        <i class="fa fa-check"></i> OK
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add modal styles
    const modalStyles = `
        <style>
            .booking-success-confirmation-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }

            .booking-success-confirmation-modal {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 450px;
                width: 90%;
                overflow: hidden;
                animation: slideUp 0.4s ease-out;
            }

            .booking-success-confirmation-modal .modal-header {
                text-align: center;
                padding: 30px 20px 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }

            .booking-success-confirmation-modal .success-icon {
                font-size: 48px;
                margin-bottom: 15px;
                animation: bounce 0.6s ease-out;
            }

            .booking-success-confirmation-modal .modal-title {
                font-size: 28px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .booking-success-confirmation-modal .modal-subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin: 0;
            }

            .booking-success-confirmation-modal .modal-body {
                padding: 30px;
            }

            .booking-success-confirmation-modal .booking-details {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .booking-success-confirmation-modal .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .booking-success-confirmation-modal .detail-row:last-child {
                border-bottom: none;
            }

            .booking-success-confirmation-modal .detail-label {
                font-weight: 500;
                color: #495057;
            }

            .booking-success-confirmation-modal .detail-value {
                font-weight: 600;
                color: #212529;
                font-family: monospace;
            }

            .booking-success-confirmation-modal .status-confirmed {
                color: #28a745 !important;
            }

            .booking-success-confirmation-modal .next-steps {
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }

            .booking-success-confirmation-modal .next-steps p {
                margin: 0;
                color: #1976d2;
                font-size: 14px;
                line-height: 1.5;
            }

            .booking-success-confirmation-modal .modal-footer {
                padding: 20px 30px 30px;
                text-align: center;
            }

            .booking-success-confirmation-modal .btn-primary {
                background: linear-gradient(135deg, #2196F3, #1976d2);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
            }

            .booking-success-confirmation-modal .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
            }

            .booking-success-confirmation-modal .btn-primary:active {
                transform: translateY(0);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }

            @media (max-width: 768px) {
                .booking-success-confirmation-modal {
                    margin: 20px;
                    width: calc(100% - 40px);
                }

                .booking-success-confirmation-modal .modal-header {
                    padding: 20px 15px 15px;
                }

                .booking-success-confirmation-modal .modal-body {
                    padding: 20px;
                }

                .booking-success-confirmation-modal .modal-footer {
                    padding: 15px 20px 20px;
                }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', modalStyles);

    // Add event listener to the OK button
    document.getElementById('booking-success-ok-btn').addEventListener('click', function() {
        // Navigate to confirmation page
        const confirmationUrl = `confirmation.html?${confirmationParams}`;
        console.log('User clicked OK - navigating to confirmation page:', confirmationUrl);
        window.location.href = confirmationUrl;
    });

    console.log('Booking success confirmation modal displayed - waiting for user to click OK');
}

// Global function to debug suite booking specifically
window.debugSuiteBooking = function() {
    console.log('=== SUITE BOOKING DEBUG ===');

    const suiteBookingData = localStorage.getItem('suiteBookingData');
    if (suiteBookingData) {
        try {
            const parsed = JSON.parse(suiteBookingData);
            console.log('Suite Booking Data:', parsed);

            if (parsed.bookingType === 'suite') {
                console.log('✅ Suite booking detected');
                console.log('Selected Suite:', parsed.selectedSuite);
                console.log('Selected Data:', parsed.selectedData);
                console.log('Suite ID:', parsed.selectedSuite?.id || parsed.selectedData?.id || 'NOT FOUND');

                if (parsed.selectedSuite) {
                    console.log('Suite Details:', {
                        id: parsed.selectedSuite.id,
                        name: parsed.selectedSuite.name || parsed.selectedSuite.suiteName,
                        type: parsed.selectedSuite.type,
                        weeklyRate: parsed.selectedSuite.weeklyRate,
                        monthlyRate: parsed.selectedSuite.monthlyRate
                    });
                }
            } else {
                console.log('❌ Not a suite booking, type:', parsed.bookingType);
            }
        } catch (e) {
            console.error('Error parsing suite booking data:', e);
        }
    } else {
        console.log('❌ No suite booking data found in localStorage');
    }

    // Check available suites
    const availableSuites = localStorage.getItem('availableSuites');
    if (availableSuites) {
        try {
            const suites = JSON.parse(availableSuites);
            console.log('Available Suites:', suites);
        } catch (e) {
            console.error('Error parsing available suites:', e);
        }
    }

    console.log('=== END SUITE BOOKING DEBUG ===');
};

// Global function to manually fix suite booking data
window.fixSuiteBookingData = function() {
    console.log('=== ATTEMPTING TO FIX SUITE BOOKING DATA ===');
    
    try {
        // Get current suite booking data
        const suiteBookingData = localStorage.getItem('suiteBookingData');
        if (!suiteBookingData) {
            console.log('No suite booking data found. Cannot fix.');
            return false;
        }
        
        const parsed = JSON.parse(suiteBookingData);
        console.log('Current suite booking data:', parsed);
        
        // Check if we have a suite ID in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlSuiteId = urlParams.get('suiteId');
        
        if (urlSuiteId && parsed.bookingType === 'suite') {
            const suiteId = parseInt(urlSuiteId, 10);
            console.log('Found suite ID in URL:', suiteId);
            
            // Update the suite booking data with the suite ID
            if (!parsed.selectedSuite) {
                parsed.selectedSuite = {};
            }
            parsed.selectedSuite.id = suiteId;
            
            // Save the updated data
            localStorage.setItem('suiteBookingData', JSON.stringify(parsed));
            console.log('✅ Suite booking data updated with suite ID:', suiteId);
            
            // Refresh the page to apply the fix
            console.log('Refreshing page to apply fix...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return true;
        } else {
            console.log('No suite ID found in URL or not a suite booking');
            return false;
        }
        
    } catch (error) {
        console.error('Error fixing suite booking data:', error);
        return false;
    }
};


