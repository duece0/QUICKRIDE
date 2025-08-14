// Ticket management functionality for QuickRide

class TicketManager {
    static getCurrentUserTickets() {
        const currentUser = QuickRide.AuthManager.getCurrentUser();
        if (!currentUser || !currentUser.tickets) {
            return [];
        }
        
        // Update ticket status based on date/time
        return currentUser.tickets.map(ticket => ({
            ...ticket,
            status: this.getTicketStatus(ticket)
        }));
    }

    static getTicketStatus(ticket) {
        if (ticket.status === 'cancelled') return 'cancelled';
        
        const now = new Date();
        const ticketDateTime = new Date(`${ticket.date}T${ticket.time}`);
        
        // If ticket date/time has passed, mark as completed
        if (ticketDateTime < now) {
            return 'completed';
        }
        
        return 'upcoming';
    }

    static filterTickets(tickets, filter) {
        if (filter === 'all') return tickets;
        return tickets.filter(ticket => ticket.status === filter);
    }

    static cancelTicket(ticketId) {
        const currentUser = QuickRide.AuthManager.getCurrentUser();
        if (!currentUser) return false;

        // Find the ticket
        const ticketIndex = currentUser.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex === -1) {
            QuickRide.showNotification('Ticket not found', 'error');
            return false;
        }

        const ticket = currentUser.tickets[ticketIndex];
        
        // Check if ticket can be cancelled (must be upcoming)
        if (ticket.status !== 'upcoming') {
            QuickRide.showNotification('Only upcoming tickets can be cancelled', 'error');
            return false;
        }

        // Check cancellation policy (can't cancel within 2 hours of departure)
        const now = new Date();
        const departureTime = new Date(`${ticket.date}T${ticket.time}`);
        const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

        if (hoursUntilDeparture < 2) {
            QuickRide.showNotification('Cannot cancel ticket within 2 hours of departure', 'error');
            return false;
        }

        // Show cancellation confirmation
        const confirmed = confirm(
            `Cancel Ticket?\n\n` +
            `Passenger: ${ticket.passengerName}\n` +
            `Route: ${ticket.route}\n` +
            `Date: ${QuickRide.formatDate(ticket.date)}\n` +
            `Time: ${QuickRide.formatTime(ticket.time)}\n` +
            `Seat: ${ticket.seatNumber}\n\n` +
            `Cancellation Policy:\n` +
            `- Tickets cancelled more than 24 hours before departure: 90% refund\n` +
            `- Tickets cancelled 2-24 hours before departure: 50% refund\n` +
            `- No refund for cancellations within 2 hours of departure\n\n` +
            `Do you want to proceed with cancellation?`
        );

        if (!confirmed) return false;

        // Calculate refund amount
        const refundPercentage = hoursUntilDeparture >= 24 ? 0.9 : 0.5;
        const refundAmount = ticket.pricePerSeat * refundPercentage;

        // Update ticket status
        currentUser.tickets[ticketIndex].status = 'cancelled';
        currentUser.tickets[ticketIndex].cancelledAt = new Date().toISOString();
        currentUser.tickets[ticketIndex].refundAmount = refundAmount;

        // Update localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].tickets = currentUser.tickets;
            localStorage.setItem('users', JSON.stringify(users));
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Process refund
        PaymentManager.processRefund(ticketId);

        QuickRide.showNotification(
            `Ticket cancelled successfully. Refund of ${QuickRide.formatCurrency(refundAmount)} will be processed.`, 
            'success'
        );

        return true;
    }

    static downloadTicket(ticketId) {
        const currentUser = QuickRide.AuthManager.getCurrentUser();
        if (!currentUser) return;

        const ticket = currentUser.tickets.find(t => t.id === ticketId);
        if (!ticket) {
            QuickRide.showNotification('Ticket not found', 'error');
            return;
        }

        // Create a printable ticket
        this.generatePrintableTicket(ticket);
    }

    static generatePrintableTicket(ticket) {
        const printWindow = window.open('', '_blank');
        const ticketHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>QuickRide Ticket - ${ticket.ticketNumber}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px;
                        background: white;
                    }
                    .ticket {
                        border: 2px solid #667eea;
                        border-radius: 10px;
                        padding: 30px;
                        background: linear-gradient(135deg, #f8f9ff 0%, #e8f1ff 100%);
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .logo {
                        font-size: 2rem;
                        color: #667eea;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .ticket-number {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 10px;
                    }
                    .route {
                        font-size: 1.3rem;
                        color: #667eea;
                        font-weight: bold;
                    }
                    .details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .detail-group {
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                    }
                    .detail-label {
                        font-weight: bold;
                        color: #666;
                        font-size: 0.9rem;
                        margin-bottom: 5px;
                    }
                    .detail-value {
                        color: #333;
                        font-size: 1.1rem;
                    }
                    .passenger-info {
                        background: #667eea;
                        color: white;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .qr-placeholder {
                        width: 100px;
                        height: 100px;
                        background: white;
                        margin: 0 auto 15px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.8rem;
                        color: #666;
                    }
                    .instructions {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .instructions h4 {
                        margin-bottom: 10px;
                        color: #856404;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    @media print {
                        body { margin: 0; }
                        .instructions { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="header">
                        <div class="logo">🚌 QuickRide</div>
                        <div class="ticket-number">Ticket #${ticket.ticketNumber}</div>
                        <div class="route">${ticket.route}</div>
                    </div>
                    
                    <div class="passenger-info">
                        <h3>${ticket.passengerName}</h3>
                        <p>Seat ${ticket.seatNumber} | ${ticket.passengerAge} | ${ticket.passengerGender}</p>
                        <div class="qr-placeholder">QR Code</div>
                        <small>Scan at boarding</small>
                    </div>
                    
                    <div class="details">
                        <div class="detail-group">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">${QuickRide.formatDate(ticket.date)}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">Time</div>
                            <div class="detail-value">${QuickRide.formatTime(ticket.time)}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">Bus Company</div>
                            <div class="detail-value">${ticket.busCompany}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">Bus Type</div>
                            <div class="detail-value">${ticket.busType}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">Price</div>
                            <div class="detail-value">${QuickRide.formatCurrency(ticket.pricePerSeat)}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">${ticket.status.toUpperCase()}</div>
                        </div>
                    </div>
                    
                    <div class="instructions">
                        <h4>Important Instructions:</h4>
                        <ul>
                            <li>Arrive at the boarding point 30 minutes before departure</li>
                            <li>Present this ticket and a valid ID at boarding</li>
                            <li>Keep this ticket throughout your journey</li>
                            <li>Contact support at +233 24 123 4567 for assistance</li>
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>Booked on ${QuickRide.formatDate(ticket.bookingDate)} at ${ticket.bookingTime}</p>
                        <p>Reference: ${ticket.paymentReference || 'N/A'}</p>
                        <p>QuickRide - Your trusted travel partner</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(ticketHTML);
        printWindow.document.close();
    }

    static shareTicket(ticketId) {
        const currentUser = QuickRide.AuthManager.getCurrentUser();
        if (!currentUser) return;

        const ticket = currentUser.tickets.find(t => t.id === ticketId);
        if (!ticket) {
            QuickRide.showNotification('Ticket not found', 'error');
            return;
        }

        const shareText = `🚌 QuickRide Ticket
Passenger: ${ticket.passengerName}
Route: ${ticket.route}
Date: ${QuickRide.formatDate(ticket.date)}
Time: ${QuickRide.formatTime(ticket.time)}
Seat: ${ticket.seatNumber}
Ticket #${ticket.ticketNumber}`;

        if (navigator.share) {
            navigator.share({
                title: 'QuickRide Ticket',
                text: shareText
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                QuickRide.showNotification('Ticket details copied to clipboard', 'success');
            }).catch(() => {
                // If clipboard API fails, show the text in an alert
                alert(shareText);
            });
        }
    }
}

// Display tickets function
function displayTickets(filter = 'all') {
    const container = document.getElementById('tickets-container');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update filter button states
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    // Check if user is logged in
    if (!QuickRide.AuthManager.isLoggedIn()) {
        container.innerHTML = `
            <div class="no-tickets">
                <i class="fas fa-user-lock"></i>
                <h3>Please Login</h3>
                <p>You need to login to view your tickets.</p>
                <button class="cta-button" onclick="showAuthModal('login')">Login</button>
            </div>
        `;
        return;
    }

    // Get and filter tickets
    const allTickets = TicketManager.getCurrentUserTickets();
    const filteredTickets = TicketManager.filterTickets(allTickets, filter);

    if (filteredTickets.length === 0) {
        const messages = {
            all: 'No tickets found',
            upcoming: 'No upcoming trips',
            completed: 'No completed trips',
            cancelled: 'No cancelled tickets'
        };
        
        container.innerHTML = `
            <div class="no-tickets">
                <i class="fas fa-ticket-alt"></i>
                <h3>${messages[filter]}</h3>
                <p>${filter === 'all' ? 
                    "You haven't booked any tickets yet. Start by booking your first trip!" : 
                    `You don't have any ${filter} tickets.`}</p>
                ${filter === 'all' ? 
                    '<button class="cta-button" onclick="QuickRide.showSection(\'booking\')">Book Now</button>' : 
                    ''}
            </div>
        `;
        return;
    }

    // Display tickets
    container.innerHTML = filteredTickets.map(ticket => `
        <div class="ticket-card fade-in">
            <div class="ticket-header">
                <div class="ticket-info">
                    <div class="ticket-id">Ticket #${ticket.ticketNumber}</div>
                    <div class="ticket-date-booked">Booked on ${QuickRide.formatDate(ticket.bookingDate)}</div>
                </div>
                <div class="ticket-status status-${ticket.status}">${ticket.status}</div>
            </div>
            
            <div class="ticket-route">${ticket.route}</div>
            
            <div class="passenger-info">
                <h4>Passenger Information</h4>
                <div class="passenger-item">
                    <div class="passenger-name">${ticket.passengerName}</div>
                    <div class="passenger-seat">Seat ${ticket.seatNumber}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 0.9rem; color: #666;">
                    <div>Age: ${ticket.passengerAge}</div>
                    <div>Gender: ${ticket.passengerGender}</div>
                </div>
            </div>
            
            <div class="ticket-details">
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${QuickRide.formatDate(ticket.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${QuickRide.formatTime(ticket.time)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Bus</div>
                    <div class="detail-value">${ticket.busCompany}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${ticket.busType}</div>
                </div>
            </div>
            
            <div class="ticket-price">
                <div class="price-label">Ticket Price</div>
                <div class="price-amount">${QuickRide.formatCurrency(ticket.pricePerSeat)}</div>
            </div>
            
            <div class="ticket-actions">
                <button class="action-btn btn-primary" onclick="TicketManager.downloadTicket('${ticket.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="action-btn btn-secondary" onclick="TicketManager.shareTicket('${ticket.id}')">
                    <i class="fas fa-share"></i> Share
                </button>
                ${ticket.status === 'upcoming' ? `
                    <button class="action-btn btn-danger" onclick="cancelTicket('${ticket.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
                ${ticket.status === 'cancelled' && ticket.refundAmount ? `
                    <span class="refund-info">
                        Refund: ${QuickRide.formatCurrency(ticket.refundAmount)}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Initialize filter buttons
    filterButtons.forEach(btn => {
        btn.onclick = () => displayTickets(btn.dataset.filter);
    });
}

// Cancel ticket function
function cancelTicket(ticketId) {
    if (TicketManager.cancelTicket(ticketId)) {
        // Refresh the display
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        displayTickets(activeFilter);
    }
}

// Initialize tickets section
function initializeTicketsSection() {
    displayTickets();
}

// Export functions for global access
window.TicketManager = TicketManager;
window.displayTickets = displayTickets;
window.cancelTicket = cancelTicket;

