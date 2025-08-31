

// Complete Enhanced Hotel Room Booking System with Room Data Caching and Pagination

// Global variables
let allRooms = [];
let selectedRooms = {}; // {roomId: quantity}
const MAX_OCCUPANCY_PER_ROOM = 4; // Maximum adults + children per room (fallback)
const ROOMS_PER_PAGE = 4; // Number of rooms to display per page
let currentPage = 1;
let currentRoomSet = []; // Current filtered and sorted rooms to display

// Get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Get room type name from number
function getRoomTypeName(roomTypeValue) {
    const roomTypes = {
        '1': 'Royal Mansion',
        '2': 'Diamond Penthouse',
        '3': 'Celebrity Villa',
        '4': 'Palace Suite',
        '5': 'Grand Penthouse',
        '6': 'Royal Villa',
        '7': 'Presidential Suite',
        '8': 'Executive Suite',
        '9': 'Honeymoon Suite',
        '10': 'Ocean View Suite',
        '11': 'Garden Villa',
        '12': 'Deluxe Room',
        '13': 'Executive Room',
        '14': 'Family Suite',
        '15': 'Standard Room'
    };
    return roomTypes[roomTypeValue] || '';
}

// Display booking details from URL
function displayBookingDetails() {
    document.getElementById('checkIn').textContent = getUrlParameter('checkIn') || '-';
    document.getElementById('checkOut').textContent = getUrlParameter('checkOut') || '-';
    document.getElementById('roomType').textContent = getRoomTypeName(getUrlParameter('roomType'));
    document.getElementById('promocode').textContent = getUrlParameter('promocode') || '-';
    document.getElementById('adults').textContent = getUrlParameter('adults') || '-';
    document.getElementById('children').textContent = getUrlParameter('children') || '-';
}

// Get guest numbers
function getGuestNumbers() {
    const adults = parseInt(getUrlParameter('adults')) || 0;
    const children = parseInt(getUrlParameter('children')) || 0;
    return { adults, children, total: adults + children };
}

// Calculate minimum rooms required based on room capacity
function calculateMinimumRoomsRequired() {
    const guests = getGuestNumbers();
    const totalGuests = guests.total;

    if (allRooms.length === 0) {
        return Math.ceil(totalGuests / MAX_OCCUPANCY_PER_ROOM);
    }

    // Find the room type with highest capacity to calculate minimum rooms needed
    const maxCapacityPerRoom = Math.max(...allRooms.map(room => room.capacity || MAX_OCCUPANCY_PER_ROOM));
    return Math.ceil(totalGuests / maxCapacityPerRoom);
}

// Calculate number of nights between check-in and check-out
function calculateNumberOfNights() {
    const checkInDate = new Date(getUrlParameter('checkIn'));
    const checkOutDate = new Date(getUrlParameter('checkOut'));

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return 1; // Default to 1 night if dates are invalid
    }

    const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

    return Math.max(1, daysDifference); // Ensure at least 1 night
}

// Calculate total cost for selected rooms including nights
function calculateTotalBookingAmount() {
    const numberOfNights = calculateNumberOfNights();
    const dailyTotal = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        return total + (room ? room.pricePerNight * qty : 0);
    }, 0);

    return dailyTotal * numberOfNights;
}

// Get booking duration info
function getBookingDurationInfo() {
    const checkIn = getUrlParameter('checkIn');
    const checkOut = getUrlParameter('checkOut');
    const nights = calculateNumberOfNights();

    return {
        checkIn,
        checkOut,
        nights,
        isValid: checkIn && checkOut && nights > 0
    };
}

// Check if current room selection can accommodate all guests
function canAccommodateAllGuests() {
    const guests = getGuestNumbers();
    const totalGuestCapacity = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        const roomCapacity = room ? (room.capacity || MAX_OCCUPANCY_PER_ROOM) : MAX_OCCUPANCY_PER_ROOM;
        return total + (roomCapacity * qty);
    }, 0);

    return totalGuestCapacity >= guests.total;
}

// Get maximum guest capacity for a single room
function getRoomGuestCapacity(roomId) {
    const room = allRooms.find(r => r.roomId === parseInt(roomId));
    return room ? (room.capacity || MAX_OCCUPANCY_PER_ROOM) : MAX_OCCUPANCY_PER_ROOM;
}

// Get available quantity for a room (assuming unlimited room availability)
function getAvailableQuantity(roomId) {
    return 999; // High number indicating availability
}

// Check if room selection is valid
function isRoomSelectionValid(roomId, newQuantity) {
    return newQuantity <= 10; // Max 10 rooms of same type
}

// Pagination functions
function getTotalPages() {
    return Math.ceil(currentRoomSet.length / ROOMS_PER_PAGE);
}

function getCurrentPageRooms() {
    const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
    const endIndex = startIndex + ROOMS_PER_PAGE;
    return currentRoomSet.slice(startIndex, endIndex);
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayCurrentPageRooms();
        updatePaginationControls();

        document.getElementById('hotel-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function nextPage() {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

function previousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

// Create pagination controls
function createPaginationControls() {
    const totalPages = getTotalPages();
    const totalRooms = currentRoomSet.length;
    const startRoom = ((currentPage - 1) * ROOMS_PER_PAGE) + 1;
    const endRoom = Math.min(currentPage * ROOMS_PER_PAGE, totalRooms);

    if (totalPages <= 1) {
        return '';
    }

    let paginationHTML = `
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
                Showing rooms ${startRoom}-${endRoom} of ${totalRooms} total rooms
            </div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">
                <button onclick="previousPage()" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        style="padding: 8px 16px; border: 1px solid #dee2e6; background: ${currentPage === 1 ? '#f8f9fa' : 'white'}; 
                               color: ${currentPage === 1 ? '#6c757d' : '#007bff'}; border-radius: 5px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
                    ← Previous
                </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button onclick="goToPage(${i})" 
                        style="padding: 8px 12px; border: 1px solid #dee2e6; 
                               background: ${i === currentPage ? '#ff6b35' : 'white'}; 
                               color: ${i === currentPage ? 'white' : '#007bff'}; 
                               border-radius: 5px; cursor: pointer; font-weight: ${i === currentPage ? 'bold' : 'normal'};">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span style="padding: 8px 4px; color: #6c757d;">...</span>`;
        }
    }

    paginationHTML += `
                <button onclick="nextPage()" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        style="padding: 8px 16px; border: 1px solid #dee2e6; background: ${currentPage === totalPages ? '#f8f9fa' : 'white'}; 
                               color: ${currentPage === totalPages ? '#6c757d' : '#007bff'}; border-radius: 5px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                    Next →
                </button>
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 12px;">
                Page ${currentPage} of ${totalPages}
            </div>
        </div>
    `;

    return paginationHTML;
}

// Update pagination controls
function updatePaginationControls() {
    const paginationTop = document.getElementById('pagination-top');
    const paginationBottom = document.getElementById('pagination-bottom');
    const paginationHTML = createPaginationControls();

    if (paginationTop) paginationTop.innerHTML = paginationHTML;
    if (paginationBottom) paginationBottom.innerHTML = paginationHTML;
}
// Method 2: Create a comprehensive image mapping function
function getRoomImageUrl(roomTypeName, roomId) {
    // Create a mapping of room types to image files
    const roomImageMap = {
        'Royal Mansion': 'images/rooms/royal-mansion.jpeg',
        'Diamond Penthouse': 'images/rooms/diamond-penthouse.jpeg',
        'Celebrity Villa': 'images/rooms/celebrity-villa.jpeg',
        'Palace Suite': 'images/rooms/palace-suite.jpeg',
        'Grand Penthouse': 'images/rooms/grand-penthouse.jpeg',
        'Royal Villa': 'images/rooms/royal-villa.jpeg',
        'Presidential Suite': 'images/rooms/presidential-suite.jpeg',
        'Executive Suite': 'images/rooms/executive-suite.jpeg',
        'Honeymoon Suite': 'images/rooms/honeymoon-suite.jpeg',
        'Ocean View Suite': 'images/rooms/ocean-view-suite.jpeg',
        'Garden Villa': 'images/rooms/garden-villa.jpeg',
        'Deluxe Room': 'images/rooms/deluxe-room.jpeg',
        'Executive Room': 'images/rooms/executive-room.jpeg',
        'Family Suite': 'images/rooms/family-suite.jpeg',
        'Standard Room': 'images/rooms/standard-room.jpeg'
    };

    // Try to get specific image for room type
    let imageUrl = roomImageMap[roomTypeName];

    // If no specific image found, create a fallback
    if (!imageUrl) {
        const sanitizedName = roomTypeName.toLowerCase().replace(/\s+/g, '-');
        imageUrl = `images/rooms/${sanitizedName}.jpg`;
    }

    // Return the image URL with fallback
    return imageUrl;
}
// Fetch rooms from backend
async function fetchRooms() {
    try {
        showLoading();

        const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/Room?type=all&roomId=0&roomNumber=0&floorId=0&roomTypeId=0&accommodation=Room', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        allRooms = data.map(room => ({
            roomId: room.roomId,
            roomType: room.roomTypeName,
            roomNumber: room.roomNumber,
            pricePerNight: room.ratePerNight,
            capacity: room.capacity || MAX_OCCUPANCY_PER_ROOM,
            isAcAvailable: room.isAcAvailable,
            roomStatus: room.roomStatus,
            floorDescription: room.floorDescription,
            accommodationSummary: room.accommodationSummary,
            imageUrl: getRoomImageUrl(room.roomTypeName, room.roomId)
        }));

        hideLoading();
        currentPage = 1;
        displayRooms();

    } catch (error) {
        console.error('Error fetching rooms:', error);
        hideLoading();

        document.getElementById('hotel-container').innerHTML = `
            <div style="text-align: center; padding: 40px; border: 2px dashed #dc3545; border-radius: 10px; background: #f8d7da; color: #721c24;">
                <h3>Error Loading Rooms</h3>
                <p>Sorry, we couldn't load the available rooms. Please try again later.</p>
                <button onclick="fetchRooms()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Show loading message
function showLoading() {
    document.getElementById('hotel-container').innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <div style="border: 3px solid #f3f3f3; border-top: 3px solid #ff6b35; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h3>Searching Available Rooms...</h3>
            <p>Please wait while we find the best options for you.</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Hide loading
function hideLoading() {
    // Loading will be replaced by room display
}

// Sort rooms: selected type first, then others
function sortRooms() {
    const selectedType = getRoomTypeName(getUrlParameter('roomType'));

    const selectedTypeRooms = allRooms.filter(room => room.roomType === selectedType);
    const otherRooms = allRooms.filter(room => room.roomType !== selectedType);

    selectedTypeRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);
    otherRooms.sort((a, b) => a.pricePerNight - b.pricePerNight);

    return { selectedTypeRooms, otherRooms };
}

// Display all rooms with pagination
function displayRooms() {
    const { selectedTypeRooms, otherRooms } = sortRooms();
    currentRoomSet = [...selectedTypeRooms, ...otherRooms];

    if (currentRoomSet.length === 0) {
        const container = document.getElementById('hotel-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; border: 2px dashed #ccc; border-radius: 10px; background: #f9f9f9;">
                <h3 style="color: #666;">No Available Rooms</h3>
                <p>Sorry, no rooms are available for your selected dates.</p>
            </div>
        `;
        return;
    }

    displayCurrentPageRooms();
}

// Display current page rooms
function displayCurrentPageRooms() {
    const container = document.getElementById('hotel-container');
    const guests = getGuestNumbers();
    const minRoomsRequired = calculateMinimumRoomsRequired();
    const durationInfo = getBookingDurationInfo();
    const totalPages = getTotalPages();
    const currentPageRooms = getCurrentPageRooms();

    container.innerHTML = '';

    // Show capacity requirements info
    const requirementDiv = document.createElement('div');
    requirementDiv.innerHTML = `
        <div style="background: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">Booking Requirements:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <p style="margin: 5px 0; color: #0c5460;">
                        <strong>Stay Duration:</strong> ${durationInfo.nights} night(s) (${durationInfo.checkIn} to ${durationInfo.checkOut})
                    </p>
                    <p style="margin: 5px 0; color: #0c5460;">
                        <strong>Total Guests:</strong> ${guests.adults} Adults + ${guests.children} Children = ${guests.total} Guests
                    </p>
                </div>
                <div>
                    <p style="margin: 5px 0; color: #0c5460;">
                        <strong>Minimum Rooms Required:</strong> ${minRoomsRequired} room(s)
                    </p>
                    <p style="margin: 5px 0; color: #0c5460;">
                        <strong>Total Available Rooms:</strong> ${currentRoomSet.length} rooms
                    </p>
                </div>
            </div>
            <p style="margin: 10px 0 0 0; color: #d63384; font-weight: bold; text-align: center;">
                Please select rooms that can accommodate all ${guests.total} guests.
            </p>
        </div>
    `;
    container.appendChild(requirementDiv);

    // Add top pagination if needed
    if (totalPages > 1) {
        const topPagination = document.createElement('div');
        topPagination.id = 'pagination-top';
        topPagination.innerHTML = createPaginationControls();
        container.appendChild(topPagination);
    }

    // Show current page rooms
    const roomsContainer = document.createElement('div');
    roomsContainer.id = 'rooms-container';

    const selectedType = getRoomTypeName(getUrlParameter('roomType'));
    const currentPageSelectedRooms = currentPageRooms.filter(room => room.roomType === selectedType);
    const currentPageOtherRooms = currentPageRooms.filter(room => room.roomType !== selectedType);

    // Show selected room type section
    if (currentPageSelectedRooms.length > 0) {
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="color: #ff6b35; margin: 20px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #ff6b35;">
                <i class="fa fa-star" style="margin-right: 8px;"></i>Your Selected Room Type: ${selectedType}
            </h3>
        `;
        roomsContainer.appendChild(header);

        currentPageSelectedRooms.forEach(room => {
            roomsContainer.appendChild(createRoomCard(room, true));
        });
    }

    // Show other rooms section
    if (currentPageOtherRooms.length > 0) {
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="color: #666; margin: 30px 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <i class="fa fa-bed" style="margin-right: 8px;"></i>Other Available Rooms
            </h3>
        `;
        roomsContainer.appendChild(header);

        currentPageOtherRooms.forEach(room => {
            roomsContainer.appendChild(createRoomCard(room, false));
        });
    }

    container.appendChild(roomsContainer);

    // Add bottom pagination if needed
    if (totalPages > 1) {
        const bottomPagination = document.createElement('div');
        bottomPagination.id = 'pagination-bottom';
        bottomPagination.innerHTML = createPaginationControls();
        container.appendChild(bottomPagination);
    }

    // Show booking summary section
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'booking-summary-section';
    summaryDiv.style.cssText = 'margin-top: 40px; padding: 20px 0;';
    container.appendChild(summaryDiv);

    updateBookingSummary();
}

// Create room card HTML
function createRoomCard(room, isSelected) {
    const quantity = selectedRooms[room.roomId] || 0;
    const numberOfNights = calculateNumberOfNights();
    const dailyPrice = room.pricePerNight * quantity;
    const totalPrice = dailyPrice * numberOfNights;
    const guestCapacity = room.capacity || MAX_OCCUPANCY_PER_ROOM;

    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.cssText = `
        border: 2px solid ${isSelected ? '#ff6b35' : '#ddd'};
        margin: 15px 0;
        padding: 20px;
        border-radius: 10px;
        background: ${isSelected ? '#fff8f5' : '#fff'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;

    card.innerHTML = `
        <div class="room-content" style="display: flex; gap: 20px; align-items: center;">
            <div class="room-image" style="flex: 0 0 180px;">
                <img src="${room.imageUrl || 'images/room-default.jpg'}" 
                     alt="${room.roomType}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
                ${isSelected ? '<div style="background: #ff6b35; color: white; padding: 4px 8px; border-radius: 12px; display: inline-block; margin-top: 8px; font-size: 11px; font-weight: bold;">YOUR CHOICE</div>' : ''}
            </div>
            
            <div class="room-details" style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">${room.roomType}</h4>
                <div style="color: #666; margin: 4px 0; font-size: 14px;">
                    <i class="fa fa-tag" style="margin-right: 5px;"></i>Room #${room.roomNumber} (ID: ${room.roomId})
                </div>
                <div style="color: #666; margin: 4px 0; font-size: 14px;">
                    <i class="fa fa-users" style="margin-right: 5px;"></i>Up to ${guestCapacity} guests per room
                </div>
                <div style="color: #666; margin: 4px 0; font-size: 14px;">
                    <i class="fa fa-building" style="margin-right: 5px;"></i>${room.floorDescription}
                </div>
                <div style="color: #28a745; margin: 4px 0; font-size: 14px; font-weight: bold;">
                    <i class="fa fa-check-circle" style="margin-right: 5px;"></i>Room Available
                </div>
                <div style="color: #ff6b35; font-size: 20px; font-weight: bold; margin: 10px 0;">
                    LKR ${room.pricePerNight.toLocaleString()} <span style="font-size: 14px; color: #666; font-weight: normal;">/ night</span>
                </div>
            </div>
            
            <div class="room-selection" style="flex: 0 0 200px; text-align: center;">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Select Rooms:</label>
                    <div style="margin-bottom: 8px; font-size: 12px; color: #666;">
                        ${quantity} room(s) selected
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                        <button onclick="changeQuantity('${room.roomId}', -1)" 
                                ${quantity === 0 ? 'disabled' : ''}
                                style="width: 40px; height: 40px; border: 2px solid #ff6b35; background: white; color: #ff6b35; cursor: ${quantity === 0 ? 'not-allowed' : 'pointer'}; border-radius: 6px; font-size: 18px; font-weight: bold; opacity: ${quantity === 0 ? '0.5' : '1'};">
                            −
                        </button>
                        <span id="qty-${room.roomId}" style="min-width: 30px; text-align: center; font-weight: bold; font-size: 18px;">
                            ${quantity}
                        </span>
                        <button onclick="changeQuantity('${room.roomId}', 1)" 
                                style="width: 40px; height: 40px; border: 2px solid #ff6b35; background: #ff6b35; color: white; cursor: pointer; border-radius: 6px; font-size: 18px; font-weight: bold;">
                            +
                        </button>
                    </div>
                </div>
                <div id="price-${room.roomId}" style="color: #ff6b35; font-weight: bold; min-height: 40px; font-size: 14px;">
                    ${quantity > 0 ? `
                        <div>Daily: LKR ${dailyPrice.toLocaleString()}</div>
                        <div style="border-top: 1px solid #ff6b35; padding-top: 4px; margin-top: 4px;">
                            ${numberOfNights} nights: <strong>LKR ${totalPrice.toLocaleString()}</strong>
                        </div>
                        <div style="font-size: 12px; color: #28a745; margin-top: 4px;">
                            Can accommodate: ${quantity * guestCapacity} guests
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    return card;
}

// Change room quantity
function changeQuantity(roomId, change) {
    const currentQty = selectedRooms[roomId] || 0;
    const newQty = Math.max(0, currentQty + change);
    const room = allRooms.find(r => r.roomId === parseInt(roomId));

    if (!isRoomSelectionValid(roomId, newQty)) {
        showModernAlert(`You cannot select more than 10 rooms of the same type.`, 'warning');
        return;
    }

    if (newQty === 0) {
        delete selectedRooms[roomId];
    } else {
        selectedRooms[roomId] = newQty;
    }

    // Update display
    const qtyElement = document.getElementById(`qty-${roomId}`);
    if (qtyElement) {
        qtyElement.textContent = newQty;
    }

    // Update price display
    const priceElement = document.getElementById(`price-${roomId}`);
    if (priceElement) {
        const numberOfNights = calculateNumberOfNights();
        const guestCapacity = room.capacity || MAX_OCCUPANCY_PER_ROOM;

        if (newQty > 0) {
            const dailyPrice = room.pricePerNight * newQty;
            const totalPrice = dailyPrice * numberOfNights;
            const totalGuestCapacity = newQty * guestCapacity;

            priceElement.innerHTML = `
                <div>Daily: LKR ${dailyPrice.toLocaleString()}</div>
                <div style="border-top: 1px solid #ff6b35; padding-top: 4px; margin-top: 4px;">
                    ${numberOfNights} nights: <strong>LKR ${totalPrice.toLocaleString()}</strong>
                </div>
                <div style="font-size: 12px; color: #28a745; margin-top: 4px;">
                    Can accommodate: ${totalGuestCapacity} guests
                </div>
            `;
            priceElement.style.color = '#ff6b35';
        } else {
            priceElement.innerHTML = '';
        }
    }

    // Update button states
    const minusButton = document.querySelector(`button[onclick="changeQuantity('${roomId}', -1)"]`);
    if (minusButton) {
        minusButton.disabled = newQty === 0;
        minusButton.style.opacity = newQty === 0 ? '0.5' : '1';
        minusButton.style.cursor = newQty === 0 ? 'not-allowed' : 'pointer';
    }

    updateBookingSummary();
}

// Update booking summary
function updateBookingSummary() {
    const totalRooms = Object.values(selectedRooms).reduce((sum, qty) => sum + qty, 0);
    const dailyTotal = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        return total + (room ? room.pricePerNight * qty : 0);
    }, 0);

    const numberOfNights = calculateNumberOfNights();
    const totalAmount = calculateTotalBookingAmount();
    const minRoomsRequired = calculateMinimumRoomsRequired();
    const guests = getGuestNumbers();
    const canAccommodateGuests = canAccommodateAllGuests();
    const durationInfo = getBookingDurationInfo();

    // Calculate total guest capacity
    const totalGuestCapacity = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        const roomCapacity = room ? (room.capacity || MAX_OCCUPANCY_PER_ROOM) : MAX_OCCUPANCY_PER_ROOM;
        return total + (roomCapacity * qty);
    }, 0);

    const isValidSelection = canAccommodateGuests && totalRooms > 0;
    const summaryContainer = document.getElementById('booking-summary-section');

    if (totalRooms > 0) {
        summaryContainer.innerHTML = `
            <div style="background: ${isValidSelection ? '#d4edda' : '#f8d7da'}; border: 2px solid ${isValidSelection ? '#c3e6cb' : '#f5c6cb'}; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: ${isValidSelection ? '#155724' : '#721c24'};">
                    <i class="fa fa-calculator" style="margin-right: 8px;"></i>Booking Summary
                </h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <p style="margin: 5px 0; color: #333;"><strong>Selected Rooms:</strong> ${totalRooms}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Total Guests:</strong> ${guests.total} (${guests.adults} Adults, ${guests.children} Children)</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Guest Capacity:</strong> ${totalGuestCapacity} guests</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Stay Duration:</strong> ${numberOfNights} night(s)</p>
                    </div>
                    <div>
                        <p style="margin: 5px 0; color: #333;"><strong>Check-in:</strong> ${durationInfo.checkIn}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Check-out:</strong> ${durationInfo.checkOut}</p>
                        <p style="margin: 5px 0; color: #666;"><strong>Daily Total:</strong> LKR ${dailyTotal.toLocaleString()}</p>
                        <p style="margin: 5px 0; font-size: 20px; color: #ff6b35;"><strong>FULL AMOUNT: LKR ${totalAmount.toLocaleString()}</strong></p>
                    </div>
                </div>
                
                ${!canAccommodateGuests ?
            `<div style="background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <p style="margin: 0; color: #721c24; font-weight: bold;">
                            ⚠️ Selected rooms can accommodate ${totalGuestCapacity} guests, but you have ${guests.total} guests. Please select more rooms or rooms with higher capacity.
                        </p>
                    </div>` :
            `<div style="background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <p style="margin: 0; color: #155724; font-weight: bold;">
                            ✓ Perfect! Your selected rooms can accommodate all ${guests.total} guests.
                        </p>
                    </div>`
        }
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="proceedToBooking()" 
                            ${!isValidSelection ? 'disabled' : ''}
                            style="background: ${isValidSelection ? '#ff6b35' : '#ccc'}; 
                                   color: white; 
                                   border: none; 
                                   padding: 15px 40px; 
                                   border-radius: 8px; 
                                   cursor: ${isValidSelection ? 'pointer' : 'not-allowed'}; 
                                   font-size: 18px; 
                                   font-weight: bold;
                                   transition: all 0.3s ease;">
                        ${isValidSelection ? `BOOK NOW - LKR ${totalAmount.toLocaleString()}` : 'SELECT ADEQUATE ROOMS'}
                    </button>
                </div>
            </div>
        `;
    } else {
        summaryContainer.innerHTML = `
            <div style="background: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; border-radius: 10px; text-align: center;">
                <h4 style="color: #6c757d; margin: 0;">No Rooms Selected</h4>
                <p style="color: #6c757d; margin: 10px 0 0 0;">Please select rooms to see booking summary</p>
                <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px;">Stay: ${numberOfNights} night(s) from ${durationInfo.checkIn} to ${durationInfo.checkOut}</p>
                <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px;">Need to accommodate: ${guests.total} guests total</p>
            </div>
        `;
    }
}

// ENHANCED PROCEED TO BOOKING FUNCTION WITH DATA CACHING
function proceedToBooking() {
    const totalRooms = Object.values(selectedRooms).reduce((sum, qty) => sum + qty, 0);
    const minRoomsRequired = calculateMinimumRoomsRequired();
    const canAccommodateGuests = canAccommodateAllGuests();

    // Validation checks
    if (totalRooms < minRoomsRequired) {
        showModernAlert(`Please select at least ${minRoomsRequired} room(s) to accommodate all guests.`, 'warning');
        return;
    }

    if (!canAccommodateGuests) {
        showModernAlert('Selected rooms cannot accommodate all guests. Please select additional rooms.', 'warning');
        return;
    }

    if (Object.keys(selectedRooms).length === 0) {
        showModernAlert('Please select at least one room', 'warning');
        return;
    }

    const totalAmount = calculateTotalBookingAmount();
    const numberOfNights = calculateNumberOfNights();
    const roomIds = Object.keys(selectedRooms);
    const guests = getGuestNumbers();

    // Calculate total guest capacity
    const totalGuestCapacity = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        const roomCapacity = room ? (room.capacity || MAX_OCCUPANCY_PER_ROOM) : MAX_OCCUPANCY_PER_ROOM;
        return total + (roomCapacity * qty);
    }, 0);

    // Calculate daily amount
    const dailyAmount = Object.entries(selectedRooms).reduce((total, [roomId, qty]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        return total + (room ? room.pricePerNight * qty : 0);
    }, 0);

    // Prepare detailed room information for caching
    const selectedRoomDetails = Object.entries(selectedRooms).map(([roomId, quantity]) => {
        const room = allRooms.find(r => r.roomId === parseInt(roomId));
        return {
            roomId: parseInt(roomId),
            roomType: room.roomType,
            roomNumber: room.roomNumber,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity || MAX_OCCUPANCY_PER_ROOM,
            quantity: quantity,
            subtotalPerNight: room.pricePerNight * quantity,
            subtotalTotal: room.pricePerNight * quantity * numberOfNights,
            guestCapacity: (room.capacity || MAX_OCCUPANCY_PER_ROOM) * quantity,
            isAcAvailable: room.isAcAvailable,
            floorDescription: room.floorDescription,
            accommodationSummary: room.accommodationSummary,
            imageUrl: room.imageUrl
        };
    });

    // Create comprehensive booking data object
    const bookingData = {
        // Basic booking information
        checkIn: getUrlParameter('checkIn'),
        checkOut: getUrlParameter('checkOut'),
        numberOfNights: numberOfNights,
        adults: parseInt(getUrlParameter('adults')) || 0,
        children: parseInt(getUrlParameter('children')) || 0,
        totalGuests: guests.total,
        promocode: getUrlParameter('promocode') || '',

        // Room selection data
        selectedRooms: selectedRooms, // {roomId: quantity}
        selectedRoomDetails: selectedRoomDetails, // Detailed room info array
        totalRooms: totalRooms,
        totalGuestCapacity: totalGuestCapacity,

        // Pricing information
        dailyAmount: dailyAmount,
        totalAmount: totalAmount,

        // Validation flags
        canAccommodateAllGuests: canAccommodateGuests,
        isValidSelection: true,

        // Additional metadata
        bookingTimestamp: new Date().toISOString(),
        roomIds: roomIds,

        // Summary for display
        summary: {
            totalRoomsSelected: totalRooms,
            totalGuestsToAccommodate: guests.total,
            totalCapacityProvided: totalGuestCapacity,
            stayDuration: `${numberOfNights} night(s)`,
            checkInOut: `${getUrlParameter('checkIn')} to ${getUrlParameter('checkOut')}`,
            finalAmount: totalAmount
        }
    };

    try {
        // Cache the booking data in localStorage
        localStorage.setItem('hotelBookingData', JSON.stringify(bookingData));
        localStorage.setItem('hotelBookingTimestamp', new Date().getTime().toString());

        // Also cache individual components for easy access
        localStorage.setItem('selectedRoomDetails', JSON.stringify(selectedRoomDetails));
        localStorage.setItem('bookingSummary', JSON.stringify(bookingData.summary));

        console.log('Booking data cached successfully:', bookingData);

        // Also set a cookie fallback (1 hour) so data survives intermediate login redirects
        try {
            const cookiePayload = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                numberOfNights: bookingData.numberOfNights,
                adults: bookingData.adults,
                children: bookingData.children,
                totalGuests: bookingData.totalGuests,
                totalAmount: bookingData.totalAmount,
                selectedRoomDetails: bookingData.selectedRoomDetails
            })))));
            document.cookie = `booking_cache=${cookiePayload}; path=/; max-age=${60 * 60}; samesite=Lax`;
        } catch (e) {
            console.warn('Failed to set booking_cache cookie:', e);
        }

        // Create URL parameters (keeping existing functionality)
        const params = new URLSearchParams();
        params.append('checkIn', getUrlParameter('checkIn'));
        params.append('checkOut', getUrlParameter('checkOut'));
        params.append('adults', getUrlParameter('adults'));
        params.append('children', getUrlParameter('children'));
        params.append('promocode', getUrlParameter('promocode') || '');
        params.append('roomIds', roomIds.join(','));
        params.append('numberOfNights', numberOfNights);
        params.append('totalAmount', totalAmount);


        // Embed a minimal payload in URL as a fallback for rendering on booking.html
        try {
            const minimalData = {
                checkIn: getUrlParameter('checkIn'),
                checkOut: getUrlParameter('checkOut'),
                numberOfNights: numberOfNights,
                adults: parseInt(getUrlParameter('adults') || '0', 10),
                children: parseInt(getUrlParameter('children') || '0', 10),
                totalGuests: guests.total,
                totalAmount: totalAmount,
                // keep room fields compact
                selectedRoomDetails: selectedRoomDetails.map(r => ({
                    roomId: r.roomId,
                    roomType: r.roomType,
                    quantity: r.quantity,
                    subtotalTotal: r.subtotalTotal
                }))
            };
            const bd = btoa(unescape(encodeURIComponent(JSON.stringify(minimalData))));
            params.append('bd', bd);
        } catch (e) {
            console.warn('Failed to embed minimal booking data into URL:', e);
        }

        // Determine destination URL
        const bookingUrl = `booking.html?${params.toString()}`;
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('customerId');

        if (!isAuthenticated) {
            // Store intended destination to return after signup/login
            try {
                localStorage.setItem('redirectAfterLogin', bookingUrl);
            } catch (e) {}
            // Route to login
            window.location.href = 'login.html#signUpForm';
        } else {
            // Navigate directly to booking page
            window.location.href = bookingUrl;
        }

    } catch (error) {
        console.error('Error caching booking data:', error);
        showModernAlert('Error saving booking data. Please try again.', 'error');
    }
}

// UTILITY FUNCTIONS FOR CACHED DATA MANAGEMENT

// Function to retrieve cached booking data in another HTML file
function getCachedBookingData() {
    try {
        const cachedData = localStorage.getItem('hotelBookingData');
        const timestamp = localStorage.getItem('hotelBookingTimestamp');

        if (!cachedData) {
            console.log('No cached booking data found');
            return null;
        }

        // Check if data is not too old (optional - expire after 1 hour)
        const now = new Date().getTime();
        const cacheTime = parseInt(timestamp) || 0;
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        if (now - cacheTime > oneHour) {
            console.log('Cached booking data expired');
            clearCachedBookingData(); // Clear expired data
            return null;
        }

        const bookingData = JSON.parse(cachedData);
        console.log('Retrieved cached booking data:', bookingData);
        return bookingData;

    } catch (error) {
        console.error('Error retrieving cached booking data:', error);
        return null;
    }
}

// Function to get specific cached data components
function getCachedRoomDetails() {
    try {
        const cachedRoomDetails = localStorage.getItem('selectedRoomDetails');
        return cachedRoomDetails ? JSON.parse(cachedRoomDetails) : null;
    } catch (error) {
        console.error('Error retrieving cached room details:', error);
        return null;
    }
}

function getCachedBookingSummary() {
    try {
        const cachedSummary = localStorage.getItem('bookingSummary');
        return cachedSummary ? JSON.parse(cachedSummary) : null;
    } catch (error) {
        console.error('Error retrieving cached booking summary:', error);
        return null;
    }
}

// Function to clear cached data
function clearCachedBookingData() {
    try {
        localStorage.removeItem('hotelBookingData');
        localStorage.removeItem('hotelBookingTimestamp');
        localStorage.removeItem('selectedRoomDetails');
        localStorage.removeItem('bookingSummary');
        console.log('Cached booking data cleared');
    } catch (error) {
        console.error('Error clearing cached data:', error);
    }
}

// Function to update cached data (useful for modifications)
function updateCachedBookingData(updatedData) {
    try {
        const existingData = getCachedBookingData();
        if (existingData) {
            const mergedData = { ...existingData, ...updatedData };
            localStorage.setItem('hotelBookingData', JSON.stringify(mergedData));
            localStorage.setItem('hotelBookingTimestamp', new Date().getTime().toString());
            console.log('Cached booking data updated:', mergedData);
            return mergedData;
        }
        return null;
    } catch (error) {
        console.error('Error updating cached booking data:', error);
        return null;
    }
}

// Function to check if booking data exists and is valid
function hasValidCachedBookingData() {
    const cachedData = getCachedBookingData();
    return cachedData !== null && cachedData.isValidSelection === true;
}

// Function to get cached data with fallback to URL parameters
function getBookingDataWithFallback() {
    const cachedData = getCachedBookingData();

    if (cachedData) {
        return cachedData;
    }

    // Fallback to URL parameters
    return {
        checkIn: getUrlParameter('checkIn'),
        checkOut: getUrlParameter('checkOut'),
        adults: parseInt(getUrlParameter('adults')) || 0,
        children: parseInt(getUrlParameter('children')) || 0,
        promocode: getUrlParameter('promocode') || '',
        numberOfNights: calculateNumberOfNights(),
        totalAmount: parseFloat(getUrlParameter('totalAmount')) || 0,
        roomIds: getUrlParameter('roomIds') ? getUrlParameter('roomIds').split(',') : []
    };
}

// Function to validate cached data integrity
function validateCachedData(data) {
    if (!data) return false;

    const requiredFields = ['checkIn', 'checkOut', 'totalAmount', 'selectedRoomDetails'];
    return requiredFields.every(field => data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined);
}

// Function to get room details by ID from cache
function getCachedRoomById(roomId) {
    const roomDetails = getCachedRoomDetails();
    if (roomDetails) {
        return roomDetails.find(room => room.roomId === parseInt(roomId));
    }
    return null;
}

// Function to calculate total from cached data
function getTotalFromCache() {
    const cachedData = getCachedBookingData();
    return cachedData ? cachedData.totalAmount : 0;
}

// Function to get booking duration from cache
function getBookingDurationFromCache() {
    const cachedData = getCachedBookingData();
    if (cachedData) {
        return {
            checkIn: cachedData.checkIn,
            checkOut: cachedData.checkOut,
            nights: cachedData.numberOfNights
        };
    }
    return null;
}

// Function to export cached data (for debugging or backup)
function exportCachedData() {
    const data = {
        hotelBookingData: getCachedBookingData(),
        selectedRoomDetails: getCachedRoomDetails(),
        bookingSummary: getCachedBookingSummary(),
        timestamp: localStorage.getItem('hotelBookingTimestamp')
    };

    console.log('Exported cached data:', data);
    return data;
}

// Function to import cached data (for restoring from backup)
function importCachedData(data) {
    try {
        if (data.hotelBookingData) {
            localStorage.setItem('hotelBookingData', JSON.stringify(data.hotelBookingData));
        }
        if (data.selectedRoomDetails) {
            localStorage.setItem('selectedRoomDetails', JSON.stringify(data.selectedRoomDetails));
        }
        if (data.bookingSummary) {
            localStorage.setItem('bookingSummary', JSON.stringify(data.bookingSummary));
        }
        if (data.timestamp) {
            localStorage.setItem('hotelBookingTimestamp', data.timestamp);
        }

        console.log('Cached data imported successfully');
        return true;
    } catch (error) {
        console.error('Error importing cached data:', error);
        return false;
    }
}

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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    displayBookingDetails();
    fetchRooms();
    console.log('Enhanced hotel booking system initialized with comprehensive data caching');

    // Clear any expired cache on load
    getCachedBookingData();
});