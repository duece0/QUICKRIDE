let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentBooking = {};
let selectedBus = null;

// Export functions for use in other modules - Define early to avoid loading issues
window.QuickRide = {
    AuthManager: null, // Will be set after class definition
    showSection: null, // Will be set after function definition
    showNotification: null, // Will be set after function definition
    closeModal: null, // Will be set after function definition
    formatDate: null, // Will be set after function definition
    formatTime: null, // Will be set after function definition
    formatCurrency: null, // Will be set after function definition
    generateId: null, // Will be set after function definition
    getCityDisplayName: null, // Will be set after function definition
    cityNames: null // Will be set after variable definition
};

class AuthManager {
    static isLoggedIn() {
        return currentUser !== null;
    }

    static getCurrentUser() {
        return currentUser;
    }

    static login(email, password) {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.updateAuthUI();
            showNotification('Login successful!', 'success');
            return true;
        }
        return false;
    }

    static signup(userData) {
        if (users.find(u => u.email === userData.email)) {
            showNotification('User with this email already exists!', 'error');
            return false;
        }

        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            createdAt: new Date().toISOString(),
            tickets: []
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        this.updateAuthUI();
        showNotification('Account created successfully!', 'success');
        return true;
    }

    static logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateAuthUI();
        showNotification('Logged out successfully!', 'info');
        showSection('home');
    }

    static updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userNameSpan = document.getElementById('user-name');
        const authAlert = document.getElementById('auth-alert');

        if (this.isLoggedIn()) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            userNameSpan.textContent = currentUser.name;
            
            if (authAlert) {
                authAlert.style.display = 'none';
            }
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
            
            if (authAlert) {
                authAlert.style.display = 'block';
            }
        }
    }
}

function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Check if user needs to be logged in for certain sections
            if (['booking', 'my-tickets'].includes(targetId) && !AuthManager.isLoggedIn()) {
                showNotification('Please login to access this section', 'warning');
                showAuthModal('login');
                return;
            }
            
            // Check if admin section is being accessed
            if (targetId === 'admin') {
                // Admin section is accessible to everyone (login happens within the section)
                showSection(targetId);
                
                // Ensure admin panel is properly initialized
                if (window.adminPanel) {
                    window.adminPanel.showAdminLogin();
                }
                return;
            }
            
            showSection(targetId);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Section management
function showSection(sectionId) {
    // Hide all sections
    const sections = ['home', 'booking', 'available-buses', 'my-tickets', 'emergency', 'contact', 'admin'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Special handling for specific sections
        switch(sectionId) {
            case 'my-tickets':
                if (AuthManager.isLoggedIn()) {
                    displayTickets();
                }
                break;
            case 'booking':
                if (AuthManager.isLoggedIn()) {
                    initializeBookingForm();
                }
                break;
            case 'available-buses':
                displayAvailableBuses();
                break;
        }
    }
}

// Authentication modal management
function showAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'block';
    switchAuthForm(type);
}

function switchAuthForm(type) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

// Authentication form handlers
function initializeAuthForms() {
    const loginForm = document.getElementById('login-form-element');
    const signupForm = document.getElementById('signup-form-element');

    // Login form handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (AuthManager.login(email, password)) {
            closeModal('auth-modal');
            this.reset();
        } else {
            showNotification('Invalid email or password!', 'error');
        }
    });

    // Signup form handler
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Validation
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters long!', 'error');
            return;
        }
        
        const userData = { name, email, phone, password };
        
        if (AuthManager.signup(userData)) {
            closeModal('auth-modal');
            this.reset();
        }
    });
}

// Logout function
function logout() {
    AuthManager.logout();
}

// Modal management
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize modal close functionality
function initializeModals() {
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Initialize contact form
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulate form submission
            const submitButton = this.querySelector('button');
            const originalText = submitButton.textContent;
            
            submitButton.innerHTML = '<span class="loading"></span> Sending...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
    }
}

// Utility functions
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatCurrency(amount) {
    return `GH₵${amount.toFixed(2)}`;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// City names mapping
const cityNames = {
    'accra': 'Accra',
    'kumasi': 'Kumasi',
    'tamale': 'Tamale',
    'cape-coast': 'Cape Coast',
    'tema': 'Tema',
    'takoradi': 'Takoradi',
    'sunyani': 'Sunyani',
    'ho': 'Ho',
    'bolgatanga': 'Bolgatanga',
    'wa': 'Wa',
    'koforidua': 'Koforidua',
    'techiman': 'Techiman',
    'nawrongo': 'Nawrongo',
    'hohoe': 'Hohoe',
    'yendi': 'Yendi',
    'damongo': 'Damongo',
    'bawku': 'Bawku',
    'navrongo': 'Navrongo',
    'berekum': 'Berekum'
};

// Get city display name
function getCityDisplayName(cityCode) {
    return cityNames[cityCode] || cityCode;
}

// Initialize sample data
function initializeSampleData() {
    // Create sample users if none exist
    if (users.length === 0) {
        const sampleUsers = [
            {
                id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+233241234567',
                password: 'password123',
                createdAt: new Date().toISOString(),
                tickets: []
            },
            {
                id: 'user2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+233209876543',
                password: 'password123',
                createdAt: new Date().toISOString(),
                tickets: []
            }
        ];
        
        users = sampleUsers;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.setAttribute('min', today);
    });
    
    // Update QuickRide object with actual functions and classes
    window.QuickRide = {
        AuthManager,
        showSection,
        showNotification,
        closeModal,
        formatDate,
        formatTime,
        formatCurrency,
        generateId,
        getCityDisplayName,
        cityNames
    };
    
    // Initialize all components
    initializeSampleData();
    initializeNavigation();
    initializeAuthForms();
    initializeModals();
    initializeContactForm();
    
    // Update auth UI on page load
    AuthManager.updateAuthUI();
    
    // Initialize page with home section
    showSection('home');
});

// QuickRide object is now defined at the top and updated in DOMContentLoaded

