// ===== SIMPLE CONFIRMATION PAGE =====
// Simple and reliable booking confirmation system

// Global variables
let bookingData = null;
let customerData = null;

// Initialize the confirmation page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Confirmation page loaded');

    // Load booking data
    loadConfirmationData();

    // Setup PDF download
    setupPdfDownload();

    // Debug info
    setTimeout(() => {
        console.log('=== CONFIRMATION PAGE DEBUG ===');
        console.log('Booking data:', bookingData);
        console.log('Customer data:', customerData);
        console.log('URL params:', new URLSearchParams(window.location.search));
        console.log('=== END DEBUG ===');
    }, 1000);
});

// Load booking data from localStorage and URL parameters
function loadConfirmationData() {
    try {
        console.log('Loading confirmation data...');

        // Try to get data from booking data manager first
        if (window.bookingDataManager) {
            bookingData = window.bookingDataManager.getData();
            customerData = window.bookingDataManager.getCustomerData();
            console.log('Loaded data from booking data manager');
        }

        // Fallback to direct localStorage access
        if (!bookingData) {
            const hotelData = localStorage.getItem('hotelBookingData');
            const suiteData = localStorage.getItem('suiteBookingData');

            if (hotelData) {
                bookingData = JSON.parse(hotelData);
                console.log('Loaded hotel booking data from localStorage');
            } else if (suiteData) {
                bookingData = JSON.parse(suiteData);
                console.log('Loaded suite booking data from localStorage');
            }
        }

        // Load customer data
        if (!customerData) {
            customerData = {
                name: localStorage.getItem('customerFullName') || 'Guest Customer',
                email: localStorage.getItem('customerEmail') || 'guest@example.com',
                phone: localStorage.getItem('phone') || 'Not provided',
                address: localStorage.getItem('address') || 'Not provided'
            };
        }

        // Get URL parameters for additional data
        const urlParams = new URLSearchParams(window.location.search);
        let reservationId = urlParams.get('bookingId') || urlParams.get('reservationId');

        // Fallback to localStorage if not in URL
        if (!reservationId) {
            reservationId = localStorage.getItem('lastReservationId');
            console.log('Using reservation ID from localStorage:', reservationId);
        }

        // If still no reservation ID, generate a default one
        if (!reservationId) {
            reservationId = `RES-${Date.now()}`;
            console.log('Generated default reservation ID:', reservationId);
        }

        const urlData = {
            reservationId: reservationId,
            unpaid: urlParams.get('unpaid') === '1'
        };

        console.log('URL data:', urlData);
        console.log('Final reservation ID:', urlData.reservationId);

        // Display the data
        displayConfirmationData(bookingData, customerData, urlData);

    } catch (error) {
        console.error('Error loading confirmation data:', error);
        showError('Failed to load booking confirmation data');
    }
}

// Display confirmation data in the UI
function displayConfirmationData(booking, customer, urlData) {
    try {
        if (!booking) {
            showError('No booking data found. Please try booking again.');
            return;
        }

        console.log('Displaying confirmation data...');

        // Use the actual reservation ID from API response
        const reservationId = urlData.reservationId || 'RES-DEFAULT';
        const invoiceNumber = `INV-${reservationId}`;

        console.log('Using reservation ID:', reservationId);
        console.log('Generated invoice number:', invoiceNumber);

        document.getElementById('invNumber').textContent = invoiceNumber;

        // Set invoice date
        const now = new Date();
        document.getElementById('invDate').textContent = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Customer information
        document.getElementById('billToName').textContent = customer.name;
        document.getElementById('billToEmail').textContent = customer.email;
        document.getElementById('billToPhone').textContent = customer.phone;
        document.getElementById('billToAddress').textContent = customer.address;

        // Reservation details - Use the actual reservation ID from API
        document.getElementById('reservationId').textContent = reservationId;

        if (booking.checkIn) {
            const checkIn = new Date(booking.checkIn);
            document.getElementById('invCheckIn').textContent = checkIn.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (booking.checkOut) {
            const checkOut = new Date(booking.checkOut);
            document.getElementById('invCheckOut').textContent = checkOut.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        document.getElementById('invNights').textContent = booking.numberOfNights || 1;
        document.getElementById('invGuests').textContent = booking.totalGuests || 1;

        // Invoice items
        displayInvoiceItems(booking);

        // Payment status
        updatePaymentStatus(urlData.unpaid);

        console.log('Confirmation data displayed successfully');

    } catch (error) {
        console.error('Error displaying confirmation data:', error);
        showError('Failed to display booking confirmation');
    }
}

// Display invoice items in the table
function displayInvoiceItems(booking) {
    const tbody = document.getElementById('invoiceItems');
    if (!tbody) {
        console.error('Invoice items table not found');
        return;
    }

    tbody.innerHTML = '';

    let items = [];
    let subtotal = 0;

    // Get items from booking data
    if (booking.selectedRoomDetails && Array.isArray(booking.selectedRoomDetails)) {
        items = booking.selectedRoomDetails;
    } else if (booking.roomType) {
        // Single room booking
        items = [{
            roomType: booking.roomType,
            pricePerNight: booking.pricePerNight || 0,
            quantity: booking.numberOfRooms || 1,
            subtotalTotal: booking.totalAmount || 0,
            numberOfNights: booking.numberOfNights || 1
        }];
    } else {
        // Fallback - create item from total
        items = [{
            roomType: 'Hotel Accommodation',
            pricePerNight: Math.round((booking.totalAmount || 0) / (booking.numberOfNights || 1)),
            quantity: 1,
            subtotalTotal: booking.totalAmount || 0,
            numberOfNights: booking.numberOfNights || 1
        }];
    }

    // Add each item to the table
    items.forEach((item, index) => {
        const row = document.createElement('tr');

        const quantity = item.quantity || 1;
        const rate = item.pricePerNight || 0;
        const nights = item.numberOfNights || booking.numberOfNights || 1;
        const amount = item.subtotalTotal || (rate * nights * quantity);

        subtotal += amount;

        row.innerHTML = `
            <td>${item.roomType} × ${nights} Night${nights > 1 ? 's' : ''}</td>
            <td class="text-center">${quantity}</td>
            <td class="text-right">LKR ${rate.toLocaleString()}</td>
            <td class="text-right">LKR ${amount.toLocaleString()}</td>
        `;

        tbody.appendChild(row);
    });

    // Calculate totals
    const serviceCharge = subtotal * 0.10; // 10%
    const tax = subtotal * 0.02; // 2%
    const total = subtotal + serviceCharge + tax;

    // Update total fields
    document.getElementById('subtotalAmt').textContent = `LKR ${subtotal.toLocaleString()}`;
    document.getElementById('serviceAmt').textContent = `LKR ${serviceCharge.toLocaleString()}`;
    document.getElementById('taxAmt').textContent = `LKR ${tax.toLocaleString()}`;
    document.getElementById('totalAmt').textContent = `LKR ${total.toLocaleString()}`;

    console.log(`Displayed ${items.length} invoice items, subtotal: ${subtotal}`);
}

// Update payment status
function updatePaymentStatus(isUnpaid) {
    const badge = document.getElementById('paymentBadge');
    const stamp = document.getElementById('paymentStamp');

    if (isUnpaid) {
        if (badge) {
            badge.innerHTML = `
                <div class="status-icon">
                    <i class="fa fa-exclamation-triangle"></i>
                </div>
                <span>Payment Pending</span>
            `;
            badge.className = 'status-badge status-pending';
        }

        if (stamp) {
            stamp.innerHTML = `
                <div>
                    <i class="fa fa-clock" style="font-size: 1.5rem; margin-bottom: 5px;"></i>
                    <div>PENDING</div>
                </div>
            `;
            stamp.className = 'payment-stamp stamp-pending';
            stamp.style.display = 'flex';
        }
    } else {
        if (badge) {
            badge.innerHTML = `
                <div class="status-icon">
                    <i class="fa fa-check"></i>
                </div>
                <span>Payment Completed</span>
            `;
            badge.className = 'status-badge status-paid';
        }

        if (stamp) {
            stamp.innerHTML = `
                <div>
                    <i class="fa fa-check-circle" style="font-size: 1.5rem; margin-bottom: 5px;"></i>
                    <div>PAID</div>
                </div>
            `;
            stamp.className = 'payment-stamp stamp-paid';
            stamp.style.display = 'flex';
        }
    }
}

// Setup PDF download functionality
function setupPdfDownload() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadInvoicePDF);
    }
}

// Download invoice as PDF
async function downloadInvoicePDF() {
    try {
        console.log('Starting PDF download...');

        // Show loading state
        const btn = document.getElementById('downloadPdfBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;

        // Load PDF libraries
        if (!window.html2canvas) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        // Get invoice section
        const invoiceSection = document.getElementById('invoiceSection');
        if (!invoiceSection) {
            throw new Error('Invoice section not found');
        }

        // Hide download button for PDF
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.style.display = 'none';
        }

        // Generate canvas
        const canvas = await html2canvas(invoiceSection, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        let y = 10;
        pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);

        // Generate filename using reservation ID
        const reservationId = document.getElementById('reservationId').textContent || 'INVOICE';
        const filename = `QueensHotel_Reservation_${reservationId}.pdf`;

        console.log('PDF filename:', filename);

        // Download PDF
        pdf.save(filename);

        // Restore download button
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
        }

        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;

        console.log('PDF downloaded successfully');

    } catch (error) {
        console.error('Error generating PDF:', error);

        // Reset button
        const btn = document.getElementById('downloadPdfBtn');
        if (btn) {
            btn.innerHTML = '<i class="fa fa-download"></i> Download Invoice';
            btn.disabled = false;
        }

        alert('Failed to generate PDF. Please try again.');
    }
}

// Load external script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const contentDiv = document.getElementById('reservationContent');

    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        if (contentDiv) {
            contentDiv.style.display = 'none';
        }
    }

    console.error('Error:', message);
}

// Global debug function
window.debugConfirmation = function() {
    console.log('=== CONFIRMATION DEBUG ===');
    console.log('Booking data:', bookingData);
    console.log('Customer data:', customerData);

    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL params:', Object.fromEntries(urlParams.entries()));

    const reservationId = document.getElementById('reservationId')?.textContent;
    const invoiceNumber = document.getElementById('invNumber')?.textContent;
    console.log('Displayed Reservation ID:', reservationId);
    console.log('Displayed Invoice Number:', invoiceNumber);

    // Check localStorage for reservation data
    const lastReservationId = localStorage.getItem('lastReservationId');
    const reservationTimestamp = localStorage.getItem('reservationTimestamp');
    console.log('Last Reservation ID from localStorage:', lastReservationId);
    console.log('Reservation Timestamp:', reservationTimestamp);

    console.log('localStorage keys:', Object.keys(localStorage));
    console.log('=== END DEBUG ===');
};