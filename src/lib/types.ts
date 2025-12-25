// Database types matching Supabase schema

export type ServiceCategory = 'men' | 'women' | 'unisex' | 'combo';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Service {
    id: string;
    name: string;
    description: string;
    category: ServiceCategory;
    duration_minutes: number;
    price: number;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
    // New fields for Combos & Offers
    compare_at_price?: number | null; // Original price before discount
    is_combo: boolean;
    is_featured: boolean;
    offer_end_at?: string | null; // ISO Date string
    included_services?: { id: string; name: string }[]; // For combos
    created_at: string;
}

export interface Staff {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
    working_hours: WorkingHours;
    is_active: boolean;
    created_at: string;
}

export interface WorkingHours {
    [key: string]: { // day of week: 'monday', 'tuesday', etc.
        start: string; // '09:00'
        end: string;   // '21:00'
        isOff: boolean;
    };
}

export interface StaffService {
    staff_id: string;
    service_id: string;
}

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    created_at: string;
}

export interface Appointment {
    id: string;
    user_id: string;
    service_id: string; // Primary service (kept for backward compatibility)
    staff_id: string;
    appointment_date: string; // YYYY-MM-DD
    start_time: string; // HH:mm
    end_time: string;
    status: AppointmentStatus;
    notes: string | null;
    final_amount: number | null;
    discount_percent: number | null; // Discount percentage applied
    payment_mode: 'cash' | 'upi' | 'card' | null;
    created_at: string;
    // Joined data
    service?: Service;
    staff?: Staff;
    user?: User;
    appointment_services?: AppointmentService[]; // Multiple services
}

export interface BlockedSlot {
    id: string;
    staff_id: string;
    date: string;
    start_time: string;
    end_time: string;
    reason: string | null;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

// Booking flow state
export interface BookingState {
    step: 1 | 2 | 3;
    services: Service[]; // Changed from single service to array
    staff: Staff | null;
    date: string | null;
    time: string | null;
    userName: string;
    userPhone: string;
    userEmail: string;
}

// Multi-service booking - junction table type
export interface AppointmentService {
    id: string;
    appointment_id: string;
    service_id: string;
    staff_id: string | null;
    is_completed: boolean;
    cancellation_reason: string | null; // Reason why service wasn't completed
    final_price: number | null;
    created_at: string;
    // Joined data
    service?: Service;
    staff?: Staff;
}

// Testimonials types
export interface Testimonial {
    id: string;
    customer_name: string;
    rating: number; // 1-5
    review_text: string;
    customer_image_url: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ReviewsConfig {
    id: string;
    average_rating: number; // 1.0 - 5.0
    total_reviews_count: number;
    updated_at: string;
}

export interface BillService {
    name: string;
    price: number;
}

export interface Bill {
    id: string;
    bill_number: string;
    appointment_id: string | null;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    bill_date: string;
    bill_time: string;
    services: BillService[];
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    final_amount: number;
    payment_mode: 'cash' | 'upi' | 'card' | null;
    staff_name: string | null;
    notes: string | null;
    created_at: string;
}

