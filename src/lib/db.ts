import { createClient } from './supabase/client';
import { Service, Staff, Appointment, Testimonial, ReviewsConfig, AppointmentService, Bill, BillService, AppointmentWithServices } from './types';
import logger from './logger';

const supabase = createClient();

// ... (lines 6-135 unchanged)

export async function getAppointments(): Promise<AppointmentWithServices[]> {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      service:services(*),
      staff:staff(*),
      user:users(*),
      allServices:appointment_services(
        *,
        service:services(*)
      )
    `)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching appointments by date:', error);
        return [];
    }

    return data || [];
}

export async function getAppointmentsByDate(date: string): Promise<AppointmentWithServices[]> {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      service:services(*),
      staff:staff(*),
      user:users(*),
      allServices:appointment_services(
        *,
        service:services(*)
      )
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
    // Use RPC to get booked slots (works for anonymous users after RLS hardening)
    const { data, error } = await supabase.rpc('get_booked_slots', {
        p_staff_id: staffId || null,
        p_date: date,
    });

    if (error) {
        console.error('Error fetching booked slots:', error);
        return [];
    }

    logger.log('Blocked slots for date:', date, 'staff:', staffId, '->', data);
    return (data as string[]) || [];
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
    idempotency_key?: string; // BUG-C3 FIX: Idempotency key for retry safety
}): Promise<{ success: boolean; error?: string; appointment_id?: string; idempotent?: boolean }> {
    logger.log('Creating appointment with atomic RPC:', appointment);

    if (!appointment.service_ids.length) {
        return { success: false, error: 'At least one service is required' };
    }

    // Call the atomic booking RPC with idempotency key
    const { data, error } = await supabase.rpc('book_appointment_atomic', {
        p_service_ids: appointment.service_ids,
        p_staff_id: appointment.staff_id || null,
        p_appointment_date: appointment.appointment_date,
        p_start_time: appointment.start_time,
        p_end_time: appointment.end_time,
        p_user_name: appointment.user_name,
        p_user_phone: appointment.user_phone,
        p_user_email: appointment.user_email || null,
        p_idempotency_key: appointment.idempotency_key || null, // BUG-C3 FIX
    });

    if (error) {
        console.error('RPC Error:', error);
        return { success: false, error: error.message };
    }

    // The RPC returns a JSONB object with success, error, appointment_id, and idempotent flag
    const result = data as { success: boolean; error?: string; appointment_id?: string; idempotent?: boolean };

    if (!result.success) {
        console.warn('Booking failed:', result.error);
        return { success: false, error: result.error || 'Booking failed' };
    }

    logger.log('Appointment created successfully via RPC!', result.appointment_id, result.idempotent ? '(idempotent)' : '');
    return { success: true, appointment_id: result.appointment_id, idempotent: result.idempotent };
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

// DEPRECATED: Use completeAppointmentWithBill for atomic completion
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

// BUG-C1 FIX: Atomic completion with bill generation
// Both appointment status update AND bill creation happen in one transaction
// If either fails, both are rolled back - no partial writes possible
export async function completeAppointmentWithBill(params: {
    appointmentId: string;
    finalAmount: number;
    paymentMode: 'cash' | 'upi' | 'card';
    discountPercent?: number;
    services: BillService[];
    staffName?: string;
    notes?: string;
}): Promise<{ success: boolean; error?: string; billId?: string; billNumber?: string; idempotent?: boolean }> {
    const { data, error } = await supabase.rpc('complete_appointment_with_bill', {
        p_appointment_id: params.appointmentId,
        p_final_amount: params.finalAmount,
        p_payment_mode: params.paymentMode,
        p_discount_percent: params.discountPercent || 0,
        // FIX: Pass services as array directly, not JSON string
        // Supabase automatically converts JS arrays to JSONB
        p_services: params.services,
        p_staff_name: params.staffName || null,
        p_notes: params.notes || null,
    });

    if (error) {
        console.error('Error completing appointment with bill:', error);
        return { success: false, error: error.message };
    }

    const result = data as {
        success: boolean;
        error?: string;
        bill_id?: string;
        bill_number?: string;
        idempotent?: boolean;
    };

    if (!result.success) {
        return { success: false, error: result.error || 'Failed to complete appointment' };
    }

    return {
        success: true,
        billId: result.bill_id,
        billNumber: result.bill_number,
        idempotent: result.idempotent,
    };
}

// ==================== CUSTOMER HISTORY ====================

export async function getUserByPhone(phone: string): Promise<{ id: string; name: string; created_at: string } | null> {
    // Use RPC for anonymous access (after RLS hardening)
    const { data, error } = await supabase.rpc('get_user_by_phone', {
        p_phone: phone,
    });

    if (error) {
        console.error('Error fetching user by phone:', error);
        return null;
    }

    // RPC returns array, get first item
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

export async function getAppointmentsByPhone(phone: string): Promise<AppointmentWithServices[]> {
    // Use RPC for anonymous access (after RLS hardening)
    const { data, error } = await supabase.rpc('get_appointments_by_phone', {
        p_phone: phone,
    });

    if (error) {
        console.error('Error fetching appointments by phone:', error);
        return [];
    }

    return (data as AppointmentWithServices[]) || [];
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

    // Calculate total savings from both COMBO OFFERS and STORE DISCOUNTS
    const totalSavings = completedAppointments.reduce((sum, apt) => {
        let savings = 0;

        // 1. Calculate combo offer savings (compare_at_price - price)
        if (apt.allServices && apt.allServices.length > 0) {
            apt.allServices.forEach(svc => {
                if (svc.service?.compare_at_price && svc.service.compare_at_price > svc.service.price) {
                    savings += svc.service.compare_at_price - svc.service.price;
                }
            });
        } else if (apt.service?.compare_at_price && apt.service.compare_at_price > apt.service.price) {
            savings += apt.service.compare_at_price - apt.service.price;
        }

        // 2. Calculate store discount savings
        if (apt.discount_percent && apt.discount_percent > 0) {
            const originalTotal = apt.allServices && apt.allServices.length > 0
                ? apt.allServices.reduce((s, svc) => s + (svc.service?.price || 0), 0)
                : apt.service?.price || 0;
            savings += Math.round(originalTotal * (apt.discount_percent / 100));
        }

        return sum + savings;
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

// ==================== SERVICES GETTERS ====================

export async function getServices(): Promise<Service[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }

    return data || [];
}

export async function getAllServices(): Promise<Service[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category')
        .order('name');

    if (error) {
        console.error('Error fetching all services:', error);
        return [];
    }

    return data || [];
}

export async function getMostBookedServices(limit: number = 4): Promise<Service[]> {
    // P1 FIX: Use SQL RPC with GROUP BY instead of N+1 queries
    // BEFORE: 2 queries (appointment_services + services) + JS sorting
    // AFTER: 1 RPC call with SQL aggregation
    const { data, error } = await supabase.rpc('get_most_booked_services', {
        p_limit: limit,
    });

    if (error) {
        console.error('Error fetching most booked services:', error);
        // Fallback: return non-combo active services
        const { data: fallbackData } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .eq('is_combo', false)
            .limit(limit);
        return fallbackData || [];
    }

    return (data as Service[]) || [];
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

// ==================== STAFF GETTERS ====================

export async function getStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
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
        .order('name');

    if (error) {
        console.error('Error fetching all staff:', error);
        return [];
    }

    return data || [];
}

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

    // Use atomic RPC to generate bill number (prevents race condition)
    const { data, error } = await supabase.rpc('generate_bill_number_atomic', {
        p_date: dateStr,
    });

    if (error) {
        console.error('Error generating bill number:', error);
        // Fallback to timestamp-based unique number if RPC fails
        const timestamp = Date.now().toString(36).toUpperCase();
        const dateFormatted = dateStr.replace(/-/g, '');
        return `VFS-${dateFormatted}-${timestamp}`;
    }

    return data as string;
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
    // P1 FIX: Use SQL RPC instead of loading all bills into memory
    // BEFORE: Loads ALL bills (O(n) memory), processes with JS array methods
    // AFTER: 1 RPC call with SQL SUM/COUNT/GROUP BY (O(1) memory)
    const { data, error } = await supabase.rpc('get_revenue_stats');

    if (error || !data) {
        console.error('Error fetching revenue stats:', error);
        // Return default empty stats
        return {
            totalRevenue: 0,
            totalBills: 0,
            totalClients: 0,
            avgBillValue: 0,
            totalDiscount: 0,
            billsWithDiscount: 0,
            avgDiscountPercent: 0,
            serviceStats: [],
            monthlyRevenue: [],
            bestMonth: null,
            worstMonth: null,
            todayRevenue: 0,
            mtdRevenue: 0,
            ytdRevenue: 0,
        };
    }

    // The RPC returns JSONB, map to our interface
    return {
        totalRevenue: data.totalRevenue || 0,
        totalBills: data.totalBills || 0,
        totalClients: data.totalClients || 0,
        avgBillValue: data.avgBillValue || 0,
        totalDiscount: data.totalDiscount || 0,
        billsWithDiscount: data.billsWithDiscount || 0,
        avgDiscountPercent: data.avgDiscountPercent || 0,
        serviceStats: data.serviceStats || [],
        monthlyRevenue: data.monthlyRevenue || [],
        bestMonth: data.bestMonth || null,
        worstMonth: data.worstMonth || null,
        todayRevenue: data.todayRevenue || 0,
        mtdRevenue: data.mtdRevenue || 0,
        ytdRevenue: data.ytdRevenue || 0,
    };
}
