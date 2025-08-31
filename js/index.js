// booking-form.js

function checkAvailability() {

    // Get form values
    const checkIn = document.getElementById('date-range2').value;
    const checkOut = document.getElementById('date-range3').value;
    const roomType = document.getElementById('room-type').value;
    const promocode = document.getElementById('promocode').value;
    const adults = document.getElementById('adults').value;
    const children = document.getElementById('children').value;
    const bookingType = document.getElementById('booking-type').value;

    // Validate each field and show specific messages
    const validationResult = validateForm(checkIn, checkOut, roomType, adults, children);

    if (!validationResult.isValid) {
        showModernAlert(validationResult.message, 'error');
        return;
    }

    // Calculate stay duration
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Get selected room/suite data
    const selectedData = window.dynamicRoomLoading?.getSelectedData();
    
    // Save booking data to localStorage
    const bookingData = {
        checkIn: checkIn,
        checkOut: checkOut,
        roomType: roomType,
        adults: adults,
        children: children,
        promocode: promocode,
        bookingType: bookingType,
        days: days,
        timestamp: Date.now(),
        selectedData: selectedData // Include the selected room/suite data
    };

    // Save to localStorage
    localStorage.setItem('suiteBookingData', JSON.stringify(bookingData));
    console.log('Suite booking data saved to localStorage:', bookingData);

    // Create URL parameters
    const params = new URLSearchParams({
        checkIn: checkIn,
        checkOut: checkOut,
        roomType: roomType,
        adults: adults,
        children: children,
        promocode: promocode,
        bookingType: bookingType,
        days: days
    });

    // Add room/suite ID to URL parameters
    if (selectedData) {
        if (bookingType === 'suite') {
            params.append('suiteId', selectedData.id);
        } else {
            params.append('roomId', selectedData.id);
        }
    }

    // Navigate to appropriate page based on booking type
    if (bookingType === 'suite') {
        window.location.href = `suite-select.html?${params.toString()}`;
    } else {
        window.location.href = `room-select.html?${params.toString()}`;
    }
}



// Enhanced validation function
function validateForm(checkIn, checkOut, roomType, adults, children) {
    const missingFields = [];

    // Check each required field
    if (!checkIn || checkIn.trim() === '') {
        missingFields.push('Check-in date');
    }

    if (!checkOut || checkOut.trim() === '') {
        missingFields.push('Check-out date');
    }

    if (!roomType || roomType === '' || roomType === 'select') {
        missingFields.push('Room type');
    }

    if (!adults || adults === '' || adults === 'select') {
        missingFields.push('Number of adults');
    }

    if (!children || children === '' || children === 'select') {
        missingFields.push('Number of children');
    }

    // If any fields are missing, return error
    if (missingFields.length > 0) {
        let message = 'Please fill in the following required field';
        message += missingFields.length > 1 ? 's:\n' : ':\n';
        message += '• ' + missingFields.join('\n• ');

        return {
            isValid: false,
            message: message
        };
    }

    // Validate dates if both are provided
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if check-in date is not in the past
        if (checkInDate < today) {
            return {
                isValid: false,
                message: 'Check-in date cannot be in the past. Please select today or a future date.'
            };
        }

        // Check if check-out is after check-in
        if (checkOutDate <= checkInDate) {
            return {
                isValid: false,
                message: 'Check-out date must be at least one day after the check-in date.'
            };
        }

        // Check if the stay is not too long (optional - you can adjust or remove this)
        const daysDifference = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (daysDifference > 30) {
            return {
                isValid: false,
                message: 'Maximum stay duration is 30 days. Please select a shorter period.'
            };
        }
    }

    return {
        isValid: true,
        message: 'All fields are valid'
    };


}

// Modern notification system to replace browser alerts
function showModernAlert(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.modern-alert');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `modern-alert alert-${type}`;

    // Set colors based on type
    const colors = {
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '❌' },
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '✅' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '⚠️' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'ℹ️' }
    };

    const colorScheme = colors[type] || colors.info;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${colorScheme.bg};
        color: ${colorScheme.text};
        border: 2px solid ${colorScheme.border};
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: flex-start;
        gap: 12px;
    `;

    notification.innerHTML = `
        <div style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">${colorScheme.icon}</div>
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div>${message.replace(/\n/g, '<br>')}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: ${colorScheme.text};
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            margin-left: 8px;
            opacity: 0.7;
            transition: opacity 0.2s;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
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
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);

    // Add slide out animation
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent += `
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(slideOutStyle);
}