// Dynamic Room Loading System
// Handles loading different room types based on booking type selection

// Global variables to store data
let normalRoomData = [];
let suiteData = [];
let currentBookingType = 'normal';

// API endpoints
const ROOM_TYPE_API = 'https://backendtestingportaljolanka.azurewebsites.net/api/RoomType';
const SUITE_API = 'https://backendtestingportaljolanka.azurewebsites.net/api/Suite';

// Function to populate room type dropdown with normal rooms
function populateNormalRooms(rooms) {
    console.log('Populating normal rooms:', rooms);
    
    const selectElement = document.getElementById('room-type');
    if (!selectElement) {
        console.error('Room type select element not found!');
        return;
    }
    
    // Clear existing options
    selectElement.innerHTML = '<option value="">Select Room Type</option>';
    
    if (!Array.isArray(rooms) || rooms.length === 0) {
        selectElement.innerHTML = '<option value="">No rooms available</option>';
        return;
    }
    
    // Add room options
    rooms.forEach(room => {
        if (room.status === "1" || room.status === 1) {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = `${room.roomTypeName} - LKR ${room.ratePerNight}/night`;
            selectElement.appendChild(option);
            console.log('Added normal room option:', room.roomTypeName);
        }
    });
}

// Function to populate room type dropdown with suites
function populateSuites(suites) {
    console.log('Populating suites:', suites);
    
    const selectElement = document.getElementById('room-type');
    if (!selectElement) {
        console.error('Room type select element not found!');
        return;
    }
    
    // Clear existing options
    selectElement.innerHTML = '<option value="">Select Suite Type</option>';
    
    if (!Array.isArray(suites) || suites.length === 0) {
        selectElement.innerHTML = '<option value="">No suites available</option>';
        return;
    }
    
    // Add suite options
    suites.forEach(suite => {
        const option = document.createElement('option');
        option.value = suite.id;
        option.textContent = `${suite.suiteName} - ${suite.type} (Weekly: LKR ${suite.weeklyRate}, Monthly: LKR ${suite.monthlyRate})`;
        selectElement.appendChild(option);
        console.log('Added suite option:', suite.suiteName);
    });
}

// Function to fetch normal room types from API
async function fetchNormalRooms() {
    console.log('Fetching normal room types...');
    
    try {
        const response = await fetch(ROOM_TYPE_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched normal rooms:', data);
        
        // Store data globally
        normalRoomData = data;
        
        // Populate dropdown
        populateNormalRooms(data);
        
        return data;
        
    } catch (error) {
        console.error('Error fetching normal rooms:', error);
        
        const selectElement = document.getElementById('room-type');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error loading rooms</option>';
        }
        
        return null;
    }
}

// Function to fetch suites from API
async function fetchSuites() {
    console.log('Fetching suites...');
    
    try {
        const response = await fetch(SUITE_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched suites:', data);
        
        // Store data globally
        suiteData = data;
        
        // Populate dropdown
        populateSuites(data);
        
        return data;
        
    } catch (error) {
        console.error('Error fetching suites:', error);
        
        const selectElement = document.getElementById('room-type');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error loading suites</option>';
        }
        
        return null;
    }
}

// Function to update the dynamic information display
function updateDynamicInfo(bookingType, selectedData = null) {
    const infoSection = document.getElementById('dynamic-info');
    const infoTitle = document.getElementById('info-title');
    const infoContent = document.getElementById('info-content');
    
    if (!infoSection || !infoTitle || !infoContent) {
        console.warn('Dynamic info elements not found');
        return;
    }
    
    if (bookingType === 'suite') {
        infoTitle.textContent = 'Suite Booking Information';
        infoContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>🏢 Suite Booking Benefits:</strong></p>
                    <ul>
                        <li>Extended stay options (weekly/monthly rates)</li>
                        <li>Premium amenities and larger spaces</li>
                        <li>Perfect for business travelers and families</li>
                        <li>Kitchen facilities and living areas</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <p><strong>💡 When to Choose Suites:</strong></p>
                    <ul>
                        <li>Stays longer than 7 days</li>
                        <li>Need more space and privacy</li>
                        <li>Want kitchen facilities</li>
                        <li>Business or family travel</li>
                    </ul>
                </div>
            </div>
            ${selectedData ? `
                <div class="mt-3 p-3 bg-light rounded">
                    <h6><strong>Selected Suite:</strong> ${selectedData.suiteName}</h6>
                    <p><strong>Type:</strong> ${selectedData.type}</p>
                    <p><strong>Weekly Rate:</strong> LKR ${selectedData.weeklyRate.toLocaleString()}</p>
                    <p><strong>Monthly Rate:</strong> LKR ${selectedData.monthlyRate.toLocaleString()}</p>
                </div>
            ` : ''}
        `;
    } else {
        infoTitle.textContent = 'Room Booking Information';
        infoContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>🏨 Room Booking Benefits:</strong></p>
                    <ul>
                        <li>Flexible short-term stays</li>
                        <li>Daily rates for any duration</li>
                        <li>Standard hotel amenities</li>
                        <li>Perfect for weekend getaways</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <p><strong>💡 When to Choose Rooms:</strong></p>
                    <ul>
                        <li>Short stays (1-6 days)</li>
                        <li>Standard hotel experience</li>
                        <li>Budget-conscious travel</li>
                        <li>Quick business trips</li>
                    </ul>
                </div>
            </div>
            ${selectedData ? `
                <div class="mt-3 p-3 bg-light rounded">
                    <h6><strong>Selected Room:</strong> ${selectedData.roomTypeName}</h6>
                    <p><strong>Rate per Night:</strong> LKR ${selectedData.ratePerNight.toLocaleString()}</p>
                </div>
            ` : ''}
        `;
    }
    
    // Show the info section
    infoSection.style.display = 'block';
    
    // Add smooth animation
    infoSection.style.opacity = '0';
    infoSection.style.transform = 'translateY(-20px)';
    infoSection.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        infoSection.style.opacity = '1';
        infoSection.style.transform = 'translateY(0)';
    }, 100);
}

// Function to handle booking type change
function handleBookingTypeChange(bookingType) {
    console.log('Booking type changed to:', bookingType);
    
    currentBookingType = bookingType;
    
    // Clear current selection
    const selectElement = document.getElementById('room-type');
    if (selectElement) {
        selectElement.value = '';
    }
    
    // Update the form label
    updateFormLabel(bookingType);
    
    // Load appropriate data based on booking type
    if (bookingType === 'suite') {
        console.log('Loading suites...');
        fetchSuites();
        
    } else {
        console.log('Loading normal rooms...');
        fetchNormalRooms();
    }
    
    // Update dynamic information
    updateDynamicInfo(bookingType);
    
    // Save booking type to localStorage for persistence
    const currentData = JSON.parse(localStorage.getItem('suiteBookingData') || '{}');
    currentData.bookingType = bookingType;
    localStorage.setItem('suiteBookingData', JSON.stringify(currentData));
    
    console.log('Updated localStorage with booking type:', currentData);
}

// Function to update form label based on booking type
function updateFormLabel(bookingType) {
    const labelElement = document.querySelector('label[for="room-type"]');
    if (labelElement) {
        if (bookingType === 'suite') {
            labelElement.textContent = 'Suite Type';
            labelElement.innerHTML = '<i class="fa fa-building"></i> Suite Type';
        } else {
            labelElement.textContent = 'Room Type';
            labelElement.innerHTML = '<i class="fa fa-bed"></i> Room Type';
        }
    }
}

// Function to get selected room/suite data
function getSelectedRoomOrSuiteData() {
    const selectElement = document.getElementById('room-type');
    const selectedId = selectElement?.value;
    
    if (!selectedId) {
        return null;
    }
    
    if (currentBookingType === 'suite') {
        return suiteData.find(suite => suite.id == selectedId);
    } else {
        return normalRoomData.find(room => room.id == selectedId);
    }
}

// Function to initialize the dynamic loading system
function initializeDynamicRoomLoading() {
    console.log('Initializing dynamic room loading system...');
    
    // Get the booking type select element
    const bookingTypeSelect = document.getElementById('booking-type');
    if (!bookingTypeSelect) {
        console.error('Booking type select element not found!');
        return;
    }
    
    // Add event listener for booking type changes
    bookingTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        handleBookingTypeChange(selectedType);
    });
    
    // Load initial data based on default selection
    const initialType = bookingTypeSelect.value || 'normal';
    console.log('Initial booking type:', initialType);
    handleBookingTypeChange(initialType);
    
    // Add event listener for room/suite selection changes
    const roomTypeSelect = document.getElementById('room-type');
    if (roomTypeSelect) {
        roomTypeSelect.addEventListener('change', function() {
            const selectedId = this.value;
            const selectedData = getSelectedRoomOrSuiteData();
            
            console.log('Selected room/suite:', selectedData);
            
            // Update dynamic information with selected data
            updateDynamicInfo(currentBookingType, selectedData);
            
            // Save selection to localStorage
            if (selectedData) {
                const currentData = JSON.parse(localStorage.getItem('suiteBookingData') || '{}');
                if (currentBookingType === 'suite') {
                    currentData.selectedSuite = {
                        id: selectedData.id,
                        name: selectedData.suiteName,
                        type: selectedData.type,
                        weeklyRate: selectedData.weeklyRate,
                        monthlyRate: selectedData.monthlyRate,
                        timestamp: Date.now()
                    };
                } else {
                    currentData.selectedRoom = {
                        id: selectedData.id,
                        name: selectedData.roomTypeName,
                        rate: selectedData.ratePerNight,
                        timestamp: Date.now()
                    };
                }
                localStorage.setItem('suiteBookingData', JSON.stringify(currentData));
                console.log('Updated localStorage with selection:', currentData);
            }
        });
    }
    
    console.log('Dynamic room loading system initialized successfully');
}

// Function to check if data is loaded
function isDataLoaded(bookingType) {
    if (bookingType === 'suite') {
        return suiteData.length > 0;
    } else {
        return normalRoomData.length > 0;
    }
}

// Function to refresh data
async function refreshData(bookingType) {
    console.log('Refreshing data for booking type:', bookingType);
    
    if (bookingType === 'suite') {
        await fetchSuites();
    } else {
        await fetchNormalRooms();
    }
}

// Function to get current data
function getCurrentData() {
    return {
        bookingType: currentBookingType,
        normalRooms: normalRoomData,
        suites: suiteData,
        selectedData: getSelectedRoomOrSuiteData()
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dynamic room loading...');
    initializeDynamicRoomLoading();
    
    // Add event listeners for date inputs to check duration
    const checkInInput = document.getElementById('date-range2');
    const checkOutInput = document.getElementById('date-range3');
    
    if (checkInInput && checkOutInput) {
        // Check duration when dates change
        checkInInput.addEventListener('change', checkStayDurationAndSuggest);
        checkOutInput.addEventListener('change', checkStayDurationAndSuggest);
        
        // Also check when both dates are filled
        checkInInput.addEventListener('blur', function() {
            if (checkInInput.value && checkOutInput.value) {
                checkStayDurationAndSuggest();
            }
        });
        
        checkOutInput.addEventListener('blur', function() {
            if (checkInInput.value && checkOutInput.value) {
                checkStayDurationAndSuggest();
            }
        });
    }
});

// Make functions available globally for debugging and external use
window.dynamicRoomLoading = {
    initialize: initializeDynamicRoomLoading,
    handleBookingTypeChange: handleBookingTypeChange,
    getSelectedData: getSelectedRoomOrSuiteData,
    isDataLoaded: isDataLoaded,
    refreshData: refreshData,
    getCurrentData: getCurrentData,
    fetchNormalRooms: fetchNormalRooms,
    fetchSuites: fetchSuites,
    checkStayDurationAndSuggest: checkStayDurationAndSuggest,
    switchToSuite: switchToSuite,
    switchToRoom: switchToRoom
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDynamicRoomLoading,
        handleBookingTypeChange,
        getSelectedRoomOrSuiteData,
        isDataLoaded,
        refreshData,
        getCurrentData
    };
} 

// Function to check stay duration and suggest booking type
function checkStayDurationAndSuggest() {
    const checkInInput = document.getElementById('date-range2');
    const checkOutInput = document.getElementById('date-range3');
    const bookingTypeSelect = document.getElementById('booking-type');
    
    if (!checkInInput || !checkOutInput || !bookingTypeSelect) {
        return;
    }
    
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        console.log('Stay duration calculated:', days, 'days');
        
        // Suggest suite booking for stays longer than 7 days
        if (days >= 7 && bookingTypeSelect.value === 'normal') {
            showSuiteSuggestion(days);
        } else if (days < 7 && bookingTypeSelect.value === 'suite') {
            showRoomSuggestion(days);
        }
        
        // Update localStorage with duration
        const currentData = JSON.parse(localStorage.getItem('suiteBookingData') || '{}');
        currentData.days = days;
        localStorage.setItem('suiteBookingData', JSON.stringify(currentData));
    }
}

// Function to show suite booking suggestion
function showSuiteSuggestion(days) {
    const infoSection = document.getElementById('dynamic-info');
    if (!infoSection) return;
    
    const suggestionHtml = `
        <div class="alert alert-warning" role="alert" style="margin-top: 15px;">
            <h6><i class="fa fa-lightbulb"></i> Smart Suggestion for ${days}-Day Stay</h6>
            <p><strong>💡 Consider Suite Booking:</strong> For stays of ${days} days, suite booking offers better value with weekly/monthly rates and premium amenities.</p>
            <button type="button" class="btn btn-sm btn-warning" onclick="switchToSuite()">
                <i class="fa fa-building"></i> Switch to Suite Booking
            </button>
        </div>
    `;
    
    // Insert suggestion at the top of info content
    const infoContent = document.getElementById('info-content');
    if (infoContent) {
        infoContent.insertAdjacentHTML('afterbegin', suggestionHtml);
    }
}

// Function to show room booking suggestion
function showRoomSuggestion(days) {
    const infoSection = document.getElementById('dynamic-info');
    if (!infoSection) return;
    
    const suggestionHtml = `
        <div class="alert alert-info" role="alert" style="margin-top: 15px;">
            <h6><i class="fa fa-info-circle"></i> Smart Suggestion for ${days}-Day Stay</h6>
            <p><strong>💡 Consider Room Booking:</strong> For stays of ${days} days, room booking offers better flexibility and daily rates.</p>
            <button type="button" class="btn btn-sm btn-info" onclick="switchToRoom()">
                <i class="fa fa-bed"></i> Switch to Room Booking
            </button>
        </div>
    `;
    
    // Insert suggestion at the top of info content
    const infoContent = document.getElementById('info-content');
    if (infoContent) {
        infoContent.insertAdjacentHTML('afterbegin', suggestionHtml);
    }
}

// Function to switch to suite booking
function switchToSuite() {
    const bookingTypeSelect = document.getElementById('booking-type');
    if (bookingTypeSelect) {
        bookingTypeSelect.value = 'suite';
        handleBookingTypeChange('suite');
        
        // Remove suggestion
        const suggestion = document.querySelector('.alert-warning');
        if (suggestion) {
            suggestion.remove();
        }
    }
}

// Function to switch to room booking
function switchToRoom() {
    const bookingTypeSelect = document.getElementById('booking-type');
    if (bookingTypeSelect) {
        bookingTypeSelect.value = 'normal';
        handleBookingTypeChange('normal');
        
        // Remove suggestion
        const suggestion = document.querySelector('.alert-info');
        if (suggestion) {
            suggestion.remove();
        }
    }
} 