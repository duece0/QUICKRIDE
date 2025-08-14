class AdminPanel {
    constructor() {
        this.isAdminLoggedIn = false;
        this.adminUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminStatus();
        
        // Ensure login form is visible by default
        const loginForm = document.getElementById('admin-login-form');
        const dashboard = document.getElementById('admin-dashboard');
        if (loginForm && dashboard) {
            loginForm.style.display = 'block';
            dashboard.style.display = 'none';
        }
    }

    bindEvents() {
        const adminLoginForm = document.getElementById('admin-login');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        const addBusForm = document.getElementById('add-bus-form');
        if (addBusForm) {
            addBusForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddBus();
            });
        }

        const addRouteForm = document.getElementById('add-route-form');
        if (addRouteForm) {
            addRouteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddRoute();
            });
        }

        const setPriceForm = document.getElementById('set-price-form');
        if (setPriceForm) {
            setPriceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSetPrices();
            });
        }
    }

    checkAdminStatus() {
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
            try {
                this.adminUser = JSON.parse(adminUser);
                this.isAdminLoggedIn = true;
                this.showAdminDashboard();
            } catch (error) {
                localStorage.removeItem('adminUser');
            }
        }
    }

    async handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        if (username === 'admin' && password === 'admin123') {
            this.adminUser = { username, role: 'admin' };
            this.isAdminLoggedIn = true;
            localStorage.setItem('adminUser', JSON.stringify(this.adminUser));
            
            QuickRide.showNotification('Admin login successful!', 'success');
            this.showAdminDashboard();
            this.loadAdminData();
        } else {
            QuickRide.showNotification('Invalid admin credentials', 'error');
        }
    }

    showAdminDashboard() {
        document.getElementById('admin-login-form').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    }

    showAdminLogin() {
        document.getElementById('admin-login-form').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    adminLogout() {
        this.isAdminLoggedIn = false;
        this.adminUser = null;
        localStorage.removeItem('adminUser');
        this.showAdminLogin();
        QuickRide.showNotification('Admin logged out successfully', 'success');
    }

    async loadAdminData() {
        await Promise.all([
            this.loadBuses(),
            this.loadRoutes(),
            this.loadPrices()
        ]);
    }

    async loadBuses() {
        try {
            const result = await SupabaseManager.getBuses();
            if (result.success) {
                this.displayBuses(result.data);
            } else {
                this.displayBuses(this.getLocalBuses());
            }
        } catch (error) {
            console.error('Error loading buses:', error);
            this.displayBuses(this.getLocalBuses());
        }
    }

    async loadRoutes() {
        try {
            const result = await SupabaseManager.getRoutes();
            if (result.success) {
                this.displayRoutes(result.data);
                this.populatePriceRouteDropdown(result.data);
            } else {
                this.displayRoutes(this.getLocalRoutes());
                this.populatePriceRouteDropdown(this.getLocalRoutes());
            }
        } catch (error) {
            console.error('Error loading routes:', error);
            this.displayRoutes(this.getLocalRoutes());
            this.populatePriceRouteDropdown(this.getLocalRoutes());
        }
    }

    async loadPrices() {
        try {
            const result = await SupabaseManager.getPrices();
            if (result.success) {
                this.displayPrices(result.data);
            } else {
                this.displayPrices(this.getLocalPrices());
            }
        } catch (error) {
            console.error('Error loading prices:', error);
            this.displayPrices(this.getLocalPrices());
        }
    }

    async handleAddBus() {
        const busData = {
            company: document.getElementById('bus-company').value,
            type: document.getElementById('bus-type').value,
            capacity: parseInt(document.getElementById('bus-capacity').value),
            status: document.getElementById('bus-status').value,
            created_at: new Date().toISOString()
        };

        try {
            const result = await SupabaseManager.addBus(busData);
            if (result.success) {
                QuickRide.showNotification('Bus added successfully!', 'success');
                document.getElementById('add-bus-form').reset();
                this.loadBuses();
            } else {
                QuickRide.showNotification('Error adding bus: ' + result.error, 'error');
            }
        } catch (error) {
            // Fallback to local storage
            this.addLocalBus(busData);
            QuickRide.showNotification('Bus added to local storage!', 'success');
            document.getElementById('add-bus-form').reset();
            this.loadBuses();
        }
    }

    async handleAddRoute() {
        const routeData = {
            from_city: document.getElementById('route-from').value,
            to_city: document.getElementById('route-to').value,
            distance: parseFloat(document.getElementById('route-distance').value),
            duration: parseFloat(document.getElementById('route-duration').value),
            created_at: new Date().toISOString()
        };

        try {
            const result = await SupabaseManager.addRoute(routeData);
            if (result.success) {
                QuickRide.showNotification('Route added successfully!', 'success');
                document.getElementById('add-route-form').reset();
                this.loadRoutes();
            } else {
                QuickRide.showNotification('Error adding route: ' + result.error, 'error');
            }
        } catch (error) {
            // Fallback to local storage
            this.addLocalRoute(routeData);
            QuickRide.showNotification('Route added to local storage!', 'success');
            document.getElementById('add-route-form').reset();
            this.loadRoutes();
        }
    }

    async handleSetPrices() {
        const routeId = document.getElementById('price-route').value;
        const prices = [
            { route_id: routeId, bus_type: 'VIP', price: parseFloat(document.getElementById('price-vip').value) },
            { route_id: routeId, bus_type: 'Express', price: parseFloat(document.getElementById('price-express').value) },
            { route_id: routeId, bus_type: 'Standard', price: parseFloat(document.getElementById('price-standard').value) },
            { route_id: routeId, bus_type: 'Luxury', price: parseFloat(document.getElementById('price-luxury').value) }
        ];

        try {
            const result = await SupabaseManager.setPrices(prices);
            if (result.success) {
                QuickRide.showNotification('Prices set successfully!', 'success');
                document.getElementById('set-price-form').reset();
                this.loadPrices();
            } else {
                QuickRide.showNotification('Error setting prices: ' + result.error, 'error');
            }
        } catch (error) {
            // Fallback to local storage
            this.setLocalPrices(prices);
            QuickRide.showNotification('Prices saved to local storage!', 'success');
            document.getElementById('set-price-form').reset();
            this.loadPrices();
        }
    }

    displayBuses(buses) {
        const container = document.getElementById('admin-buses-list');
        if (!container) return;

        container.innerHTML = buses.map(bus => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>${bus.company} - ${bus.type}</strong>
                    <span>Capacity: ${bus.capacity}</span>
                    <span>Status: ${bus.status}</span>
                </div>
                <div class="admin-item-actions">
                    <button onclick="adminPanel.editBus('${bus.id}')" class="admin-edit-btn">Edit</button>
                    <button onclick="adminPanel.deleteBus('${bus.id}')" class="admin-delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    }

    displayRoutes(routes) {
        const container = document.getElementById('admin-routes-list');
        if (!container) return;

        container.innerHTML = routes.map(route => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>${route.from_city} → ${route.to_city}</strong>
                    <span>Distance: ${route.distance} km</span>
                    <span>Duration: ${route.duration} hours</span>
                </div>
                <div class="admin-item-actions">
                    <button onclick="adminPanel.editRoute('${route.id}')" class="admin-edit-btn">Edit</button>
                    <button onclick="adminPanel.deleteRoute('${route.id}')" class="admin-delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    }

    displayPrices(prices) {
        const container = document.getElementById('admin-prices-list');
        if (!container) return;

        container.innerHTML = prices.map(price => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>${price.routes?.from_city || 'Unknown'} → ${price.routes?.to_city || 'Unknown'}</strong>
                    <span>Type: ${price.bus_type}</span>
                    <span>Price: GHS ${price.price}</span>
                </div>
                <div class="admin-item-actions">
                    <button onclick="adminPanel.editPrice('${price.id}')" class="admin-edit-btn">Edit</button>
                    <button onclick="adminPanel.deletePrice('${price.id}')" class="admin-delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    }

    populatePriceRouteDropdown(routes) {
        const dropdown = document.getElementById('price-route');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select route</option>' + 
            routes.map(route => 
                `<option value="${route.id}">${route.from_city} → ${route.to_city}</option>`
            ).join('');
    }

    getLocalBuses() {
        return JSON.parse(localStorage.getItem('adminBuses') || '[]');
    }

    addLocalBus(busData) {
        const buses = this.getLocalBuses();
        busData.id = 'local_' + Date.now();
        buses.push(busData);
        localStorage.setItem('adminBuses', JSON.stringify(buses));
    }

    getLocalRoutes() {
        return JSON.parse(localStorage.getItem('adminRoutes') || '[]');
    }

    addLocalRoute(routeData) {
        const routes = this.getLocalRoutes();
        routeData.id = 'local_' + Date.now();
        routes.push(routeData);
        localStorage.setItem('adminRoutes', JSON.stringify(routes));
    }

    getLocalPrices() {
        return JSON.parse(localStorage.getItem('adminPrices') || '[]');
    }

    setLocalPrices(prices) {
        const existingPrices = this.getLocalPrices();
        const updatedPrices = existingPrices.filter(p => p.route_id !== prices[0].route_id);
        prices.forEach(price => {
            price.id = 'local_' + Date.now() + Math.random();
            updatedPrices.push(price);
        });
        localStorage.setItem('adminPrices', JSON.stringify(updatedPrices));
    }

    showAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName + '-tab').classList.add('active');
        
        event.target.classList.add('active');
    }

    editBus(id) {
        QuickRide.showNotification('Edit functionality coming soon!', 'info');
    }

    deleteBus(id) {
        if (confirm('Are you sure you want to delete this bus?')) {
            QuickRide.showNotification('Delete functionality coming soon!', 'info');
        }
    }

    editRoute(id) {
        QuickRide.showNotification('Edit functionality coming soon!', 'info');
    }

    deleteRoute(id) {
        if (confirm('Are you sure you want to delete this route?')) {
            QuickRide.showNotification('Delete functionality coming soon!', 'info');
        }
    }

    editPrice(id) {
        QuickRide.showNotification('Edit functionality coming soon!', 'info');
    }

    deletePrice(id) {
        if (confirm('Are you sure you want to delete this price?')) {
            QuickRide.showNotification('Delete functionality coming soon!', 'info');
        }
    }
}

const adminPanel = new AdminPanel();

// Make admin panel globally accessible
window.adminPanel = adminPanel;

function adminLogout() {
    adminPanel.adminLogout();
}

function showAdminTab(tabName) {
    adminPanel.showAdminTab(tabName);
}
