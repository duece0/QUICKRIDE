# QuickRide 1.0 - Bus Ticket Booking System

A modern, responsive bus ticket booking system built with HTML, CSS, and JavaScript, featuring real-time booking, emergency contacts, and admin management.

## 🚌 Features

### User Features
- **User Authentication**: Login/Signup system with local storage
- **Available Buses Function**: Real-time bus availability search with seat counting and status indicators
- **Bus Search**: Search for available buses by route, date, and time
- **Real-time Clock Sync**: Departure times synchronized with current time
- **Emergency Contacts**: Required emergency contact information for safety
- **Multiple Cities**: Support for 20+ Ghanaian cities
- **Individual Tickets**: Separate tickets generated for each passenger
- **Paystack Integration**: Secure payment processing
- **Responsive Design**: Works on all devices

### 🚌 Available Buses Function Details
The system includes a sophisticated **Available Buses Function** that provides:

- **Real-time Availability**: Live seat counting and bus status updates
- **Smart Filtering**: Buses filtered by route, date, time, and capacity
- **Status Indicators**: Visual indicators for "Available", "Few Seats", or "Full" buses
- **Seat Management**: Automatic calculation of available vs. booked seats
- **Time Validation**: Filters out past departure times for current date
- **Route Matching**: Intelligent bus-to-route matching system
- **Capacity Tracking**: Real-time seat availability across all bus types

### Admin Features
- **Admin Panel**: Secure admin login (username: `admin`, password: `admin123`)
- **Bus Management**: Add, edit, and manage bus fleets
- **Route Management**: Create and manage bus routes
- **Price Management**: Set prices for different bus types and routes
- **Real-time Updates**: Live data synchronization

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL)
- **Payment**: Paystack
- **Icons**: Font Awesome
- **Styling**: Custom CSS with gradients and animations

## 📁 Project Structure

```
quickride-app/
├── index.html              # Main application file
├── styles/
│   ├── main.css           # Global styles and navigation
│   ├── booking.css        # Booking form and bus display
│   ├── tickets.css        # Ticket management styles
│   └── admin.css          # Admin panel styles
├── js/
│   ├── supabase-config.js # Supabase configuration and API
│   ├── main.js            # Core navigation and utilities
│   ├── booking.js         # Booking logic and bus search
│   ├── tickets.js         # Ticket management
│   ├── payment.js         # Paystack integration
│   └── admin.js           # Admin panel functionality
└── README.md              # This file
```

## 🚀 Setup Instructions

### 1. Clone/Download Project
```bash
git clone <repository-url>
cd quickride-app
```

### 2. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready

#### Database Tables
Run these SQL commands in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buses table
CREATE TABLE buses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_city VARCHAR(255) NOT NULL,
    to_city VARCHAR(255) NOT NULL,
    distance DECIMAL(8,2) NOT NULL,
    duration DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table
CREATE TABLE prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    bus_type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, bus_type)
);

-- Bookings table
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id),
    route_id UUID REFERENCES routes(id),
    passengers INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    passenger_name VARCHAR(255) NOT NULL,
    passenger_phone VARCHAR(50),
    passenger_age VARCHAR(50),
    passenger_gender VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Get API Keys
1. Go to Project Settings → API
2. Copy your Project URL and anon/public key

### 3. Configure Supabase
Edit `js/supabase-config.js`:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. Configure Paystack
Edit `js/payment.js`:
```javascript
const PAYSTACK_PUBLIC_KEY = 'YOUR_PAYSTACK_PUBLIC_KEY';
```

### 5. Run the Application
```bash
# Using Python (built-in server)
python -m http.server 8000

# Using Node.js (if you have it installed)
npx http-server

# Using Live Server extension in VS Code
# Right-click index.html → "Open with Live Server"
```

Open your browser and navigate to `http://localhost:8000`

## 🔐 Admin Access

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials in production!

## 🌍 Supported Cities

- Accra, Kumasi, Tamale, Cape Coast, Tema
- Takoradi, Sunyani, Ho, Bolgatanga, Wa
- Koforidua, Techiman, Nawrongo, Hohoe, Yendi
- Damongo, Bawku, Navrongo, Berekum

## 💳 Payment Integration

The system uses Paystack for payment processing:
- Test mode supported
- Real-time payment verification
- Automatic ticket generation after successful payment

## 🔧 Customization

### Adding New Cities
Edit the city options in `index.html`:
```html
<option value="new-city">New City</option>
```

### Modifying Bus Types
Update bus types in the admin panel forms and `js/booking.js`

### Styling Changes
Modify CSS files in the `styles/` directory

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Adaptive layouts

## 🚨 Emergency Features

- Required emergency contact collection
- Emergency contact summary in booking
- Dedicated emergency page with hotlines
- QuickRide support contacts

## 🔄 Real-time Features

- Live clock synchronization
- Real-time departure time filtering
- Dynamic bus availability updates
- Live admin data management

## 🛡️ Security Features

- Input validation and sanitization
- Secure payment processing
- Admin authentication
- Data encryption (Supabase)

## 📊 Data Management

- Local storage fallback when Supabase is unavailable
- Automatic data synchronization
- Backup and restore capabilities
- Export functionality (coming soon)

## 🚀 Future Enhancements

- [ ] Real-time bus tracking
- [ ] SMS notifications
- [ ] Mobile app version
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Integration with other transport systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@quickride.com
- Phone: +233 30 222 8888
- Emergency: 191, 193, 192, 199

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- Paystack for payment processing
- Font Awesome for icons
- The Ghanaian transport community for feedback

---

**QuickRide 1.0** - Making bus travel in Ghana smarter, safer, and more convenient! 🚌✨
