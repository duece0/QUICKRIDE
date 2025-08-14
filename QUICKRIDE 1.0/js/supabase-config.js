const SUPABASE_URL = 'https://vshdkkchjavhiilfyjyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaGRra2NoamphdmhpaWxmeWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNjUwMDYsImV4cCI6MjA2OTk0MTAwNn0.bl54j_lPmpntjg30_cobdUefEn9gcYk7-q1fcomtZuA';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseManager {
    static async createUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    static async getUserByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    static async getBuses() {
        try {
            const { data, error } = await supabase
                .from('buses')
                .select('*')
                .eq('status', 'active');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting buses:', error);
            return { success: false, error: error.message };
        }
    }

    static async addBus(busData) {
        try {
            const { data, error } = await supabase
                .from('buses')
                .insert([busData])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error adding bus:', error);
            return { success: false, error: error.message };
        }
    }

    static async getRoutes() {
        try {
            const { data, error } = await supabase
                .from('routes')
                .select('*');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting routes:', error);
            return { success: false, error: error.message };
        }
    }

    static async addRoute(routeData) {
        try {
            const { data, error } = await supabase
                .from('routes')
                .insert([routeData])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error adding route:', error);
            return { success: false, error: error.message };
        }
    }

    static async getPrices() {
        try {
            const { data, error } = await supabase
                .from('prices')
                .select(`
                    *,
                    routes(from_city, to_city)
                `);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting prices:', error);
            return { success: false, error: error.message };
        }
    }

    static async setPrices(priceData) {
        try {
            const { data, error } = await supabase
                .from('prices')
                .upsert(priceData, { onConflict: 'route_id,bus_type' })
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error setting prices:', error);
            return { success: false, error: error.message };
        }
    }

    static async createBooking(bookingData) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error creating booking:', error);
            return { success: false, error: error.message };
        }
    }

    static async getUserBookings(userId) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    buses(company, type),
                    routes(from_city, to_city)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting user bookings:', error);
            return { success: false, error: error.message };
        }
    }

    static async createTickets(ticketsData) {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .insert(ticketsData)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating tickets:', error);
            return { success: false, error: error.message };
        }
    }
}

window.SupabaseManager = SupabaseManager;
