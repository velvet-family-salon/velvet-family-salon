import { createClient } from './supabase/client';
import { Service, Staff, Appointment, Testimonial, ReviewsConfig, AppointmentService } from './types';

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
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }

    return data || [];
}

export async function getAllStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
        .from('staff')
        .select('*');

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
        is_completed: false,
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
    paymentMode: 'cash' | 'upi' | 'card'
): Promise<boolean> {
    const { error } = await supabase
        .from('appointments')
        .update({
            status: 'completed',
            final_amount: finalAmount,
            payment_mode: paymentMode,
        })
        .eq('id', id);

    if (error) {
        console.error('Error completing appointment:', error);
        return false;
    }

    return true;
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
        .delete()
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

export async function updateServiceCompletion(id: string, isCompleted: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('appointment_services')
        .update({ is_completed: isCompleted })
        .eq('id', id);

    if (error) {
        console.error('Error updating service completion:', error);
        return false;
    }

    return true;
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


