// ===== INVOICE MANAGER =====
// Robust invoice system for hotel booking confirmations

class InvoiceManager {
    constructor() {
        this.bookingData = null;
        this.customerData = null;
        this.invoiceNumber = null;
    }

    // Initialize the invoice system
    async init() {
        console.log('Initializing Invoice Manager...');
        await this.loadBookingData();
        this.generateInvoiceNumber();
        this.renderInvoice();
        this.setupEventListeners();
    }

    // Load booking data from localStorage with multiple fallback strategies
    async loadBookingData() {
        console.log('Loading booking data...');

        try {
            // Try different localStorage keys
            const storageKeys = [
                'hotelBookingData',
                'suiteBookingData',
                'bookingData',
                'selectedRoomDetails'
            ];

            let bookingData = null;

            for (const key of storageKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`Found data in ${key}:`, parsed);

                        if (key === 'selectedRoomDetails') {
                            // Reconstruct booking data from room details
                            bookingData = this.reconstructFromRoomDetails(parsed);
                        } else {
                            bookingData = parsed;
                        }
                        break;
                    } catch (e) {
                        console.warn(`Error parsing ${key}:`, e);
                    }
                }
            }

            if (!bookingData) {
                // Create sample data for testing
                console.log('No booking data found, creating sample data...');
                bookingData = this.createSampleBookingData();
            }

            this.bookingData = bookingData;
            console.log('Final booking data:', this.bookingData);

            // Load customer data
            this.customerData = {
                name: localStorage.getItem('customerFullName') || 'Guest Customer',
                email: localStorage.getItem('customerEmail') || 'guest@example.com',
                phone: localStorage.getItem('phone') || 'Not provided',
                address: localStorage.getItem('address') || 'Not provided'
            };

            console.log('Customer data:', this.customerData);

        } catch (error) {
            console.error('Error loading booking data:', error);
            this.showError('Failed to load booking data');
        }
    }

    // Reconstruct booking data from room details
    reconstructFromRoomDetails(roomDetails) {
        if (!Array.isArray(roomDetails) || roomDetails.length === 0) {
            return null;
        }

        const totalAmount = roomDetails.reduce((sum, room) => sum + (room.subtotalTotal || 0), 0);
        const numberOfNights = roomDetails[0]?.numberOfNights || 1;

        return {
            selectedRoomDetails: roomDetails,
            totalAmount: totalAmount,
            numberOfNights: numberOfNights,
            totalGuests: roomDetails.reduce((sum, room) => sum + (room.quantity || 1), 0),
            checkIn: localStorage.getItem('checkIn') || new Date().toISOString().split('T')[0],
            checkOut: localStorage.getItem('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            bookingType: 'hotel'
        };
    }

    // Create sample booking data for testing
    createSampleBookingData() {
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

    // Generate unique invoice number
    generateInvoiceNumber() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        this.invoiceNumber = `QH-${dateStr}-${timeStr}`;
        console.log('Generated invoice number:', this.invoiceNumber);
    }

    // Render the complete invoice
    renderInvoice() {
        if (!this.bookingData) {
            this.showError('No booking data available');
            return;
        }

        try {
            this.renderInvoiceHeader();
            this.renderCustomerInfo();
            this.renderBookingDetails();
            this.renderInvoiceTable();
            this.renderTotals();
            this.updatePaymentStatus();

            console.log('Invoice rendered successfully');
            this.showSuccess('Invoice loaded successfully');

        } catch (error) {
            console.error('Error rendering invoice:', error);
            this.showError('Failed to render invoice');
        }
    }

    // Render invoice header
    renderInvoiceHeader() {
        const invoiceNumberEl = document.getElementById('invNumber');
        const invoiceDateEl = document.getElementById('invDate');

        if (invoiceNumberEl) {
            invoiceNumberEl.textContent = this.invoiceNumber;
        }

        if (invoiceDateEl) {
            const now = new Date();
            invoiceDateEl.textContent = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Render customer information
    renderCustomerInfo() {
        const elements = {
            billToName: document.getElementById('billToName'),
            billToEmail: document.getElementById('billToEmail'),
            billToPhone: document.getElementById('billToPhone'),
            billToAddress: document.getElementById('billToAddress')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                const field = key.replace('billTo', '').toLowerCase();
                elements[key].textContent = this.customerData[field] || 'Not provided';
            }
        });
    }

    // Render booking details
    renderBookingDetails() {
        const elements = {
            reservationId: document.getElementById('reservationId'),
            invCheckIn: document.getElementById('invCheckIn'),
            invCheckOut: document.getElementById('invCheckOut'),
            invNights: document.getElementById('invNights'),
            invGuests: document.getElementById('invGuests')
        };

        // Reservation ID
        if (elements.reservationId) {
            const urlParams = new URLSearchParams(window.location.search);
            elements.reservationId.textContent = urlParams.get('bookingId') || `RES-${Date.now()}`;
        }

        // Dates
        if (this.bookingData.checkIn) {
            const checkIn = new Date(this.bookingData.checkIn);
            if (elements.invCheckIn) {
                elements.invCheckIn.textContent = checkIn.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        if (this.bookingData.checkOut) {
            const checkOut = new Date(this.bookingData.checkOut);
            if (elements.invCheckOut) {
                elements.invCheckOut.textContent = checkOut.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        // Nights and guests
        if (elements.invNights) {
            elements.invNights.textContent = this.bookingData.numberOfNights || 1;
        }

        if (elements.invGuests) {
            elements.invGuests.textContent = this.bookingData.totalGuests || 1;
        }
    }

    // Render invoice table with booking items
    renderInvoiceTable() {
        const tbody = document.getElementById('invoiceItems');
        if (!tbody) {
            console.error('Invoice items table not found');
            return;
        }

        tbody.innerHTML = '';

        let items = [];

        // Get items from booking data
        if (this.bookingData.selectedRoomDetails && Array.isArray(this.bookingData.selectedRoomDetails)) {
            items = this.bookingData.selectedRoomDetails;
        } else if (this.bookingData.roomType) {
            // Single room booking
            items = [{
                roomType: this.bookingData.roomType,
                pricePerNight: this.bookingData.pricePerNight || 0,
                quantity: this.bookingData.numberOfRooms || 1,
                subtotalTotal: this.bookingData.totalAmount || 0,
                numberOfNights: this.bookingData.numberOfNights || 1
            }];
        } else {
            // Fallback - create item from total
            items = [{
                roomType: 'Hotel Accommodation',
                pricePerNight: Math.round((this.bookingData.totalAmount || 0) / (this.bookingData.numberOfNights || 1)),
                quantity: 1,
                subtotalTotal: this.bookingData.totalAmount || 0,
                numberOfNights: this.bookingData.numberOfNights || 1
            }];
        }

        // Render each item
        items.forEach((item, index) => {
            const row = this.createInvoiceRow(item, index);
            tbody.appendChild(row);
        });

        console.log(`Rendered ${items.length} invoice items`);
    }

    // Create invoice table row
    createInvoiceRow(item, index) {
        const tr = document.createElement('tr');

        const quantity = item.quantity || 1;
        const rate = item.pricePerNight || 0;
        const nights = item.numberOfNights || this.bookingData.numberOfNights || 1;
        const amount = item.subtotalTotal || (rate * nights * quantity);

        // Build description
        let description = item.roomType || 'Room';

        if (nights > 1) {
            description += ` × ${nights} Night${nights > 1 ? 's' : ''}`;
        }

        if (item.features && Array.isArray(item.features)) {
            description += `<br><small class="text-muted">Features: ${item.features.join(', ')}</small>`;
        }

        tr.innerHTML = `
            <td>${description}</td>
            <td class="text-center">${quantity}</td>
            <td class="text-right">LKR ${rate.toLocaleString()}</td>
            <td class="text-right">LKR ${amount.toLocaleString()}</td>
        `;

        return tr;
    }

    // Render totals
    renderTotals() {
        const subtotal = this.calculateSubtotal();
        const serviceCharge = subtotal * 0.10; // 10%
        const tax = subtotal * 0.02; // 2%
        const total = subtotal + serviceCharge + tax;

        const elements = {
            subtotalAmt: document.getElementById('subtotalAmt'),
            serviceAmt: document.getElementById('serviceAmt'),
            taxAmt: document.getElementById('taxAmt'),
            totalAmt: document.getElementById('totalAmt')
        };

        if (elements.subtotalAmt) {
            elements.subtotalAmt.textContent = `LKR ${subtotal.toLocaleString()}`;
        }

        if (elements.serviceAmt) {
            elements.serviceAmt.textContent = `LKR ${serviceCharge.toLocaleString()}`;
        }

        if (elements.taxAmt) {
            elements.taxAmt.textContent = `LKR ${tax.toLocaleString()}`;
        }

        if (elements.totalAmt) {
            elements.totalAmt.textContent = `LKR ${total.toLocaleString()}`;
        }

        console.log('Totals calculated:', { subtotal, serviceCharge, tax, total });
    }

    // Calculate subtotal from invoice items
    calculateSubtotal() {
        if (this.bookingData.selectedRoomDetails && Array.isArray(this.bookingData.selectedRoomDetails)) {
            return this.bookingData.selectedRoomDetails.reduce((sum, item) => {
                return sum + (item.subtotalTotal || 0);
            }, 0);
        }

        return this.bookingData.totalAmount || 0;
    }

    // Update payment status
    updatePaymentStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const unpaid = urlParams.get('unpaid') === '1';

        const badge = document.getElementById('paymentBadge');
        const stamp = document.getElementById('paymentStamp');

        if (badge) {
            if (unpaid) {
                badge.innerHTML = `
                    <div class="status-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <span>Payment Pending</span>
                `;
                badge.className = 'status-badge status-pending';
            } else {
                badge.innerHTML = `
                    <div class="status-icon">
                        <i class="fa fa-check"></i>
                    </div>
                    <span>Payment Completed</span>
                `;
                badge.className = 'status-badge status-paid';
            }
        }

        if (stamp) {
            if (unpaid) {
                stamp.innerHTML = `
                    <div>
                        <i class="fa fa-clock" style="font-size: 1.5rem; margin-bottom: 5px;"></i>
                        <div>PENDING</div>
                    </div>
                `;
                stamp.className = 'payment-stamp stamp-pending';
                stamp.style.display = 'flex';
            } else {
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

    // Setup event listeners
    setupEventListeners() {
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPDF());
        }
    }

    // Download PDF functionality
    async downloadPDF() {
        try {
            this.showSuccess('Generating PDF...', 2000);

            const invoiceSection = document.getElementById('invoiceSection');
            if (!invoiceSection) {
                throw new Error('Invoice section not found');
            }

            // Load PDF libraries if not already loaded
            if (!window.html2canvas) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            }

            if (!window.jspdf) {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            // Hide elements that shouldn't be in PDF
            const elementsToHide = document.querySelectorAll('.no-print, #downloadPdfBtn');
            const originalDisplay = Array.from(elementsToHide).map(el => el.style.display);
            elementsToHide.forEach(el => el.style.display = 'none');

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

            // Generate filename
            const filename = `QueensHotel_Invoice_${this.invoiceNumber}.pdf`;

            // Download PDF
            pdf.save(filename);

            // Restore hidden elements
            elementsToHide.forEach((el, index) => {
                el.style.display = originalDisplay[index];
            });

            this.showSuccess('PDF downloaded successfully!', 3000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showError('Failed to generate PDF. Please try again.');
        }
    }

    // Load external script
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Show success message
    showSuccess(message, duration = 3000) {
        this.showAlert(message, 'success', duration);
    }

    // Show error message
    showError(message, duration = 5000) {
        this.showAlert(message, 'error', duration);
    }

    // Show alert message
    showAlert(message, type = 'info', duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
        `;

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        alertDiv.style.backgroundColor = colors[type] || colors.info;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        if (duration > 0) {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, duration);
        }
    }
}

// Global instance
let invoiceManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    invoiceManager = new InvoiceManager();
    invoiceManager.init();
});

// Global functions for debugging
window.debugInvoice = function() {
    if (invoiceManager) {
        console.log('=== INVOICE DEBUG ===');
        console.log('Booking Data:', invoiceManager.bookingData);
        console.log('Customer Data:', invoiceManager.customerData);
        console.log('Invoice Number:', invoiceManager.invoiceNumber);
        console.log('=== END DEBUG ===');
    } else {
        console.log('Invoice manager not initialized');
    }
};

window.refreshInvoice = function() {
    if (invoiceManager) {
        invoiceManager.renderInvoice();
        invoiceManager.showSuccess('Invoice refreshed');
    }
};

window.downloadInvoicePDF = function() {
    if (invoiceManager) {
        invoiceManager.downloadPDF();
    }
};