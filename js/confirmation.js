
function readBookingData() {
    // Prefer localStorage
    try {
        const cached = localStorage.getItem('hotelBookingData');
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    // Fallback: URL param bd
    try {
        const params = new URLSearchParams(window.location.search);
        const bd = params.get('bd');
        if (bd) {
            const json = decodeURIComponent(escape(atob(bd)));
            return JSON.parse(json);
        }
    } catch (e) {}
    // Fallback: cookie
    try {
        const cookieMatch = document.cookie.match(/(?:^|; )booking_cache=([^;]*)/);
        if (cookieMatch && cookieMatch[1]) {
            return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(cookieMatch[1])))));
        }
    } catch (e) {}
    return null;
}

function readCustomerData() {
    return {
        name: (localStorage.getItem('customerFullName') || '').trim(),
        email: (localStorage.getItem('customerEmail') || '').trim(),
        phone: (localStorage.getItem('phone') || '').trim(),
        address: (localStorage.getItem('address') || '').trim()
    };
}

function readBillingData() {
    try {
        const billingData = localStorage.getItem('lastBillingData');
        if (billingData) {
            return JSON.parse(billingData);
        }
    } catch (e) {
        console.warn('Error reading billing data:', e);
    }
    return null;
}

function formatDateRange(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    return { day, monthYear: `${month}, ${year}`, weekday };
}

function renderInvoice() {
    const booking = readBookingData();
    if (!booking) {
        console.error('No booking data found for invoice rendering');
        return;
    }

    console.log('=== CONFIRMATION PAGE: RENDERING INVOICE ===');
    console.log('Booking data received:', booking);
    console.log('Room details in booking:', booking.selectedRoomDetails);

    const cust = readCustomerData();
    const billing = readBillingData();
    const now = new Date();

    // Generate invoice number (use billing ID if available, otherwise generate random)
    const invoiceNumber = billing?.billingId ?
        `BILL-${billing.billingId}` :
        `${now.getFullYear()}-${(now.getMonth()+1)}${now.getDate()}-${Math.floor(Math.random()*9000+1000)}`;

    document.getElementById('invNumber').textContent = invoiceNumber;
    document.getElementById('invDate').textContent = billing?.billingDate ?
        new Date(billing.billingDate).toLocaleString() :
        now.toLocaleString();

    console.log('Billing data loaded:', billing);

    // Bill to
    document.getElementById('billToName').textContent = cust.name || 'Guest Customer';
    document.getElementById('billToEmail').textContent = cust.email || '-';
    document.getElementById('billToPhone').textContent = cust.phone || '-';
    document.getElementById('billToAddress').textContent = cust.address || '-';

    // Reservation meta - Get reservation ID from multiple sources
    const params = new URLSearchParams(window.location.search);
    let reservationId = params.get('bookingId') || params.get('reservationId');

    // Fallback to localStorage if not found in URL
    if (!reservationId) {
        reservationId = localStorage.getItem('lastReservationId');
        console.log('Reservation ID not found in URL, using localStorage:', reservationId);
    }

    // Additional fallback to sessionStorage
    if (!reservationId) {
        reservationId = sessionStorage.getItem('confirmationReservationId');
        console.log('Reservation ID not found in localStorage, using sessionStorage:', reservationId);
    }

    // Final fallback
    if (!reservationId) {
        reservationId = '-';
        console.warn('No reservation ID found in any source (URL, localStorage, sessionStorage)');
    }

    // Get billing ID from multiple sources
    let billingId = params.get('billingId');
    console.log('Billing ID from URL params:', billingId);

    // Fallback to localStorage if not found in URL
    if (!billingId || billingId === 'N/A') {
        billingId = localStorage.getItem('lastBillingId');
        console.log('Billing ID not found in URL, using localStorage:', billingId);
    }

    // Additional fallback to sessionStorage
    if (!billingId || billingId === 'N/A') {
        billingId = sessionStorage.getItem('confirmationBillingId');
        console.log('Billing ID not found in localStorage, using sessionStorage:', billingId);
    }

    // Try to get billing ID from stored billing data as final fallback
    if (!billingId || billingId === 'N/A') {
        try {
            const billingData = localStorage.getItem('lastBillingData');
            if (billingData) {
                const parsedBillingData = JSON.parse(billingData);
                if (parsedBillingData && parsedBillingData.billingId) {
                    billingId = parsedBillingData.billingId.toString();
                    console.log('Billing ID found in stored billing data:', billingId);
                }
            }
        } catch (e) {
            console.warn('Error reading stored billing data:', e);
        }
    }

    // Final fallback
    if (!billingId || billingId === 'N/A') {
        billingId = '-';
        console.warn('No valid billing ID found in any source (URL, localStorage, sessionStorage, billing data)');
    }

    console.log('Final billing ID to display:', billingId);

    console.log('Using reservation ID for invoice:', reservationId);
    console.log('Using billing ID for invoice:', billingId);

    document.getElementById('reservationId').textContent = reservationId;

    // Display billing ID in the invoice
    const billingIdElement = document.getElementById('billingId');
    if (billingIdElement) {
        billingIdElement.textContent = billingId;
    } else {
        // Create billing ID display if it doesn't exist
        const reservationMeta = document.querySelector('.invoice-parties .text-right');
        if (reservationMeta && billingId !== '-') {
            const billingDiv = document.createElement('div');
            billingDiv.innerHTML = `<strong>Billing ID: ${billingId}</strong>`;
            billingDiv.style.cssText = 'margin-top: 8px; color: #495057;';
            reservationMeta.appendChild(billingDiv);
        }
    }
    const ci = formatDateRange(booking.checkIn);
    const co = formatDateRange(booking.checkOut);
    document.getElementById('invCheckIn').textContent = `${ci.day} ${ci.monthYear} (${ci.weekday})`;
    document.getElementById('invCheckOut').textContent = `${co.day} ${co.monthYear} (${co.weekday})`;
    document.getElementById('invNights').textContent = booking.numberOfNights || '-';
    document.getElementById('invGuests').textContent = booking.totalGuests || ((booking.adults||0)+(booking.children||0)) || '-';

    // Items
    const tbody = document.getElementById('invoiceItems');
    tbody.innerHTML = '';
    let subtotal = 0;

    console.log('Rendering invoice items. Booking data:', booking);
    console.log('Selected room details:', booking.selectedRoomDetails);

    if (Array.isArray(booking.selectedRoomDetails) && booking.selectedRoomDetails.length > 0) {
        console.log('Found room details, rendering individual room items');
        booking.selectedRoomDetails.forEach((room, index) => {
            console.log(`Room ${index + 1}:`, room);
            const tr = document.createElement('tr');
            const qty = room.quantity || 1;
            const rate = room.pricePerNight || (room.subtotalTotal && booking.numberOfNights ? (room.subtotalTotal/booking.numberOfNights/qty) : 0);
            const amount = room.subtotalTotal || (rate * qty * (booking.numberOfNights||1));
            subtotal += amount || 0;

            // Include room ID in display if available
            const roomDisplayName = room.roomId ? `${room.roomType} (ID: ${room.roomId})` : room.roomType;

            tr.innerHTML = `
                <td>${roomDisplayName} x ${booking.numberOfNights||1} Night(s)</td>
                <td class="text-center">${qty}</td>
                <td class="text-right">LKR ${Math.round(rate).toLocaleString()}</td>
                <td class="text-right">LKR ${Math.round(amount).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
        console.log('Rendered', booking.selectedRoomDetails.length, 'room items');
    } else {
        console.log('No room details found, using fallback display');
        // Fallback single line
        const tr = document.createElement('tr');
        const amount = booking.totalAmount || 0;
        subtotal = amount;
        tr.innerHTML = `
            <td>${booking.totalRooms||1} Room(s) x ${booking.numberOfNights||1} Night(s)</td>
            <td class="text-center">${booking.totalRooms||1}</td>
            <td class="text-right">-</td>
            <td class="text-right">LKR ${Math.round(amount).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    }

    console.log('Invoice subtotal calculated:', subtotal);

    const tax = 0; // Adjust if needed
    const total = booking.totalAmount || subtotal + tax;
    document.getElementById('subtotalAmt').textContent = `LKR ${Math.round(subtotal).toLocaleString()}`;
    document.getElementById('taxAmt').textContent = `LKR ${Math.round(tax).toLocaleString()}`;
    document.getElementById('totalAmt').textContent = `LKR ${Math.round(total).toLocaleString()}`;

    // Payment badge - use billing data if available
    const unpaid = (new URLSearchParams(window.location.search).get('unpaid')) === '1';
    const paymentStatus = billing?.paymentStatus || (unpaid ? 'Pending' : 'Paid');

    const badge = document.getElementById('paymentBadge');
    badge.textContent = paymentStatus.toUpperCase();

    // Set badge color based on payment status
    if (paymentStatus.toLowerCase() === 'paid' || paymentStatus.toLowerCase() === 'completed') {
        badge.className = 'badge badge-success';
    } else if (paymentStatus.toLowerCase() === 'pending') {
        badge.className = 'badge badge-warning';
    } else {
        badge.className = 'badge badge-secondary';
    }

    console.log('Payment status set to:', paymentStatus);
}

async function downloadInvoicePdf() {
    const section = document.getElementById('invoiceSection');
    if (!section) return;
    // Temporarily hide UI-only elements (like download button) from the PDF capture
    const toHide = Array.from(document.querySelectorAll('.no-print, #downloadPdfBtn'));
    const prevDisplays = toHide.map(el => el.style.display);
    toHide.forEach(el => { el.style.display = 'none'; });
    // Load libs dynamically if not present
    if (!window.html2canvas) {
        await new Promise(r => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = r; document.body.appendChild(s);
        });
    }
    if (!window.jspdf) {
        await new Promise(r => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = r; document.body.appendChild(s);
        });
    }
    const canvas = await html2canvas(section, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // margins
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let y = 10;
    pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
    pdf.save('invoice.pdf');
    // Restore hidden elements after capture
    toHide.forEach((el, idx) => { el.style.display = prevDisplays[idx]; });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CONFIRMATION PAGE LOADED ===');
    console.log('URL parameters:', window.location.search);
    console.log('localStorage lastReservationId:', localStorage.getItem('lastReservationId'));

    renderInvoice();
    const btn = document.getElementById('downloadPdfBtn');
    if (btn) btn.addEventListener('click', downloadInvoicePdf);

    // Verify reservation ID is displayed after rendering
    setTimeout(() => {
        const displayedReservationId = document.getElementById('reservationId')?.textContent;
        console.log('Reservation ID displayed in invoice:', displayedReservationId);
    }, 100);
});

// Setup account header functionality
function setupAccountHeader() {
    const customerId = localStorage.getItem('customerId');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userName = localStorage.getItem('userName');

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

            const customerFullName = localStorage.getItem('customerFullName');
            const customerEmail = localStorage.getItem('customerEmail');

            if (customerNameDisplay) {
                customerNameDisplay.textContent = customerFullName || userName || 'Account';
            }

            if (customerEmailDisplay) {
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

// Show account information modal/alert
function showAccountInfo() {
    const customerId = localStorage.getItem('customerId');
    const userName = localStorage.getItem('userName');
    const authTimestamp = localStorage.getItem('authTimestamp');

    if (authTimestamp) {
        const loginDate = new Date(parseInt(authTimestamp)).toLocaleString();
        alert(`Account Information:\n\nCustomer ID: ${customerId}\nUsername: ${userName}\nLast Login: ${loginDate}`);
    } else {
        alert(`Account Information:\n\nCustomer ID: ${customerId}\nUsername: ${userName}`);
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

        // Clear booking data
        const bookingKeys = [
            'hotelBookingData',
            'hotelBookingTimestamp',
            'selectedRoomDetails',
            'bookingSummary',
            'hotel_booking_cache',
            'redirect_after_login'
        ];

        bookingKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Use DataCacheManager if available
        if (window.dataCacheManager) {
            window.dataCacheManager.forceCleanupAllData();
        }

        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// Function to debug reservation and billing data
window.debugReservationId = function() {
    console.log('=== RESERVATION & BILLING DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('URL search params:', window.location.search);

    const params = new URLSearchParams(window.location.search);
    console.log('bookingId from URL:', params.get('bookingId'));
    console.log('reservationId from URL:', params.get('reservationId'));
    console.log('billingId from URL:', params.get('billingId'));

    console.log('lastReservationId from localStorage:', localStorage.getItem('lastReservationId'));
    console.log('lastBillingId from localStorage:', localStorage.getItem('lastBillingId'));
    console.log('reservationTimestamp from localStorage:', localStorage.getItem('reservationTimestamp'));
    console.log('confirmationReservationId from sessionStorage:', sessionStorage.getItem('confirmationReservationId'));
    console.log('confirmationBillingId from sessionStorage:', sessionStorage.getItem('confirmationBillingId'));

    const displayedReservationId = document.getElementById('reservationId')?.textContent;
    const displayedBillingId = document.getElementById('billingId')?.textContent;
    console.log('Currently displayed reservation ID:', displayedReservationId);
    console.log('Currently displayed billing ID:', displayedBillingId);

    // Billing data
    const billingData = localStorage.getItem('lastBillingData');
    console.log('Billing data from localStorage:', billingData);
    if (billingData) {
        try {
            const parsed = JSON.parse(billingData);
            console.log('Parsed billing data:', parsed);
        } catch (e) {
            console.error('Error parsing billing data:', e);
        }
    }

    console.log('=== END RESERVATION & BILLING DEBUG ===');
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAccountHeader();

    try {
        const params = new URLSearchParams(window.location.search);
        const isUnpaid = params.get('unpaid') === '1';
        if (isUnpaid) {
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
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Booking Pending Payment</h3>
                <p style="margin: 0 0 12px 0; font-size: 16px;">Please complete your payment before <strong>7:00 PM today</strong> to secure your reservation. Otherwise, it may be cancelled automatically.</p>
                <button id="dismissUnpaidBanner" class="btn btn-warning" style="padding: 6px 16px; font-size: 14px;">OK</button>
            `;
            const container = document.querySelector('.container');
            if (container) {
                container.insertBefore(messageDiv, container.firstChild);
            }
            const okBtn = document.getElementById('dismissUnpaidBanner');
            if (okBtn) {
                okBtn.addEventListener('click', function() {
                    if (messageDiv && messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Unable to render unpaid banner:', e);
    }
});