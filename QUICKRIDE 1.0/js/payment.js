const PAYSTACK_PUBLIC_KEY = 'pk_test_b5ba51a7559df62afa3a190fa28c22288c5f13bf';

class PaymentManager {
    static async initializePayment() {
        if (!selectedBus || !selectedBus.passengerData) {
            QuickRide.showNotification('No booking data found', 'error');
            return;
        }

        const currentUser = QuickRide.AuthManager.getCurrentUser();
        if (!currentUser) {
            QuickRide.showNotification('Please login to continue', 'error');
            return;
        }

        const totalAmount = selectedBus.pricePerSeat * selectedBus.passengers;
        const amountInKobo = totalAmount * 100;

        const reference = `QR_${Date.now()}_${QuickRide.generateId()}`;

        const booking = this.createBookingRecord(reference, totalAmount);

        // Initialize Paystack payment
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: currentUser.email,
            amount: amountInKobo,
            currency: 'GHS',
            ref: reference,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Booking ID",
                        variable_name: "booking_id",
                        value: booking.id
                    },
                    {
                        display_name: "Route",
                        variable_name: "route",
                        value: selectedBus.route
                    },
                    {
                        display_name: "Passengers",
                        variable_name: "passengers",
                        value: selectedBus.passengers
                    }
                ]
            },
            callback: function(response) {
                PaymentManager.handlePaymentSuccess(response, booking);
            },
            onClose: function() {
                PaymentManager.handlePaymentCancellation(booking);
            }
        });

        handler.openIframe();
    }

    static createBookingRecord(reference, totalAmount) {
        const currentUser = QuickRide.AuthManager.getCurrentUser();

        const booking = {
            id: QuickRide.generateId(),
            userId: currentUser.id,
            reference: reference,
            busId: selectedBus.id,
            busCompany: selectedBus.company,
            busType: selectedBus.type,
            from: selectedBus.from,
            to: selectedBus.to,
            route: selectedBus.route,
            date: selectedBus.date,
            time: selectedBus.time,
            passengers: selectedBus.passengers,
            passengerData: selectedBus.passengerData,
            emergencyContact: currentBookingSearch.emergencyContact,
            pricePerSeat: selectedBus.pricePerSeat,
            totalAmount: totalAmount,
            bookingDate: new Date().toISOString().split('T')[0],
            bookingTime: new Date().toLocaleTimeString(),
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString()
        };

        return booking;
    }

    static generateSeatNumbers(count, busId, date, time) {
        const bus = BusManager.buses.find(b => b.id === busId);
        if (!bus) return [];

        // Get already booked seats
        const existingBookings = BusManager.getBookingsForBus(busId, date, time);
        const bookedSeats = existingBookings.flatMap(booking => 
            booking.passengerData ? booking.passengerData.map(p => p.seatNumber) : []
        ).filter(seat => seat);

        // Generate available seat numbers
        const availableSeats = [];
        for (let row = 1; row <= Math.ceil(bus.capacity / 4); row++) {
            for (let seatLetter of ['A', 'B', 'C', 'D']) {
                const seatNumber = `${row}${seatLetter}`;
                if (!bookedSeats.includes(seatNumber) && availableSeats.length < bus.capacity) {
                    availableSeats.push(seatNumber);
                }
            }
        }

        // Return the first 'count' available seats
        return availableSeats.slice(0, count);
    }

    static async handlePaymentSuccess(response, booking) {
        try {
            // Update booking status
            booking.status = 'confirmed';
            booking.paymentStatus = 'completed';
            booking.paymentReference = response.reference;
            booking.transactionId = response.trans || response.transaction;

            // Save booking to localStorage
            BusManager.addBooking(booking);

            // Add tickets to user's account
            const currentUser = QuickRide.AuthManager.getCurrentUser();
            const userTickets = this.generateIndividualTickets(booking);
            
            // Update users array
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                if (!users[userIndex].tickets) users[userIndex].tickets = [];
                users[userIndex].tickets.push(...userTickets);
                localStorage.setItem('users', JSON.stringify(users));
                
                // Update current user
                currentUser.tickets = users[userIndex].tickets;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            // Show success message
            this.showBookingSuccess(booking, userTickets);

            // Clear booking data
            selectedBus = null;
            currentBookingSearch = null;

            // Redirect to tickets page
            setTimeout(() => {
                QuickRide.closeModal('success-modal');
                QuickRide.showSection('my-tickets');
            }, 3000);

        } catch (error) {
            console.error('Error processing payment success:', error);
            QuickRide.showNotification('Payment successful but there was an error processing your booking. Please contact support.', 'warning');
        }
    }

    static generateIndividualTickets(booking) {
        return booking.passengerData.map((passenger, index) => ({
            id: `${booking.id}_${index + 1}`,
            bookingId: booking.id,
            ticketNumber: `QR${Date.now().toString().slice(-6)}${index + 1}`,
            passengerName: passenger.name,
            passengerAge: passenger.age,
            passengerGender: passenger.gender,
            passengerPhone: passenger.phone,
            seatNumber: passenger.seatNumber,
            busId: booking.busId,
            busCompany: booking.busCompany,
            busType: booking.busType,
            from: booking.from,
            to: booking.to,
            route: booking.route,
            date: booking.date,
            time: booking.time,
            pricePerSeat: booking.pricePerSeat,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            status: 'upcoming',
            paymentReference: booking.paymentReference,
            createdAt: new Date().toISOString()
        }));
    }

    static handlePaymentCancellation(booking) {
        // Update booking status to cancelled
        booking.status = 'cancelled';
        booking.paymentStatus = 'cancelled';
        
        QuickRide.showNotification('Payment was cancelled', 'info');
    }

    static showBookingSuccess(booking, tickets) {
        const modal = document.getElementById('success-modal');
        const ticketDetails = document.getElementById('ticket-details');
        
        ticketDetails.innerHTML = `
            <div class="success-booking-summary">
                <h3>Booking Details</h3>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Route:</strong> ${booking.route}</p>
                <p><strong>Date & Time:</strong> ${QuickRide.formatDate(booking.date)} at ${QuickRide.formatTime(booking.time)}</p>
                <p><strong>Bus:</strong> ${booking.busCompany} - ${booking.busType}</p>
                <p><strong>Total Amount:</strong> ${QuickRide.formatCurrency(booking.totalAmount)}</p>
                
                <h4>Individual Tickets Generated:</h4>
                <div class="ticket-list">
                    ${tickets.map(ticket => `
                        <div class="ticket-item">
                            <span><strong>${ticket.passengerName}</strong></span>
                            <span>Seat ${ticket.seatNumber}</span>
                            <span>Ticket #${ticket.ticketNumber}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="success-actions">
                    <p><em>Individual tickets have been generated for each passenger and saved to your account.</em></p>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Update the OK button to show tickets
        const okButton = modal.querySelector('.ok-button');
        okButton.textContent = 'View My Tickets';
        okButton.onclick = () => {
            QuickRide.closeModal('success-modal');
            QuickRide.showSection('my-tickets');
        };
    }

    // Verify payment status (for additional security)
    static async verifyPayment(reference) {
        try {
            // In a real application, this would be done on the server
            // For this demo, we'll simulate verification
            console.log(`Verifying payment with reference: ${reference}`);
            return { status: 'success', verified: true };
        } catch (error) {
            console.error('Payment verification failed:', error);
            return { status: 'failed', verified: false };
        }
    }

    // Handle refunds (for cancellations)
    static async processRefund(ticketId) {
        try {
            // In a real application, this would initiate a refund through Paystack API
            console.log(`Processing refund for ticket: ${ticketId}`);
            QuickRide.showNotification('Refund request initiated. You will receive your money within 5-7 business days.', 'info');
            return true;
        } catch (error) {
            console.error('Refund processing failed:', error);
            QuickRide.showNotification('Failed to process refund. Please contact support.', 'error');
            return false;
        }
    }
}

// Initialize payment function (called from booking.js)
function initializePayment() {
    if (!window.PaystackPop) {
        QuickRide.showNotification('Payment system is not available. Please try again later.', 'error');
        return;
    }
    
    PaymentManager.initializePayment();
}

// Demo mode warning (remove in production)
function showPaystackDemo() {
    if (PAYSTACK_PUBLIC_KEY.includes('your_paystack_public_key_here')) {
        const useDemo = confirm(
            'Demo Mode: No real payment will be processed.\n\n' +
            'To use real payments:\n' +
            '1. Get your Paystack public key from paystack.com\n' +
            '2. Replace PAYSTACK_PUBLIC_KEY in payment.js\n\n' +
            'Continue with demo mode?'
        );
        
        if (!useDemo) {
            return false;
        }
        
        // Override Paystack for demo
        window.PaystackPop = {
            setup: function(options) {
                return {
                    openIframe: function() {
                        // Simulate payment process
                        setTimeout(() => {
                            const confirmed = confirm('Demo Payment\n\nSimulate successful payment?');
                            if (confirmed) {
                                options.callback({
                                    reference: options.ref,
                                    status: 'success',
                                    transaction: 'demo_' + Date.now(),
                                    trans: 'demo_' + Date.now()
                                });
                            } else {
                                options.onClose();
                            }
                        }, 1000);
                    }
                };
            }
        };
    }
    return true;
}

// Initialize Paystack on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in demo mode
    if (PAYSTACK_PUBLIC_KEY.includes('your_paystack_public_key_here')) {
        showPaystackDemo();
    }
});

// Export for global access
window.PaymentManager = PaymentManager;
window.initializePayment = initializePayment;

