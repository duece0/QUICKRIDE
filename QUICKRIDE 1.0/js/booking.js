// Booking functionality for QuickRide Bus Ticket System

// Bus data and management
class BusManager {
    static buses = [
        {
            id: 'bus001',
            company: 'VIP Transport',
            type: 'VIP',
            capacity: 30,
            amenities: ['AC', 'WiFi', 'TV', 'Reclining Seats'],
            pricePerSeat: 65,
            routes: ['accra-kumasi', 'kumasi-accra', 'accra-cape-coast', 'cape-coast-accra', 'accra-tamale', 'tamale-accra']
        },
        {
            id: 'bus002',
            company: 'STC Intercity',
            type: 'Business',
            capacity: 45,
            amenities: ['AC', 'WiFi', 'USB Charging'],
            pricePerSeat: 45,
            routes: ['accra-kumasi', 'kumasi-accra', 'accra-tamale', 'tamale-accra', 'accra-sunyani', 'sunyani-accra']
        },
        {
            id: 'bus003',
            company: 'Metro Mass Transit',
            type: 'Economy',
            capacity: 55,
            amenities: ['AC', 'Radio'],
            pricePerSeat: 25,
            routes: ['accra-tema', 'tema-accra', 'accra-takoradi', 'takoradi-accra', 'accra-ho', 'ho-accra']
        },
        {
            id: 'bus004',
            company: 'KPTC',
            type: 'Business',
            capacity: 40,
            amenities: ['AC', 'WiFi', 'Reading Light'],
            pricePerSeat: 50,
            routes: ['kumasi-tamale', 'tamale-kumasi', 'kumasi-cape-coast', 'cape-coast-kumasi', 'kumasi-sunyani', 'sunyani-kumasi']
        },
        {
            id: 'bus005',
            company: 'Golden Express',
            type: 'VIP',
            capacity: 28,
            amenities: ['AC', 'WiFi', 'TV', 'Meal Service', 'Reclining Seats'],
            pricePerSeat: 70,
            routes: ['accra-kumasi', 'kumasi-accra', 'accra-takoradi', 'takoradi-accra', 'accra-bolgatanga', 'bolgatanga-accra']
        },
        {
            id: 'bus006',
            company: 'Northern Star',
            type: 'Business',
            capacity: 35,
            amenities: ['AC', 'WiFi', 'USB Charging'],
            pricePerSeat: 55,
            routes: ['tamale-bolgatanga', 'bolgatanga-tamale', 'tamale-wa', 'wa-tamale', 'tamale-yendi', 'yendi-tamale']
        },
        {
            id: 'bus007',
            company: 'Volta Express',
            type: 'Economy',
            capacity: 50,
            amenities: ['AC', 'Radio'],
            pricePerSeat: 30,
            routes: ['ho-koforidua', 'koforidua-ho', 'ho-accra', 'accra-ho', 'ho-tema', 'tema-ho']
        },
        {
            id: 'bus008',
            company: 'Central Connect',
            type: 'Business',
            capacity: 42,
            amenities: ['AC', 'WiFi', 'Reading Light'],
            pricePerSeat: 48,
            routes: ['cape-coast-takoradi', 'takoradi-cape-coast', 'cape-coast-sunyani', 'sunyani-cape-coast', 'cape-coast-accra', 'accra-cape-coast']
        }
    ];

    static schedules = [
        { time: '06:00', available: true },
        { time: '08:00', available: true },
        { time: '10:00', available: true },
        { time: '12:00', available: true },
        { time: '14:00', available: true },
        { time: '16:00', available: true },
        { time: '18:00', available: true },
        { time: '20:00', available: true }
    ];

    static getAvailableBuses(from, to, date, time) {
        const routeKey = `${from}-${to}`;
        const availableBuses = this.buses.filter(bus => 
            bus.routes.includes(routeKey)
        );

        return availableBuses.map(bus => {
            const bookings = this.getBookingsForBus(bus.id, date, time);
            const bookedSeats = bookings.reduce((total, booking) => total + booking.passengers, 0);
            const availableSeats = bus.capacity - bookedSeats;
            
            return {
                ...bus,
                route: `${QuickRide.getCityDisplayName(from)} → ${QuickRide.getCityDisplayName(to)}`,
                date,
                time,
                availableSeats,
                bookedSeats,
                status: this.getBusStatus(availableSeats, bus.capacity)
            };
        });
    }

    static getBusStatus(availableSeats, capacity) {
        const percentage = (availableSeats / capacity) * 100;
        
        if (availableSeats === 0) return 'full';
        if (percentage <= 20) return 'few-seats';
        return 'available';
    }

    static getBookingsForBus(busId, date, time) {
        // Get all bookings from localStorage
        const allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
        
        return allBookings.filter(booking => 
            booking.busId === busId && 
            booking.date === date && 
            booking.time === time &&
            booking.status !== 'cancelled'
        );
    }

    static addBooking(booking) {
        const allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
        allBookings.push(booking);
        localStorage.setItem('allBookings', JSON.stringify(allBookings));
    }

    static getAvailableTimeSlots(from, to, date) {
        const routeKey = `${from}-${to}`;
        const availableSlots = [];
        
        this.schedules.forEach(schedule => {
            const busesForSlot = this.buses.filter(bus => bus.routes.includes(routeKey));
            const hasAvailableBus = busesForSlot.some(bus => {
                const bookings = this.getBookingsForBus(bus.id, date, schedule.time);
                const bookedSeats = bookings.reduce((total, booking) => total + booking.passengers, 0);
                return bookedSeats < bus.capacity;
            });
            
            if (hasAvailableBus) {
                availableSlots.push(schedule);
            }
        });
        
        return availableSlots;
    }
}

// Booking form management
let currentBookingSearch = null;

function initializeBookingForm() {
    const form = document.getElementById('booking-form');
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');
    const dateInput = document.getElementById('departure-date');
    const timeSelect = document.getElementById('departure-time');

    // Prevent selecting same origin and destination
    fromSelect.addEventListener('change', function() {
        const selectedFrom = this.value;
        Array.from(toSelect.options).forEach(option => {
            option.disabled = option.value === selectedFrom && option.value !== '';
        });
        if (toSelect.value === selectedFrom) {
            toSelect.value = '';
        }
        updateTimeSlots();
    });

    toSelect.addEventListener('change', function() {
        const selectedTo = this.value;
        Array.from(fromSelect.options).forEach(option => {
            option.disabled = option.value === selectedTo && option.value !== '';
        });
        if (fromSelect.value === selectedTo) {
            fromSelect.value = '';
        }
        updateTimeSlots();
    });

    // Update time slots when date changes
    dateInput.addEventListener('change', updateTimeSlots);

    function updateTimeSlots() {
        const from = fromSelect.value;
        const to = toSelect.value;
        const date = dateInput.value;
        
        timeSelect.innerHTML = '<option value="">Select time</option>';
        
        if (from && to && date) {
            const availableSlots = BusManager.getAvailableTimeSlots(from, to, date);
            
            // Filter out past times for today's date
            const today = new Date().toISOString().split('T')[0];
            const currentTime = new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const filteredSlots = availableSlots.filter(slot => {
                if (date === today) {
                    return slot.time > currentTime;
                }
                return true;
            });
            
            filteredSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = QuickRide.formatTime(slot.time);
                timeSelect.appendChild(option);
            });
            
            if (filteredSlots.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No buses available for this route at this time';
                option.disabled = true;
                timeSelect.appendChild(option);
            }
        }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!QuickRide.AuthManager.isLoggedIn()) {
            QuickRide.showNotification('Please login to search for buses', 'warning');
            showAuthModal('login');
            return;
        }
        
        searchBuses();
    });
}

function searchBuses() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('departure-date').value;
    const time = document.getElementById('departure-time').value;
    const passengers = parseInt(document.getElementById('passengers').value);

    // Emergency contact fields
    const emergencyName = document.getElementById('emergency-name').value.trim();
    const emergencyPhone = document.getElementById('emergency-phone').value.trim();
    const emergencyRelationship = document.getElementById('emergency-relationship').value;
    const emergencyEmail = document.getElementById('emergency-email').value.trim();

    // Validate form
    if (!from || !to || !date || !time || !passengers) {
        QuickRide.showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (from === to) {
        QuickRide.showNotification('Origin and destination cannot be the same', 'error');
        return;
    }

    // Validate emergency contact
    if (!emergencyName || !emergencyPhone || !emergencyRelationship) {
        QuickRide.showNotification('Please provide emergency contact information', 'error');
        return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(emergencyPhone)) {
        QuickRide.showNotification('Please enter a valid emergency contact phone number', 'error');
        return;
    }

    // Validate email if provided
    if (emergencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emergencyEmail)) {
        QuickRide.showNotification('Please enter a valid emergency contact email', 'error');
        return;
    }

    // Store search criteria including emergency contact
    currentBookingSearch = {
        from,
        to,
        date,
        time,
        passengers,
        emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelationship,
            email: emergencyEmail
        }
    };

    // Get available buses
    const buses = BusManager.getAvailableBuses(from, to, date, time);
    
    console.log('Search completed. Found buses:', buses);
    console.log('Current search:', currentBookingSearch);
    
    // Display buses
    displayBusResults(buses);
    
    console.log('About to show available-buses section');
    // Show available buses section
    QuickRide.showSection('available-buses');
    console.log('Section should be shown now');
}

function displayBusResults(buses) {
    const container = document.getElementById('buses-container');
    
    if (buses.length === 0) {
        container.innerHTML = `
            <div class="no-buses">
                <i class="fas fa-bus"></i>
                <h3>No buses available</h3>
                <p>Sorry, no buses are available for the selected route and time.</p>
                <button class="cta-button" onclick="QuickRide.showSection('booking')">Search Again</button>
            </div>
        `;
        return;
    }

    container.innerHTML = buses.map(bus => `
        <div class="bus-card ${bus.status === 'full' ? 'full' : ''}">
            <div class="bus-header">
                <div class="bus-company">${bus.company}</div>
                <div class="bus-status status-${bus.status}">
                    ${bus.status === 'full' ? 'FULL' : 
                      bus.status === 'few-seats' ? `${bus.availableSeats} SEATS LEFT` : 
                      'AVAILABLE'}
                </div>
            </div>
            
            <div class="bus-route">${bus.route}</div>
            
            <div class="bus-details">
                <div class="detail-item">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${bus.type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${QuickRide.formatDate(currentBookingSearch.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${QuickRide.formatTime(currentBookingSearch.time)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Available</div>
                    <div class="detail-value">${bus.availableSeats}/${bus.capacity}</div>
                </div>
            </div>
            
            <div class="bus-amenities">
                ${bus.amenities.map(amenity => `
                    <div class="amenity">
                        <i class="fas fa-${getAmenityIcon(amenity)}"></i>
                        <span>${amenity}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="bus-pricing">
                <div class="price-label">Price per person</div>
                <div class="price-value">${QuickRide.formatCurrency(bus.pricePerSeat)}</div>
            </div>
            
            <div class="bus-actions">
                <button class="select-bus-btn" 
                        onclick="selectBus('${bus.id}')" 
                        ${bus.availableSeats < currentBookingSearch.passengers ? 'disabled' : ''}>
                    ${bus.availableSeats < currentBookingSearch.passengers ? 
                      'Not Enough Seats' : 'Select Bus'}
                </button>
            </div>
        </div>
    `).join('');
}

function getAmenityIcon(amenity) {
    const icons = {
        'AC': 'snowflake',
        'WiFi': 'wifi',
        'TV': 'tv',
        'USB Charging': 'charging-station',
        'Meal Service': 'utensils',
        'Reclining Seats': 'bed',
        'Reading Light': 'lightbulb',
        'Radio': 'radio'
    };
    return icons[amenity] || 'check';
}

function selectBus(busId) {
    const bus = BusManager.buses.find(b => b.id === busId);
    if (!bus) return;

    selectedBus = {
        ...bus,
        route: `${QuickRide.getCityDisplayName(currentBookingSearch.from)} → ${QuickRide.getCityDisplayName(currentBookingSearch.to)}`,
        ...currentBookingSearch
    };

    // Show passenger details modal
    showPassengerDetailsModal();
}

function showPassengerDetailsModal() {
    const modal = document.getElementById('passenger-modal');
    const container = document.getElementById('passenger-forms-container');
    const busInfo = document.getElementById('selected-bus-info');
    const route = document.getElementById('selected-route');
    const datetime = document.getElementById('selected-datetime');
    const totalAmount = document.getElementById('total-amount');

    // Update modal header info
    busInfo.textContent = `${selectedBus.company} - ${selectedBus.type}`;
    route.textContent = selectedBus.route;
    datetime.textContent = `${QuickRide.formatDate(selectedBus.date)} at ${QuickRide.formatTime(selectedBus.time)}`;
    
    const total = selectedBus.pricePerSeat * selectedBus.passengers;
    totalAmount.textContent = QuickRide.formatCurrency(total);

    

    // Generate passenger forms
    container.innerHTML = '';
    for (let i = 1; i <= selectedBus.passengers; i++) {
        const passengerForm = document.createElement('div');
        passengerForm.className = 'passenger-form';
        passengerForm.innerHTML = `
            <h4>Passenger ${i}</h4>
            <div class="passenger-form-grid">
                <div class="form-group">
                    <label for="passenger-${i}-name">Full Name</label>
                    <input type="text" id="passenger-${i}-name" required>
                </div>
                <div class="form-group">
                    <label for="passenger-${i}-age">Age</label>
                    <select id="passenger-${i}-age" required>
                        <option value="">Select age group</option>
                        <option value="child">Child (2-12 years)</option>
                        <option value="adult">Adult (13-59 years)</option>
                        <option value="senior">Senior (60+ years)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="passenger-${i}-gender">Gender</label>
                    <select id="passenger-${i}-gender" required>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="passenger-${i}-phone">Phone Number</label>
                    <input type="tel" id="passenger-${i}-phone" required>
                </div>
            </div>
        `;
        container.appendChild(passengerForm);
    }

    // Show modal
    modal.style.display = 'block';

    // Setup proceed to payment button
    const proceedButton = document.getElementById('proceed-payment');
    proceedButton.onclick = validateAndProceedToPayment;
}

function validateAndProceedToPayment() {
    const passengerData = [];
    const passengerCount = selectedBus.passengers;

    // Validate and collect passenger data
    for (let i = 1; i <= passengerCount; i++) {
        const name = document.getElementById(`passenger-${i}-name`).value.trim();
        const age = document.getElementById(`passenger-${i}-age`).value;
        const gender = document.getElementById(`passenger-${i}-gender`).value;
        const phone = document.getElementById(`passenger-${i}-phone`).value.trim();

        if (!name || !age || !gender || !phone) {
            QuickRide.showNotification(`Please fill in all details for Passenger ${i}`, 'error');
            return;
        }

        // Validate phone number (basic validation)
        if (!/^\+?[\d\s-()]+$/.test(phone)) {
            QuickRide.showNotification(`Please enter a valid phone number for Passenger ${i}`, 'error');
            return;
        }

        passengerData.push({
            id: QuickRide.generateId(),
            name,
            age,
            gender,
            phone,
            seatNumber: null // Will be assigned after payment
        });
    }

    // Store passenger data
    selectedBus.passengerData = passengerData;

    // Close passenger modal and proceed to payment
    QuickRide.closeModal('passenger-modal');
    
    // Initialize payment
    initializePayment();
}

function displayAvailableBuses() {
    const container = document.getElementById('buses-container');
    
    if (!currentBookingSearch) {
        container.innerHTML = `
            <div class="no-buses">
                <i class="fas fa-search"></i>
                <h3>Search for Buses</h3>
                <p>Use the booking form to search for available buses on your preferred route.</p>
                <button class="cta-button" onclick="QuickRide.showSection('booking')">Search Buses</button>
            </div>
        `;
        return;
    }
    
    // If there's a current search, display those results
    const buses = BusManager.getAvailableBuses(
        currentBookingSearch.from,
        currentBookingSearch.to,
        currentBookingSearch.date,
        currentBookingSearch.time
    );
    
    displayBusResults(buses);
}

// Real-time clock synchronization
function updateRealTimeClock() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Update any visible time displays
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(element => {
        element.textContent = currentTime;
    });
    
    // Update time slots if booking form is visible
    const bookingSection = document.getElementById('booking');
    if (bookingSection && bookingSection.style.display !== 'none') {
        const fromSelect = document.getElementById('from');
        const toSelect = document.getElementById('to');
        const dateInput = document.getElementById('departure-date');
        
        if (fromSelect.value && toSelect.value && dateInput.value) {
            // Trigger time slot update every minute
            const lastUpdate = sessionStorage.getItem('lastTimeUpdate');
            const now = Date.now();
            
            if (!lastUpdate || (now - parseInt(lastUpdate)) > 60000) {
                updateTimeSlots();
                sessionStorage.setItem('lastTimeUpdate', now.toString());
            }
        }
    }
}

// Update clock every second
setInterval(updateRealTimeClock, 1000);

// Export for global access
window.BusManager = BusManager;
window.selectBus = selectBus;
window.displayAvailableBuses = displayAvailableBuses;
window.initializeBookingForm = initializeBookingForm;

