import { createClient } from './supabase/client';
import { Service, Staff, Appointment, Testimonial, ReviewsConfig, AppointmentService, Bill, BillService } from './types';

const supabase = createClient();

// ==================== SERVICES ====================

export async function getServices(): Promise<Service[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }

    return data || [];
}

export async function getMostBookedServices(limit: number = 4): Promise<Service[]> {
    try {
        const { data: appointments, error } = await supabase
            .from('appointment_services')
            .select('service_id')
            .limit(200);

        if (error || !appointments) {
            console.error('Error fetching appointment stats:', error);
            return (await getServices()).filter(s => !s.is_combo).slice(0, limit);
        }

        const counts: Record<string, number> = {};
        appointments.forEach(app => {
            counts[app.service_id] = (counts[app.service_id] || 0) + 1;
        });

        const allServices = await getServices();

        return allServices
            .filter(s => !s.is_combo)
            .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
            .slice(0, limit);
    } catch (e) {
        console.error("Failed to get most booked services", e);
        return [];
    }
}

export async function getServiceById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching service:', error);
        return null;
    }

    return data;
}

export async function getAllServices(): Promise<Service[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching all services:', error);
        return [];
    }

    return data || [];
}

// ==================== STAFF ====================

export async function getStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }
    return data || [];
}

export async function getAllStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error('Error fetching all staff:', error);
        return [];
    }

    return data || [];
}

// ==================== APPOINTMENTS ====================

export async function getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      service:services(*),
      staff:staff(*),
      user:users(*)
    `)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    console.log('Fetched appointments:', data?.length, data);
    return data || [];
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      service:services(*),
      staff:staff(*),
      user:users(*)
    `)
        .eq('appointment_date', date)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching appointments by date:', error);
        return [];
    }

    return data || [];
}

export async function getBookedSlots(staffId: string | null, date: string): Promise<string[]> {
    // Get ALL non-cancelled appointments for this date with start AND end times
    const { data, error } = await supabase
        .from('appointments')
        .select('start_time, end_time, staff_id')
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

    if (error) {
        console.error('Error fetching booked slots:', error);
        return [];
    }

    if (!data || data.length === 0) return [];

    // Filter by staff if specific one selected
    let appointments = data;
    if (staffId) {
        appointments = data.filter(apt =>
            apt.staff_id === staffId || apt.staff_id === null
        );
    }

    // Generate all blocked 30-min slots for each appointment
    const blockedSlots: string[] = [];

    appointments.forEach(apt => {
        const [startH, startM] = apt.start_time.slice(0, 5).split(':').map(Number);
        const [endH, endM] = apt.end_time.slice(0, 5).split(':').map(Number);

        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        // Block every 30-min slot from start to end
        for (let mins = startMins; mins < endMins; mins += 30) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            if (!blockedSlots.includes(timeStr)) {
                blockedSlots.push(timeStr);
            }
        }
    });

    console.log('Blocked slots for date:', date, 'staff:', staffId, '->', blockedSlots);
    return blockedSlots;
}

export async function createAppointment(appointment: {
    service_ids: string[]; // Changed to array for multi-service
    staff_id?: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    user_name: string;
    user_phone: string;
    user_email?: string;
}): Promise<{ success: boolean; error?: string; appointment_id?: string }> {
    console.log('Creating appointment with data:', appointment);

    if (!appointment.service_ids.length) {
        return { success: false, error: 'At least one service is required' };
    }

    // First, try to find existing user by phone
    const { data: existingByPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', appointment.user_phone)
        .maybeSingle();

    let userId: string;

    if (existingByPhone) {
        userId = existingByPhone.id;
        console.log('Found existing user by phone:', userId);
    } else if (appointment.user_email) {
        // Try to find by email if phone not found
        const { data: existingByEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', appointment.user_email)
            .maybeSingle();

        if (existingByEmail) {
            userId = existingByEmail.id;
            console.log('Found existing user by email:', userId);
        } else {
            // Create new user with email
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    name: appointment.user_name,
                    phone: appointment.user_phone,
                    email: appointment.user_email,
                })
                .select('id')
                .single();

            if (userError || !newUser) {
                console.error('Failed to create user:', userError);
                return { success: false, error: userError?.message || 'Failed to create user' };
            }
            userId = newUser.id;
            console.log('Created new user with email:', userId);
        }
    } else {
        // No email provided, create user without email
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                name: appointment.user_name,
                phone: appointment.user_phone,
                email: null,
            })
            .select('id')
            .single();

        if (userError || !newUser) {
            console.error('Failed to create user:', userError);
            return { success: false, error: userError?.message || 'Failed to create user' };
        }
        userId = newUser.id;
        console.log('Created new user (no email):', userId);
    }

    // Create the appointment (use first service as primary for backward compatibility)
    console.log('Creating appointment for user:', userId);
    const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({
            user_id: userId,
            service_id: appointment.service_ids[0], // Primary service
            staff_id: appointment.staff_id || null,
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            status: 'pending',
        })
        .select()
        .single();

    console.log('Appointment creation result:', appointmentData, 'error:', error);

    if (error || !appointmentData) {
        console.error('Error creating appointment:', error);
        return { success: false, error: error?.message || 'Failed to create appointment' };
    }

    // Create appointment_services entries for all services
    const appointmentServices = appointment.service_ids.map(serviceId => ({
        appointment_id: appointmentData.id,
        service_id: serviceId,
        staff_id: appointment.staff_id || null,
        is_completed: true, // Services are checked by default
    }));

    const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

    if (servicesError) {
        console.error('Error creating appointment services:', servicesError);
        // Don't fail completely - the main appointment was created
    }

    console.log('Appointment created successfully!', appointmentData);
    return { success: true, appointment_id: appointmentData.id };
}


export async function updateAppointmentStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<boolean> {
    const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating appointment:', error);
        return false;
    }

    return true;
}

export async function completeAppointment(
    id: string,
    finalAmount: number,
    paymentMode: 'cash' | 'upi' | 'card',
    discountPercent: number = 0
): Promise<boolean> {
    const { error } = await supabase
        .from('appointments')
        .update({
            status: 'completed',
            final_amount: finalAmount,
            discount_percent: discountPercent,
            payment_mode: paymentMode,
        })
        .eq('id', id);

    if (error) {
        console.error('Error completing appointment:', error);
        return false;
    }

    return true;
}

// ==================== CUSTOMER HISTORY ====================

export async function getUserByPhone(phone: string): Promise<{ id: string; name: string; created_at: string } | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, created_at')
        .eq('phone', phone)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user by phone:', error);
        return null;
    }

    return data;
}

export async function getAppointmentsByPhone(phone: string): Promise<(Appointment & { allServices?: AppointmentService[] })[]> {
    // First find the user by phone
    const user = await getUserByPhone(phone);

    if (!user) {
        return [];
    }

    // Fetch all appointments for this user
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            service:services(*),
            staff:staff(*)
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching appointments by phone:', error);
        return [];
    }

    if (!data) return [];

    // Fetch all services for each appointment
    const appointmentsWithServices = await Promise.all(
        data.map(async (apt) => {
            const services = await getAppointmentServices(apt.id);
            return { ...apt, allServices: services };
        })
    );

    return appointmentsWithServices;
}

export interface CustomerStats {
    totalVisits: number;
    totalSpent: number;
    totalSavings: number;
    favouriteService: string | null;
    lastVisit: string | null;
}

export async function getCustomerStats(phone: string): Promise<CustomerStats> {
    const appointments = await getAppointmentsByPhone(phone);

    const completedAppointments = appointments.filter(apt => apt.status === 'completed');

    // Calculate total visits
    const totalVisits = completedAppointments.length;

    // Calculate total spent (actual final amounts paid)
    const totalSpent = completedAppointments.reduce((sum, apt) => {
        return sum + (apt.final_amount || 0);
    }, 0);

    // Calculate total savings from discounts
    const totalSavings = completedAppointments.reduce((sum, apt) => {
        if (apt.discount_percent && apt.discount_percent > 0) {
            const originalTotal = apt.allServices && apt.allServices.length > 0
                ? apt.allServices.reduce((s, svc) => s + (svc.service?.price || 0), 0)
                : apt.service?.price || 0;
            return sum + Math.round(originalTotal * (apt.discount_percent / 100));
        }
        return sum;
    }, 0);

    // Find favourite service
    // Count ALL services from all appointments (including multi-service bookings)
    const serviceCount: Record<string, { count: number; name: string; price: number }> = {};

    completedAppointments.forEach(apt => {
        // Handle multi-service appointments
        if (apt.allServices && apt.allServices.length > 0) {
            apt.allServices.forEach(svc => {
                if (svc.service) {
                    const id = svc.service.id;
                    if (!serviceCount[id]) {
                        serviceCount[id] = { count: 0, name: svc.service.name, price: svc.service.price };
                    }
                    serviceCount[id].count++;
                }
            });
        } else if (apt.service) {
            // Fallback for single service appointments
            const id = apt.service.id;
            if (!serviceCount[id]) {
                serviceCount[id] = { count: 0, name: apt.service.name, price: apt.service.price };
            }
            serviceCount[id].count++;
        }
    });

    let favouriteService: string | null = null;
    const services = Object.values(serviceCount);

    if (services.length > 0) {
        if (totalVisits === 1) {
            // Single visit: return highest value service
            const highestValue = services.reduce((prev, curr) =>
                curr.price > prev.price ? curr : prev
            );
            favouriteService = highestValue.name;
        } else {
            // Multiple visits: return most frequently booked service
            const mostFrequent = services.reduce((prev, curr) =>
                curr.count > prev.count ? curr : prev
            );
            favouriteService = mostFrequent.name;
        }
    }

    // Get last visit date
    const lastVisit = completedAppointments.length > 0
        ? completedAppointments[0].appointment_date
        : null;

    return {
        totalVisits,
        totalSpent,
        totalSavings,
        favouriteService,
        lastVisit,
    };
}

// ==================== ADMIN SERVICES CRUD ====================

export async function uploadServiceImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function createService(service: Partial<Service>): Promise<boolean> {
    const { error } = await supabase
        .from('services')
        .insert(service);

    if (error) {
        console.error('Error creating service:', error);
        return false;
    }

    return true;
}

export async function updateService(id: string, updates: Partial<Service>): Promise<boolean> {
    const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating service:', error);
        return false;
    }

    return true;
}

export async function deleteService(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting service:', error);
        return false;
    }

    return true;
}

// ==================== ADMIN STAFF CRUD ====================

export async function createStaff(staff: Partial<Staff>): Promise<boolean> {
    const { error } = await supabase
        .from('staff')
        .insert(staff);

    if (error) {
        console.error('Error creating staff:', error);
        return false;
    }

    return true;
}

export async function uploadStaffImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `staff-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading staff image:', uploadError);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function updateStaff(id: string, updates: Partial<Staff>): Promise<boolean> {
    const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating staff:', error);
        return false;
    }

    return true;
}

export async function deleteStaff(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('staff')
        .update({ is_deleted: true, is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deleting staff:', error);
        return false;
    }

    return true;
}

// ==================== TESTIMONIALS ====================

export async function getActiveTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }

    return data || [];
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all testimonials:', error);
        return [];
    }

    return data || [];
}

export async function createTestimonial(testimonial: Partial<Testimonial>): Promise<boolean> {
    const { error } = await supabase
        .from('testimonials')
        .insert(testimonial);

    if (error) {
        console.error('Error creating testimonial:', error);
        return false;
    }

    return true;
}

export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<boolean> {
    const { error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating testimonial:', error);
        return false;
    }

    return true;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting testimonial:', error);
        return false;
    }

    return true;
}

// ==================== REVIEWS CONFIG ====================

export async function getReviewsConfig(): Promise<ReviewsConfig | null> {
    try {
        // Use limit(1) to get just one row even if multiple exist
        const { data, error } = await supabase
            .from('reviews_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) {
            console.warn('Reviews config error:', error);
            return {
                id: 'default',
                average_rating: 5.0,
                total_reviews_count: 0,
                updated_at: new Date().toISOString(),
            };
        }

        // Return first row if exists
        if (data && data.length > 0) {
            return data[0];
        }

        // Create default config if none exists
        const { data: newConfig, error: insertError } = await supabase
            .from('reviews_config')
            .insert({
                average_rating: 5.0,
                total_reviews_count: 0,
            })
            .select()
            .single();

        if (insertError) {
            return {
                id: 'default',
                average_rating: 5.0,
                total_reviews_count: 0,
                updated_at: new Date().toISOString(),
            };
        }
        return newConfig;
    } catch (err) {
        return {
            id: 'default',
            average_rating: 5.0,
            total_reviews_count: 0,
            updated_at: new Date().toISOString(),
        };
    }
}

export async function updateReviewsConfig(updates: Partial<ReviewsConfig>): Promise<boolean> {
    // Get the first existing config row
    const { data: existing } = await supabase
        .from('reviews_config')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (!existing || existing.length === 0) {
        // Create if doesn't exist
        const { error } = await supabase
            .from('reviews_config')
            .insert({
                average_rating: updates.average_rating || 5.0,
                total_reviews_count: updates.total_reviews_count || 0,
            });

        if (error) {
            console.error('Error creating reviews config:', error);
            return false;
        }
        return true;
    }

    // Update the existing row (first one)
    const { error } = await supabase
        .from('reviews_config')
        .update({
            average_rating: updates.average_rating,
            total_reviews_count: updates.total_reviews_count,
            updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);

    if (error) {
        console.error('Error updating reviews config:', error);
        return false;
    }

    return true;
}

// ==================== APPOINTMENT SERVICES (Multi-Service) ====================

export async function getAppointmentServices(appointmentId: string): Promise<AppointmentService[]> {
    const { data, error } = await supabase
        .from('appointment_services')
        .select(`
            *,
            service:services(*),
            staff:staff(*)
        `)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching appointment services:', error);
        return [];
    }

    return data || [];
}

export async function updateServiceCompletion(
    id: string,
    isCompleted: boolean,
    cancellationReason?: string | null
): Promise<boolean> {
    const updateData: any = { is_completed: isCompleted };

    // If marking as incomplete, store the reason
    if (!isCompleted && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
    }

    // If marking as complete, clear any previous cancellation reason
    if (isCompleted) {
        updateData.cancellation_reason = null;
    }

    const { error } = await supabase
        .from('appointment_services')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error updating service completion:', error.message, error.details, error.hint);
        return false;
    }

    return true;
}

export async function addServiceToAppointment(
    appointmentId: string,
    serviceId: string,
    staffId: string | null = null
): Promise<AppointmentService | null> {
    const { data, error } = await supabase
        .from('appointment_services')
        .insert({
            appointment_id: appointmentId,
            service_id: serviceId,
            staff_id: staffId,
            is_completed: true // Checked by default
        })
        .select(`
            *,
            service:services(*),
            staff:staff(*)
        `)
        .single();

    if (error) {
        console.error('Error adding service to appointment:', error.message, error.details);
        return null;
    }

    return data;
}

export async function updateServiceStaff(id: string, staffId: string | null): Promise<boolean> {
    const { error } = await supabase
        .from('appointment_services')
        .update({ staff_id: staffId })
        .eq('id', id);

    if (error) {
        console.error('Error updating service staff:', error);
        return false;
    }

    return true;
}

export async function updateServiceFinalPrice(id: string, finalPrice: number): Promise<boolean> {
    const { error } = await supabase
        .from('appointment_services')
        .update({ final_price: finalPrice })
        .eq('id', id);

    if (error) {
        console.error('Error updating service final price:', error);
        return false;
    }

    return true;
}

// ==================== BILLS ====================

export async function generateBillNumber(date: Date): Promise<string> {
    const dateStr = date.toISOString().split('T')[0];

    // Count existing bills for this date
    const { count, error } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('bill_date', dateStr);

    if (error) {
        console.error('Error counting bills:', error);
    }

    const nextNum = (count || 0) + 1;
    const dateFormatted = date.toISOString().split('T')[0].replace(/-/g, '');
    return `VFS-${dateFormatted}-${nextNum.toString().padStart(3, '0')}`;
}

export async function createBill(billData: {
    appointment_id?: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    services: BillService[];
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    final_amount: number;
    payment_mode: 'cash' | 'upi' | 'card';
    staff_name?: string;
    notes?: string;
}): Promise<Bill | null> {
    const now = new Date();
    const billNumber = await generateBillNumber(now);
    const billDate = now.toISOString().split('T')[0];
    const billTime = now.toTimeString().split(' ')[0];

    const { data, error } = await supabase
        .from('bills')
        .insert({
            bill_number: billNumber,
            appointment_id: billData.appointment_id || null,
            customer_name: billData.customer_name,
            customer_phone: billData.customer_phone || null,
            customer_email: billData.customer_email || null,
            bill_date: billDate,
            bill_time: billTime,
            services: billData.services,
            subtotal: billData.subtotal,
            discount_percent: billData.discount_percent,
            discount_amount: billData.discount_amount,
            final_amount: billData.final_amount,
            payment_mode: billData.payment_mode,
            staff_name: billData.staff_name || null,
            notes: billData.notes || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating bill:', error);
        return null;
    }

    return data;
}

export async function getBillByAppointment(appointmentId: string): Promise<Bill | null> {
    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching bill:', error);
        return null;
    }

    return data;
}

export async function getBillsByDate(date: string): Promise<Bill[]> {
    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('bill_date', date)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bills by date:', error);
        return [];
    }

    return data || [];
}

export async function getTodayRevenue(): Promise<{ total: number; count: number }> {
    const today = new Date().toISOString().split('T')[0];
    const bills = await getBillsByDate(today);

    const total = bills.reduce((sum, bill) => sum + (bill.final_amount || 0), 0);
    return { total, count: bills.length };
}

export async function getRecentBills(limit: number = 5): Promise<Bill[]> {
    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent bills:', error);
        return [];
    }

    return data || [];
}

export async function getAllBills(): Promise<Bill[]> {
    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all bills:', error);
        return [];
    }

    return data || [];
}

export interface RevenueStats {
    totalRevenue: number;
    totalBills: number;
    totalClients: number;
    avgBillValue: number;
    totalDiscount: number;
    billsWithDiscount: number;
    avgDiscountPercent: number;
    serviceStats: { name: string; count: number; revenue: number }[];
    monthlyRevenue: { month: string; revenue: number; bills: number }[];
    bestMonth: { month: string; revenue: number } | null;
    worstMonth: { month: string; revenue: number } | null;
    todayRevenue: number;
    mtdRevenue: number;
    ytdRevenue: number;
}

export async function getRevenueStats(): Promise<RevenueStats> {
    const bills = await getAllBills();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.toISOString().slice(0, 7);
    const currentYear = now.getFullYear().toString();

    // Basic metrics
    const totalRevenue = bills.reduce((sum, b) => sum + (b.final_amount || 0), 0);
    const totalBills = bills.length;
    const uniquePhones = new Set(bills.map(b => b.customer_phone).filter(Boolean));
    const totalClients = uniquePhones.size;
    const avgBillValue = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;

    // Discount metrics
    const billsWithDiscount = bills.filter(b => b.discount_percent > 0).length;
    const totalDiscount = bills.reduce((sum, b) => sum + (b.discount_amount || 0), 0);
    const avgDiscountPercent = billsWithDiscount > 0
        ? Math.round(bills.filter(b => b.discount_percent > 0).reduce((sum, b) => sum + b.discount_percent, 0) / billsWithDiscount)
        : 0;

    // Service stats
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    bills.forEach(bill => {
        bill.services.forEach(svc => {
            if (!serviceMap[svc.name]) {
                serviceMap[svc.name] = { count: 0, revenue: 0 };
            }
            serviceMap[svc.name].count++;
            serviceMap[svc.name].revenue += svc.price;
        });
    });
    const serviceStats = Object.entries(serviceMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Monthly revenue
    const monthMap: Record<string, { revenue: number; bills: number }> = {};
    bills.forEach(bill => {
        const month = bill.bill_date.slice(0, 7);
        if (!monthMap[month]) {
            monthMap[month] = { revenue: 0, bills: 0 };
        }
        monthMap[month].revenue += bill.final_amount || 0;
        monthMap[month].bills++;
    });
    const monthlyRevenue = Object.entries(monthMap)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // Best/Worst month
    let bestMonth: { month: string; revenue: number } | null = null;
    let worstMonth: { month: string; revenue: number } | null = null;
    if (monthlyRevenue.length > 0) {
        bestMonth = monthlyRevenue.reduce((best, curr) => curr.revenue > best.revenue ? curr : best);
        worstMonth = monthlyRevenue.reduce((worst, curr) => curr.revenue < worst.revenue ? curr : worst);
    }

    // Today/MTD/YTD
    const todayRevenue = bills
        .filter(b => b.bill_date === today)
        .reduce((sum, b) => sum + (b.final_amount || 0), 0);
    const mtdRevenue = bills
        .filter(b => b.bill_date.startsWith(currentMonth))
        .reduce((sum, b) => sum + (b.final_amount || 0), 0);
    const ytdRevenue = bills
        .filter(b => b.bill_date.startsWith(currentYear))
        .reduce((sum, b) => sum + (b.final_amount || 0), 0);

    return {
        totalRevenue,
        totalBills,
        totalClients,
        avgBillValue,
        totalDiscount,
        billsWithDiscount,
        avgDiscountPercent,
        serviceStats,
        monthlyRevenue,
        bestMonth,
        worstMonth,
        todayRevenue,
        mtdRevenue,
        ytdRevenue,
    };
}
