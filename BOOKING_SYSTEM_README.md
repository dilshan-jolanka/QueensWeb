# Hotel Booking System - Invoice Integration

## Overview
This is a complete hotel booking system with integrated invoice functionality. The system allows customers to book rooms, save their information, and generate downloadable PDF invoices.

## How It Works

### 1. Booking Flow
1. **Room Selection**: Customer selects rooms on `availability.html` or `room-select.html`
2. **Personal Information**: Customer fills personal details on `booking.html`
3. **Payment**: Customer enters payment information
4. **Confirmation**: Customer clicks "CONFIRM BOOKING" button
5. **Invoice**: System redirects to `confirmation.html` with invoice

### 2. Data Flow
- **Room Data**: Saved to `localStorage` as `hotelBookingData` and `selectedRoomDetails`
- **Customer Data**: Saved to `localStorage` as `customerFullName`, `customerEmail`, `phone`, `address`
- **Invoice Generation**: `confirmation.html` reads data and generates invoice
- **PDF Download**: Customer can download invoice as PDF

## Files Structure

### Core Files
- `booking.html` - Main booking page with form
- `confirmation.html` - Invoice display page
- `js/booking.js` - Booking logic and data saving
- `js/confirmation.js` - Invoice rendering and PDF generation

### Test Files
- `test-booking-flow.html` - Complete booking flow test
- `test-invoice.html` - Invoice system test
- `js/test-data-generator.js` - Test data generation

## Quick Start

### Method 1: Use Test Page (Recommended)
1. Open `test-booking-flow.html` in your browser
2. Click "Run Full Test" to simulate complete booking process
3. Click "View Invoice" to see the generated invoice
4. Test PDF download functionality

### Method 2: Manual Testing
1. Open `booking.html` in your browser
2. Fill in customer information
3. Click "CONFIRM BOOKING" button
4. System will redirect to `confirmation.html` with invoice

### Method 3: Direct Invoice Testing
1. Open `confirmation.html` directly
2. If no data exists, system will show sample data
3. Invoice will be generated automatically

## Key Features

### Invoice System
- ✅ **Dynamic Invoice Table**: Shows room details, quantities, rates, amounts
- ✅ **Automatic Calculations**: Subtotal, service charge (10%), tax (2%), total
- ✅ **Customer Information**: Name, email, phone, address
- ✅ **Booking Details**: Check-in/out dates, nights, guests
- ✅ **PDF Download**: High-quality PDF generation with proper formatting
- ✅ **Payment Status**: Shows payment status with visual indicators

### Data Management
- ✅ **localStorage Integration**: Persistent data storage
- ✅ **Multiple Data Sources**: Supports various data formats
- ✅ **Error Handling**: Graceful fallbacks for missing data
- ✅ **Data Validation**: Validates booking and customer information

## Testing the System

### Complete Booking Flow Test
```bash
# Open test page
open test-booking-flow.html

# Or run individual steps:
1. Click "Save Room Data"
2. Click "Save Customer Data"
3. Click "Confirm Booking"
4. Click "View Invoice"
```

### Invoice Testing
```bash
# Open invoice test page
open test-invoice.html

# Test different scenarios
- Single room booking
- Multiple rooms booking
- Suite booking
- PDF download
```

### Debug Functions
Open browser console and use:
```javascript
// Debug current data
debugConfirmationData()

// Refresh invoice
refreshInvoice()

// Download PDF
downloadInvoicePDF()

// Show current localStorage
showCurrentData()
```

## Data Structure

### Booking Data (localStorage: `hotelBookingData`)
```javascript
{
  "selectedRoomDetails": [
    {
      "roomType": "Deluxe Room",
      "pricePerNight": 15000,
      "quantity": 2,
      "subtotalTotal": 90000,
      "features": ["WiFi", "AC"],
      "numberOfNights": 3
    }
  ],
  "totalAmount": 90000,
  "numberOfNights": 3,
  "totalGuests": 4,
  "checkIn": "2024-01-15",
  "checkOut": "2024-01-18",
  "adults": 4,
  "children": 0
}
```

### Customer Data
```javascript
localStorage.setItem('customerFullName', 'John Doe');
localStorage.setItem('customerEmail', 'john.doe@example.com');
localStorage.setItem('phone', '+94 77 123 4567');
localStorage.setItem('address', '123 Main Street, Colombo, Sri Lanka');
```

## Troubleshooting

### Invoice Not Showing Data
1. Check browser console for errors
2. Verify data exists in localStorage
3. Use `debugConfirmationData()` function
4. Clear data and run test again

### PDF Download Not Working
1. Check browser console for PDF library errors
2. Ensure internet connection for CDN libraries
3. Try refreshing the page
4. Check browser compatibility

### Data Not Persisting
1. Check if localStorage is enabled
2. Verify data is being saved correctly
3. Check for JavaScript errors
4. Use test page to verify data flow

## Browser Compatibility
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## Dependencies
- Bootstrap 4/5 (for styling)
- html2canvas (for PDF generation)
- jsPDF (for PDF creation)
- jQuery (for DOM manipulation)

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Use the debug functions provided
3. Test with the provided test pages
4. Verify all files are in the correct locations

## License
This booking system is provided as-is for educational and development purposes.