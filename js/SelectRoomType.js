// Variable to store fetched room data
let roomData = [];

// Function to populate room type dropdown
function populateRoomTypes(roomTypes) {
    console.log('Populating room types:', roomTypes);

    const selectElement = document.getElementById('room-type');

    if (!selectElement) {
        console.error('Select element with id "room-type" not found!');
        return;
    }

    // Clear existing options except the first one
    selectElement.innerHTML = '<option value="">Select Room Type</option>';

    // Check if roomTypes is an array and has data
    if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
        console.warn('No room types data available');
        selectElement.innerHTML = '<option value="">No room types available</option>';
        return;
    }

    // Add options from API data
    roomTypes.forEach(room => {
        console.log('Processing room:', room);

        if (room.status === "1" || room.status === 1) { // Check both string and number
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = `${room.roomTypeName} - ${room.ratePerNight}/night`;
            selectElement.appendChild(option);
            console.log('Added room option:', room.roomTypeName);
        }
    });
}

// Function to set dropdown value
function setRoomTypeValue(roomId) {
    const selectElement = document.getElementById('room-type');

    if (!selectElement) {
        console.error('Select element with id "room-type" not found!');
        return false;
    }

    // Convert to string for comparison
    const valueToSet = String(roomId);

    // Check if the option exists
    const optionExists = Array.from(selectElement.options).some(option => option.value === valueToSet);

    if (optionExists) {
        selectElement.value = valueToSet;
        console.log('Set dropdown value to:', valueToSet);

        // Trigger change event to update any dependent functionality
        selectElement.dispatchEvent(new Event('change'));
        return true;
    } else {
        console.warn('Room ID not found in dropdown options:', roomId);
        return false;
    }
}

// Function to get selected room data
function getSelectedRoomData() {
    const selectElement = document.getElementById('room-type');
    const selectedId = selectElement.value;

    if (selectedId) {
        return roomData.find(room => room.id == selectedId);
    }
    return null;
}

// Function to fetch data from API
async function fetchRoomTypes() {
    console.log('Starting to fetch room types...');

    try {
        const response = await fetch('https://backendtestingportaljolanka.azurewebsites.net/api/RoomType');

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        // Store the fetched data globally
        roomData = data;

        populateRoomTypes(data);
    } catch (error) {
        console.error('Error fetching room types:', error);

        // Handle error - show message to user
        const selectElement = document.getElementById('room-type');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error loading room types</option>';
        }
    }
}

// Function to fetch and set room type (useful for edit forms)
async function fetchAndSetRoomType(roomId) {
    await fetchRoomTypes(); // Ensure dropdown is populated first

    // Small delay to ensure DOM is updated
    setTimeout(() => {
        setRoomTypeValue(roomId);
    }, 100);
}

// Load room types when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, fetching room types...');

    // Check if the select element exists
    const selectElement = document.getElementById('room-type');
    if (!selectElement) {
        console.error('Select element with id "room-type" not found in DOM!');
        return;
    }

    // Fetch from API
    fetchRoomTypes();
});

// Handle selection change
document.getElementById('room-type').addEventListener('change', function() {
    const selectedId = this.value;
    console.log('Selected ID:', selectedId);

    if (selectedId) {
        const selectedRoom = roomData.find(room => room.id == selectedId);
        console.log('Selected room:', selectedRoom);
        // You can add more functionality here when a room is selected
    }
});