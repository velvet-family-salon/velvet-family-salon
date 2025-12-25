'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Check, X, Loader2, Phone, MessageCircle, Mail,
    IndianRupee, CreditCard, Banknote, Smartphone, Receipt, MessageSquare, Settings,
    CheckSquare, Square, Plus, UserPlus, Minus, RefreshCw, ChevronLeft, ChevronRight, Shield,
    Percent, Printer, Download, FileText
} from 'lucide-react';
import { getAppointments, updateAppointmentStatus, completeAppointment, getAppointmentServices, updateServiceCompletion, createAppointment, getServices, getStaff, createBill, getBillByAppointment, addServiceToAppointment } from '@/lib/db';
import { Appointment, AppointmentStatus, AppointmentService, Service, Staff, Bill, BillService } from '@/lib/types';
import { formatPrice, formatTime, formatDate, getWhatsAppLink, getCallLink, formatDuration } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { BillReceipt, generateWhatsAppReceipt, generateEmailSubject, generateEmailBody } from '@/components/admin/BillReceipt';

// Extended appointment with services
interface AppointmentWithServices extends Appointment {
    allServices?: AppointmentService[];
}

export default function AdminBookingsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<AppointmentWithServices[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
    const { hasPermission, loading: permLoading } = usePermissions();

    const canView = hasPermission('view_bookings');
    const canManage = hasPermission('manage_bookings');

    // Date range filter
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | null>(null);

    // Sorting and pagination
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'time' | 'status' | 'name'>('time');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Complete modal state
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithServices | null>(null);
    const [finalAmount, setFinalAmount] = useState('');
    const [discountPercent, setDiscountPercent] = useState('0');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash');
    const [completing, setCompleting] = useState(false);

    // Walk-In modal state
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [walkInServices, setWalkInServices] = useState<Service[]>([]);
    const [walkInStaff, setWalkInStaff] = useState<Staff | null>(null);
    const [creatingWalkIn, setCreatingWalkIn] = useState(false);

    // Receipt modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [currentBill, setCurrentBill] = useState<Bill | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Add Service modal state
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [addServiceAppointmentId, setAddServiceAppointmentId] = useState<string | null>(null);
    const [addingService, setAddingService] = useState(false);
    const [addServiceSearch, setAddServiceSearch] = useState('');

    // Cancellation reason modal state
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonServiceId, setReasonServiceId] = useState<string | null>(null);
    const [reasonAppointmentId, setReasonAppointmentId] = useState<string | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');

    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        setLoading(true);
        const data = await getAppointments();

        // Load services for each appointment
        const appointmentsWithServices = await Promise.all(
            data.map(async (apt) => {
                const services = await getAppointmentServices(apt.id);
                return { ...apt, allServices: services };
            })
        );

        setAppointments(appointmentsWithServices);
        setLoading(false);
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAppointments();
        setRefreshing(false);
    };

    // Quick date filter helpers
    const setTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateFrom(today);
        setDateTo(today);
        setActiveQuickFilter('today');
    };
    const setYesterdayFilter = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        setDateFrom(yStr);
        setDateTo(yStr);
        setActiveQuickFilter('yesterday');
    };
    const setWeekFilter = () => {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setDateFrom(weekStart.toISOString().split('T')[0]);
        setDateTo(weekEnd.toISOString().split('T')[0]);
        setActiveQuickFilter('week');
    };
    const setMonthFilter = () => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateFrom(monthStart.toISOString().split('T')[0]);
        setDateTo(monthEnd.toISOString().split('T')[0]);
        setActiveQuickFilter('month');
    };
    const clearDateFilter = () => {
        setDateFrom('');
        setDateTo('');
        setActiveQuickFilter(null);
    };

    // Filter appointments
    const filteredAppointments = appointments.filter((apt) => {
        const matchesSearch =
            apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.allServices?.some(s => s.service?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            apt.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.user?.phone?.includes(searchQuery) || false;
        const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
        const matchesDateFrom = !dateFrom || apt.appointment_date >= dateFrom;
        const matchesDateTo = !dateTo || apt.appointment_date <= dateTo;
        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    // Sort appointments - Smart default: Active bookings first (by time), then completed (recent first)
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        // Default: Sort by date+time descending (latest booking first)
        if (sortBy === 'time') {
            const dateTimeA = new Date(`${a.appointment_date}T${a.start_time}`).getTime();
            const dateTimeB = new Date(`${b.appointment_date}T${b.start_time}`).getTime();
            return dateTimeB - dateTimeA;
        }

        switch (sortBy) {
            case 'date-desc': {
                const dateDiff = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
                if (dateDiff === 0) return a.start_time.localeCompare(b.start_time);
                return dateDiff;
            }
            case 'date-asc': {
                const dateDiff = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
                if (dateDiff === 0) return a.start_time.localeCompare(b.start_time);
                return dateDiff;
            }
            case 'status': return ['pending', 'confirmed', 'completed', 'cancelled'].indexOf(a.status) - ['pending', 'confirmed', 'completed', 'cancelled'].indexOf(b.status);
            case 'name': return (a.user?.name || '').localeCompare(b.user?.name || '');
            default: return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
    const paginatedAppointments = sortedAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, dateFrom, dateTo, sortBy]);

    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        const success = await updateAppointmentStatus(id, status);
        if (success) {
            setAppointments(appointments.map(apt =>
                apt.id === id ? { ...apt, status } : apt
            ));
            showToast('success', `Appointment ${status}`);
        } else {
            showToast('error', 'Failed to update status');
        }
    };

    const handleServiceToggle = async (appointmentId: string, serviceId: string, currentStatus: boolean) => {
        // If unchecking (marking as incomplete), show reason modal
        if (currentStatus) {
            setReasonServiceId(serviceId);
            setReasonAppointmentId(appointmentId);
            setShowReasonModal(true);
        } else {
            // If checking (marking as complete), update directly
            const success = await updateServiceCompletion(serviceId, true, null);
            if (success) {
                setAppointments(appointments.map(apt => {
                    if (apt.id === appointmentId && apt.allServices) {
                        const updatedApt = {
                            ...apt,
                            allServices: apt.allServices.map(s =>
                                s.id === serviceId ? { ...s, is_completed: true, cancellation_reason: null } : s
                            )
                        };
                        if (selectedAppointment?.id === appointmentId) {
                            setSelectedAppointment(updatedApt);
                        }
                        return updatedApt;
                    }
                    return apt;
                }));
            }
        }
    };

    // Handle submitting cancellation reason
    const handleSubmitReason = async () => {
        if (!reasonServiceId || !reasonAppointmentId || !cancellationReason.trim()) {
            showToast('error', 'Please provide a reason');
            return;
        }

        const success = await updateServiceCompletion(reasonServiceId, false, cancellationReason);
        if (success) {
            setAppointments(appointments.map(apt => {
                if (apt.id === reasonAppointmentId && apt.allServices) {
                    const updatedApt = {
                        ...apt,
                        allServices: apt.allServices.map(s =>
                            s.id === reasonServiceId ? { ...s, is_completed: false, cancellation_reason: cancellationReason } : s
                        )
                    };
                    if (selectedAppointment?.id === reasonAppointmentId) {
                        setSelectedAppointment(updatedApt);
                    }
                    return updatedApt;
                }
                return apt;
            }));
            showToast('success', 'Service marked as incomplete');
        }

        // Reset modal state
        setShowReasonModal(false);
        setReasonServiceId(null);
        setReasonAppointmentId(null);
        setCancellationReason('');
    };

    const openCompleteModal = (apt: AppointmentWithServices) => {
        setSelectedAppointment(apt);

        // Always calculate fresh totals
        const total = apt.allServices?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || apt.service?.price || 0;
        setFinalAmount(total.toString());
        setDiscountPercent(apt.discount_percent?.toString() || '0');
        setPaymentMode(apt.payment_mode || 'cash');

        setShowCompleteModal(true);
    };

    // Handle Get Bill button - fetch and display existing bill
    const handleGetBill = async (appointmentId: string) => {
        try {
            const bill = await getBillByAppointment(appointmentId);
            if (bill) {
                setCurrentBill(bill);
                setShowReceiptModal(true);
            } else {
                showToast('error', 'No bill found for this appointment');
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
            showToast('error', 'Failed to fetch bill');
        }
    };

    useEffect(() => {
        if (showCompleteModal && selectedAppointment) {
            // Only include completed services in total calculation
            const completedServices = selectedAppointment.allServices?.filter(s => s.is_completed) || [];
            const baseTotal = completedServices.length > 0
                ? completedServices.reduce((sum, s) => sum + (s.service?.price || 0), 0)
                : selectedAppointment.service?.price || 0;
            const discount = parseFloat(discountPercent) || 0;
            const discountedAmount = baseTotal * (1 - discount / 100);
            setFinalAmount(Math.round(discountedAmount).toString());
        }
    }, [discountPercent, showCompleteModal, selectedAppointment]);

    const handleComplete = async () => {
        if (!selectedAppointment || !finalAmount) return;

        setCompleting(true);
        const discountValue = parseFloat(discountPercent) || 0;
        const finalAmountNum = parseFloat(finalAmount);

        // Only include COMPLETED services in bill
        const completedServices = selectedAppointment.allServices?.filter(s => s.is_completed) || [];

        // Calculate subtotal from ORIGINAL prices (compare_at_price) of COMPLETED services only
        const subtotal = completedServices.length > 0
            ? completedServices.reduce((sum, s) => {
                const originalPrice = s.service?.compare_at_price || s.service?.price || 0;
                return sum + originalPrice;
            }, 0)
            : selectedAppointment.service?.compare_at_price || selectedAppointment.service?.price || 0;

        const discountAmount = Math.round(subtotal * (discountValue / 100));

        // Create bill data with DISCOUNTED prices of COMPLETED services only
        const servicesForBill: BillService[] = completedServices.length > 0
            ? completedServices.map(s => ({
                name: s.service?.name || 'Service',
                price: s.service?.price || 0, // This is the discounted price
            }))
            : [{
                name: selectedAppointment.service?.name || 'Service',
                price: selectedAppointment.service?.price || 0,
            }];

        // Complete the appointment
        const success = await completeAppointment(
            selectedAppointment.id,
            finalAmountNum,
            paymentMode,
            discountValue
        );

        if (success) {
            // Create bill
            const bill = await createBill({
                appointment_id: selectedAppointment.id,
                customer_name: selectedAppointment.user?.name || 'Walk-In Customer',
                customer_phone: selectedAppointment.user?.phone || undefined,
                customer_email: selectedAppointment.user?.email || undefined,
                services: servicesForBill,
                subtotal: subtotal, // Original prices total
                discount_percent: discountValue,
                discount_amount: discountAmount,
                final_amount: finalAmountNum,
                payment_mode: paymentMode,
                staff_name: selectedAppointment.staff?.name || undefined,
            });

            setAppointments(appointments.map(apt =>
                apt.id === selectedAppointment.id
                    ? { ...apt, status: 'completed', final_amount: finalAmountNum, discount_percent: discountValue, payment_mode: paymentMode }
                    : apt
            ));

            setShowCompleteModal(false);
            setCompleting(false);

            if (bill) {
                setCurrentBill(bill);
                setShowReceiptModal(true);
                showToast('success', 'Appointment completed & bill generated!');
            } else {
                showToast('success', 'Appointment completed (bill generation failed)');
            }

            setSelectedAppointment(null);
        } else {
            setCompleting(false);
            showToast('error', 'Failed to complete appointment');
        }
    };

    // WhatsApp message generators
    const getConfirmationMessage = (apt: AppointmentWithServices) => {
        const servicesText = apt.allServices?.length
            ? apt.allServices.map(s => s.service?.name).filter(Boolean).join(', ')
            : apt.service?.name;
        return `Hi ${apt.user?.name || 'there'} 👋

Your appointment at *Velvet Family Salon* is *CONFIRMED* ✅

*Services:* ${servicesText}
*Date:* ${formatDate(apt.appointment_date)}
*Time:* ${formatTime(apt.start_time)}

See you soon! ✨`;
    };

    const getReceiptMessage = (apt: AppointmentWithServices) => {
        let servicesText = '';
        if (apt.allServices?.length) {
            servicesText = apt.allServices
                .map(s => `${s.is_completed ? '✓' : '✗'} ${s.service?.name} - ${formatPrice(s.service?.price || 0)}`)
                .join('\n');
        } else {
            servicesText = `✓ ${apt.service?.name} - ${formatPrice(apt.service?.price || 0)}`;
        }

        return `Thank you ${apt.user?.name || ''}! 😊

*Services:*
${servicesText}

*Total Paid:* ${formatPrice(apt.final_amount || apt.service?.price || 0)}
*Payment:* ${apt.payment_mode?.toUpperCase() || 'N/A'}

We hope you enjoyed your experience at *Velvet Family Salon* ✨

Hope to see you again! 💇‍♀️`;
    };


    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings', active: true },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

    if (loading || permLoading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
            </AuthGuard>
        );
    }

    if (!canView) {
        return (
            <AuthGuard>
                <AccessDenied />
            </AuthGuard>
        );
    }

    // Open Add Service modal
    const openAddServiceModal = async (appointmentId: string) => {
        setAddServiceAppointmentId(appointmentId);
        // Load services and staff if not already loaded
        if (allServices.length === 0) {
            const services = await getServices();
            setAllServices(services);
        }
        if (allStaff.length === 0) {
            const staff = await getStaff();
            setAllStaff(staff);
        }
        setShowAddServiceModal(true);
    };

    const handleAddService = async (serviceId: string) => {
        if (!addServiceAppointmentId) return;
        setAddingService(true);
        const newService = await addServiceToAppointment(addServiceAppointmentId, serviceId);
        if (newService) {
            // Update appointments state
            setAppointments(appointments.map(apt => {
                if (apt.id === addServiceAppointmentId) {
                    const updatedServices = [...(apt.allServices || []), newService];
                    const updatedApt = { ...apt, allServices: updatedServices };
                    if (selectedAppointment?.id === addServiceAppointmentId) {
                        setSelectedAppointment(updatedApt);
                    }
                    return updatedApt;
                }
                return apt;
            }));
            showToast('success', 'Service added successfully');
            setShowAddServiceModal(false);
        } else {
            showToast('error', 'Failed to add service');
        }
        setAddingService(false);
    };

    // Open Walk-In modal
    const openWalkInModal = async () => {
        // Load services and staff if not already loaded
        if (allServices.length === 0) {
            const services = await getServices();
            setAllServices(services);
        }
        if (allStaff.length === 0) {
            const staff = await getStaff();
            setAllStaff(staff);
        }
        setWalkInName('');
        setWalkInPhone('');
        setWalkInServices([]);
        setWalkInStaff(null);
        setShowWalkInModal(true);
    };

    const handleWalkInSubmit = async () => {
        if (!walkInName || !walkInPhone || walkInServices.length === 0) return;

        setCreatingWalkIn(true);

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Round to nearest 30-minute slot
        // If minutes < 15, round down to :00
        // If minutes >= 15 and < 45, round to :30
        // If minutes >= 45, round up to next hour :00
        let slotHours = now.getHours();
        let slotMinutes = now.getMinutes();

        if (slotMinutes < 15) {
            slotMinutes = 0;
        } else if (slotMinutes < 45) {
            slotMinutes = 30;
        } else {
            slotMinutes = 0;
            slotHours += 1;
        }

        const startTime = `${slotHours.toString().padStart(2, '0')}:${slotMinutes.toString().padStart(2, '0')}`;

        // Calculate end time based on total duration
        const totalDuration = walkInServices.reduce((sum, s) => sum + s.duration_minutes, 0);
        const endTotalMinutes = slotHours * 60 + slotMinutes + totalDuration;
        const endHours = Math.floor(endTotalMinutes / 60);
        const endMins = endTotalMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        const result = await createAppointment({
            service_ids: walkInServices.map(s => s.id),
            staff_id: walkInStaff?.id,
            appointment_date: today,
            start_time: startTime,
            end_time: endTime,
            user_name: walkInName,
            user_phone: walkInPhone,
        });

        setCreatingWalkIn(false);

        if (result.success) {
            setShowWalkInModal(false);
            // Auto-confirm walk-in since they're already here
            if (result.appointment_id) {
                await updateAppointmentStatus(result.appointment_id, 'confirmed');
            }
            loadAppointments(); // Refresh list
        } else {
            alert('Failed to create walk-in booking');
        }
    };

    const addWalkInService = (service: Service) => {
        if (!walkInServices.find(s => s.id === service.id)) {
            setWalkInServices([...walkInServices, service]);
        }
    };

    const removeWalkInService = (serviceId: string) => {
        setWalkInServices(walkInServices.filter(s => s.id !== serviceId));
    };

    const walkInTotal = walkInServices.reduce((sum, s) => sum + s.price, 0);
    const walkInDuration = walkInServices.reduce((sum, s) => sum + s.duration_minutes, 0);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
                {/* Header */}
                <header className="sticky top-0 z-30 glass border-b border-[var(--card-border)]">
                    <div className="px-4 py-3 max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Link href="/admin/dashboard" className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-lg transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-xl sm:text-2xl font-bold">Manage Bookings</h1>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                                {canManage && (
                                    <button
                                        onClick={openWalkInModal}
                                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gold text-velvet-black rounded-xl font-medium hover:bg-gold-dark transition-colors whitespace-nowrap text-sm"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Walk-In
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex w-full">
                    {/* Sidebar - Desktop */}
                    <aside className="hidden md:block w-56 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                        ? 'bg-gold/10 text-gold'
                                        : 'hover:bg-beige-100 dark:hover:bg-velvet-dark text-[var(--muted)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 pb-24 md:pb-8">
                        {/* Filters - Compact */}
                        <div className="space-y-3 mb-6">
                            {/* Search and Dropdowns */}
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Search name, phone, service..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input-field pl-10 h-10 text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                                        className="bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray rounded-xl px-4 h-10 text-sm focus:ring-1 focus:ring-gold outline-none min-w-[120px]"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                        className="bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray rounded-xl px-4 h-10 text-sm focus:ring-1 focus:ring-gold outline-none min-w-[120px]"
                                    >
                                        <option value="date-desc">Newest First</option>
                                        <option value="date-asc">Oldest First</option>
                                        <option value="time">By Time</option>
                                        <option value="status">By Status</option>
                                        <option value="name">By Name</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date Quick Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={setTodayFilter}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${activeQuickFilter === 'today' ? 'bg-gold text-velvet-black shadow-lg shadow-gold/20' : 'bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray hover:border-gold'}`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={setYesterdayFilter}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${activeQuickFilter === 'yesterday' ? 'bg-velvet-gray text-white' : 'bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray hover:border-gold'}`}
                                >
                                    Yesterday
                                </button>
                                <button
                                    onClick={setWeekFilter}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${activeQuickFilter === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray hover:border-gold'}`}
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={setMonthFilter}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${activeQuickFilter === 'month' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray hover:border-gold'}`}
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => setActiveQuickFilter('custom')}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${activeQuickFilter === 'custom' ? 'bg-gold text-velvet-black shadow-lg shadow-gold/20' : 'bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray hover:border-gold'}`}
                                >
                                    Custom Range
                                </button>
                                {(dateFrom || dateTo) && (
                                    <button onClick={clearDateFilter} className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors ml-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Conditional Date Range Inputs */}
                            <AnimatePresence>
                                {activeQuickFilter === 'custom' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-velvet-dark rounded-xl border border-beige-200 dark:border-velvet-gray">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--muted)]">From:</span>
                                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-sm outline-none" />
                                            </div>
                                            <div className="h-4 w-px bg-beige-200 dark:bg-velvet-gray" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--muted)]">To:</span>
                                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-sm outline-none" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Total', count: sortedAppointments.length, color: 'bg-white dark:bg-velvet-dark border-gray-200 dark:border-velvet-gray', textColor: 'text-gray-600' },
                                { label: 'Pending', count: sortedAppointments.filter(a => a.status === 'pending').length, color: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20', textColor: 'text-yellow-600' },
                                { label: 'Confirmed', count: sortedAppointments.filter(a => a.status === 'confirmed').length, color: 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20', textColor: 'text-green-600' },
                                { label: 'Completed', count: sortedAppointments.filter(a => a.status === 'completed').length, color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', textColor: 'text-blue-600' },
                            ].map((stat) => (
                                <div key={stat.label} className={`${stat.color} border rounded-2xl p-3 shadow-sm transition-all hover:shadow-md`}>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-xl font-bold ${stat.textColor}`}>{stat.count}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-[var(--muted)]">{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bookings List */}
                        <div className="space-y-3">
                            {paginatedAppointments.map((apt, index) => {
                                // Detect walk-in: created same time as start_time (within 5 min)
                                const createdAt = new Date(apt.created_at);
                                const [startH, startM] = apt.start_time.split(':').map(Number);
                                const appointmentStart = new Date(apt.appointment_date);
                                appointmentStart.setHours(startH, startM, 0, 0);
                                const isWalkIn = Math.abs(createdAt.getTime() - appointmentStart.getTime()) < 5 * 60 * 1000;

                                return (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white dark:bg-velvet-dark rounded-xl border border-beige-200 dark:border-velvet-gray p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Client Info Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-beige-100 dark:bg-velvet-black flex items-center justify-center text-gold font-bold">
                                                    {(apt.user?.name?.[0] || 'G').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-sm">{apt.user?.name || 'Guest'}</h3>
                                                        {isWalkIn && <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded-full border border-purple-500/20 font-bold uppercase tracking-tighter">Walk-In</span>}
                                                    </div>
                                                    <p className="text-xs text-[var(--muted)] font-medium">{apt.user?.phone || 'No phone'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                                        apt.status === 'completed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                            'bg-red-500/10 text-red-600 border-red-500/20'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Services List - Compact */}
                                        <div className="mb-3 p-3 bg-beige-50/50 dark:bg-velvet-black/40 rounded-xl space-y-1.5 border border-beige-100/50 dark:border-velvet-gray/30">
                                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] pb-1.5 mb-1.5 border-b border-beige-200/50 dark:border-velvet-gray/30">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(apt.appointment_date)} • {formatTime(apt.start_time)}
                                                </span>
                                                {apt.staff && (
                                                    <span className="flex items-center gap-1.5 text-gold">
                                                        <Users className="w-3 h-3" />
                                                        {apt.staff.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Show all services or fallback to primary service */}
                                            {apt.allServices && apt.allServices.length > 0 ? (
                                                apt.allServices.map((svc) => (
                                                    <div key={svc.id} className="flex items-start gap-3 py-2 border-t border-beige-200 dark:border-velvet-gray first:border-0 first:pt-0">
                                                        <button
                                                            onClick={() => handleServiceToggle(apt.id, svc.id, svc.is_completed)}
                                                            className={`flex-shrink-0 p-1 rounded ${svc.is_completed ? 'text-green-600' : 'text-[var(--muted)]'}`}
                                                            disabled={apt.status === 'completed'}
                                                        >
                                                            {svc.is_completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                        </button>
                                                        <div className="flex-1">
                                                            <p className={`font-medium ${!svc.is_completed ? 'line-through text-[var(--muted)]' : ''}`}>
                                                                {svc.service?.name}
                                                            </p>
                                                            {!svc.is_completed && svc.cancellation_reason && (
                                                                <p className="text-xs text-red-600 italic mt-0.5">
                                                                    {svc.cancellation_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={`font-semibold ${!svc.is_completed ? 'line-through text-[var(--muted)]' : 'text-gold'}`}>
                                                            {formatPrice(svc.service?.price || 0)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                                                        <Scissors className="w-5 h-5 text-gold" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm">{apt.service?.name}</p>
                                                    </div>
                                                    <span className="font-bold text-gold">
                                                        {formatPrice(apt.final_amount || apt.service?.price || 0)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Add Service Button */}
                                            {apt.status !== 'completed' && apt.status !== 'cancelled' && canManage && (
                                                <button
                                                    onClick={() => openAddServiceModal(apt.id)}
                                                    className="w-full mt-2 py-1.5 border border-dashed border-gold/30 hover:border-gold hover:bg-gold/5 text-gold text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add Service
                                                </button>
                                            )}
                                        </div>

                                        {/* Total / Discount Info */}
                                        {(() => {
                                            // Only include COMPLETED services in total calculation
                                            const completedServices = apt.allServices && apt.allServices.length > 0
                                                ? apt.allServices.filter(s => s.is_completed)
                                                : [];

                                            const originalTotal = completedServices.length > 0
                                                ? completedServices.reduce((sum, s) => sum + (s.service?.price || 0), 0)
                                                : (apt.allServices && apt.allServices.length === 0 ? apt.service?.price || 0 : 0);

                                            // Check if any completed service has combo offer
                                            const hasComboOffer = completedServices.length > 0
                                                ? completedServices.some(s => s.service?.compare_at_price && s.service.compare_at_price > s.service.price)
                                                : apt.service?.compare_at_price && apt.service.compare_at_price > apt.service.price;

                                            // Calculate combo savings from completed services only
                                            const originalPriceTotal = completedServices.length > 0
                                                ? completedServices.reduce((sum, s) => {
                                                    const comparePrice = s.service?.compare_at_price || s.service?.price || 0;
                                                    return sum + comparePrice;
                                                }, 0)
                                                : apt.service?.compare_at_price || apt.service?.price || 0;

                                            const comboSavings = hasComboOffer ? originalPriceTotal - originalTotal : 0;
                                            const comboDiscountPercent = hasComboOffer && originalPriceTotal > 0
                                                ? Math.round((comboSavings / originalPriceTotal) * 100)
                                                : 0;

                                            const hasStoreDiscount = apt.discount_percent && apt.discount_percent > 0;
                                            const storeSavings = hasStoreDiscount ? Math.round(originalTotal * (apt.discount_percent! / 100)) : 0;

                                            return (
                                                <div className="pt-2 mt-2 border-t border-beige-200 dark:border-velvet-gray space-y-1">
                                                    {/* Show original price if combo offer exists */}
                                                    {hasComboOffer && (
                                                        <div className="flex justify-between text-sm text-[var(--muted)]">
                                                            <span>Original Price</span>
                                                            <span className="line-through">{formatPrice(originalPriceTotal)}</span>
                                                        </div>
                                                    )}

                                                    {/* Combo Offer Discount */}
                                                    {hasComboOffer && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[10px] font-bold">COMBO</span>
                                                                <span className="text-purple-600">Offer ({comboDiscountPercent}%)</span>
                                                            </span>
                                                            <span className="text-purple-600 font-medium">-{formatPrice(comboSavings)}</span>
                                                        </div>
                                                    )}

                                                    {/* Subtotal after combo (if combo exists) */}
                                                    {hasComboOffer && !hasStoreDiscount && (
                                                        <div className="flex justify-between text-sm font-medium">
                                                            <span>Subtotal</span>
                                                            <span>{formatPrice(originalTotal)}</span>
                                                        </div>
                                                    )}

                                                    {/* Store Discount */}
                                                    {hasStoreDiscount && (
                                                        <>
                                                            {hasComboOffer && (
                                                                <div className="flex justify-between text-sm text-[var(--muted)]">
                                                                    <span>After Combo</span>
                                                                    <span>{formatPrice(originalTotal)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between text-sm text-green-600">
                                                                <span>Store Discount ({apt.discount_percent}%)</span>
                                                                <span>-{formatPrice(storeSavings)}</span>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Final Amount */}
                                                    <div className="flex justify-between font-bold text-base pt-1 border-t border-beige-200/50 dark:border-velvet-gray/50">
                                                        <span>Total</span>
                                                        <span className="text-gold">{formatPrice(apt.final_amount || originalTotal)}</span>
                                                    </div>

                                                    {/* Total Savings Badge */}
                                                    {(hasComboOffer || hasStoreDiscount) && (
                                                        <div className="flex justify-end">
                                                            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium">
                                                                You saved {formatPrice(comboSavings + storeSavings)}!
                                                            </span>
                                                        </div>
                                                    )}

                                                    {apt.payment_mode && (
                                                        <p className="text-xs text-[var(--muted)] capitalize">Paid via {apt.payment_mode}</p>
                                                    )}
                                                </div>
                                            );
                                        })()
                                        }

                                        {/* Quick Contact Buttons */}
                                        <div className="flex items-center gap-2 mb-4">
                                            {apt.user?.phone && (
                                                <>
                                                    <a
                                                        href={getWhatsAppLink(apt.user.phone, apt.status === 'completed' ? getReceiptMessage(apt) : getConfirmationMessage(apt))}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors text-sm"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        {apt.status === 'completed' ? 'Send Receipt' : 'WhatsApp'}
                                                    </a>
                                                    <a
                                                        href={getCallLink(apt.user.phone)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors text-sm"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        Call
                                                    </a>
                                                </>
                                            )}
                                            {apt.user?.email && (
                                                <a
                                                    href={`mailto:${apt.user.email}`}
                                                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-600 rounded-lg hover:bg-purple-500/20 transition-colors text-sm"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Email
                                                </a>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-beige-200 dark:border-velvet-gray">
                                            {apt.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-[11px] font-bold uppercase tracking-wider"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {apt.status === 'confirmed' && (
                                                <button
                                                    onClick={() => openCompleteModal(apt)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gold text-velvet-black rounded-lg hover:bg-gold-dark transition-all text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20"
                                                >
                                                    <CheckSquare className="w-4 h-4" />
                                                    Mark as Completed
                                                </button>
                                            )}
                                            {apt.status === 'completed' && (
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-wider bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10">
                                                        <Check className="w-3 h-3" />
                                                        Completed
                                                    </div>
                                                    <button
                                                        onClick={() => handleGetBill(apt.id)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wider"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                        Get Bill
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {paginatedAppointments.length === 0 && (
                                <div className="text-center py-20 bg-white dark:bg-velvet-dark rounded-3xl border border-beige-200 dark:border-velvet-gray shadow-inner">
                                    <div className="w-16 h-16 bg-beige-50 dark:bg-velvet-black rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-[var(--muted)]" />
                                    </div>
                                    <p className="text-[var(--muted)] font-medium">No bookings found for the selected criteria</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row items-center justify-between border-t border-beige-200 dark:border-velvet-gray mt-8 pt-6 gap-4">
                                <p className="text-xs text-[var(--muted)] font-medium">
                                    Showing <span className="text-velvet-black dark:text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-velvet-black dark:text-white font-bold">{Math.min(currentPage * itemsPerPage, sortedAppointments.length)}</span> of <span className="text-velvet-black dark:text-white font-bold">{sortedAppointments.length}</span> bookings
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-1 px-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === i + 1
                                                    ? 'bg-gold text-velvet-black shadow-lg shadow-gold/20'
                                                    : 'hover:bg-beige-100 dark:hover:bg-velvet-gray'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl bg-white dark:bg-velvet-dark border border-beige-200 dark:border-velvet-gray disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Complete Appointment Modal */}
                <AnimatePresence>
                    {showCompleteModal && selectedAppointment && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                            onClick={() => setShowCompleteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-velvet-dark rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-bold mb-4">Complete Appointment</h2>

                                {/* Services summary */}
                                <div className="mb-4 p-3 bg-beige-50 dark:bg-velvet-black/50 rounded-xl">
                                    <p className="text-sm text-[var(--muted)] mb-2">
                                        {selectedAppointment.user?.name} • {formatDate(selectedAppointment.appointment_date)}
                                    </p>
                                    {selectedAppointment.allServices && selectedAppointment.allServices.length > 0 ? (
                                        <div className="space-y-1">
                                            {selectedAppointment.allServices.map(s => (
                                                <div key={s.id} className="flex justify-between items-center text-sm py-1 border-b border-beige-200/50 dark:border-velvet-gray/30 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleServiceToggle(selectedAppointment.id, s.id, s.is_completed)}
                                                            className={`p-0.5 rounded transition-colors ${s.is_completed ? 'text-green-600' : 'text-[var(--muted)] hover:text-gold'}`}
                                                        >
                                                            {s.is_completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                        </button>
                                                        <div className="flex flex-col">
                                                            <span className={`font-medium ${!s.is_completed ? 'line-through text-[var(--muted)]' : ''}`}>
                                                                {s.service?.name}
                                                            </span>
                                                            {!s.is_completed && s.cancellation_reason && (
                                                                <span className="text-[10px] text-red-500 italic">
                                                                    {s.cancellation_reason}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`font-semibold ${!s.is_completed ? 'line-through text-[var(--muted)]' : 'text-gold'}`}>
                                                        {formatPrice(s.service?.price || 0)}
                                                    </span>
                                                </div>
                                            ))}

                                            <div className="mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray/30">
                                                <button
                                                    onClick={() => openAddServiceModal(selectedAppointment.id)}
                                                    className="w-full py-2 border border-dashed border-gold/30 hover:border-gold hover:bg-gold/5 text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Extra Service
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="font-medium">{selectedAppointment.service?.name}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-gold mb-1">Total Savings</p>
                                            <p className="text-xl font-bold text-gold">
                                                ₹{Math.round((selectedAppointment.allServices?.filter(s => s.is_completed).reduce((sum, s) => sum + (s.service?.price || 0), 0) || selectedAppointment.service?.price || 0) * (parseFloat(discountPercent) || 0) / 100)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] mb-1">Final Payable</p>
                                            <p className="text-2xl font-black text-velvet-black dark:text-white">₹{finalAmount}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 opacity-70">Discount Percentage</label>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                                                <input
                                                    type="number"
                                                    value={discountPercent}
                                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                                    className="input-field pl-9 h-12 text-base font-bold bg-white dark:bg-velvet-black border-beige-200 dark:border-velvet-gray focus:border-gold"
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5 opacity-70">Amount to Collect</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                                                <input
                                                    type="number"
                                                    value={finalAmount}
                                                    onChange={(e) => setFinalAmount(e.target.value)}
                                                    className="input-field pl-9 h-12 text-lg font-black text-gold bg-white dark:bg-velvet-black border-gold/30 focus:border-gold shadow-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Payment Mode</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'cash', icon: Banknote, label: 'Cash' },
                                                { value: 'upi', icon: Smartphone, label: 'UPI' },
                                                { value: 'card', icon: CreditCard, label: 'Card' },
                                            ].map((mode) => {
                                                const Icon = mode.icon;
                                                return (
                                                    <button
                                                        key={mode.value}
                                                        type="button"
                                                        onClick={() => setPaymentMode(mode.value as 'cash' | 'upi' | 'card')}
                                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMode === mode.value
                                                            ? 'border-gold bg-gold/10'
                                                            : 'border-beige-200 dark:border-velvet-gray'
                                                            }`}
                                                    >
                                                        <Icon className={`w-6 h-6 ${paymentMode === mode.value ? 'text-gold' : 'text-[var(--muted)]'}`} />
                                                        <span className="text-sm font-medium">{mode.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowCompleteModal(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleComplete}
                                        disabled={!finalAmount || completing}
                                        className="flex-1 btn-primary"
                                    >
                                        {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Walk-In Booking Modal */}
                <AnimatePresence>
                    {showWalkInModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                            onClick={() => setShowWalkInModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-velvet-dark rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Walk-In Booking</h2>
                                    <button onClick={() => setShowWalkInModal(false)} className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Customer Details */}
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Customer Name *"
                                            value={walkInName}
                                            onChange={(e) => setWalkInName(e.target.value)}
                                            className="input-field"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number *"
                                            value={walkInPhone}
                                            onChange={(e) => setWalkInPhone(e.target.value)}
                                            className="input-field"
                                        />
                                    </div>

                                    {/* Service Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Select Services *</label>
                                        <div className="max-h-48 overflow-auto space-y-2 border border-beige-200 dark:border-velvet-gray rounded-xl p-2">
                                            {allServices.map((service) => {
                                                const isSelected = walkInServices.some(s => s.id === service.id);
                                                return (
                                                    <div
                                                        key={service.id}
                                                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${isSelected ? 'bg-gold/10 border border-gold' : 'bg-beige-50 dark:bg-velvet-black/50'}`}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-sm">{service.name}</p>
                                                            <p className="text-xs text-[var(--muted)]">{formatDuration(service.duration_minutes)} • {formatPrice(service.price)}</p>
                                                        </div>
                                                        {isSelected ? (
                                                            <button
                                                                onClick={() => removeWalkInService(service.id)}
                                                                className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => addWalkInService(service)}
                                                                className="p-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold/20"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Staff Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Assign Staff (optional)</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            <button
                                                onClick={() => setWalkInStaff(null)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[70px] transition-all ${!walkInStaff ? 'bg-gold/10 border-2 border-gold' : 'bg-beige-50 dark:bg-velvet-black/50 border border-transparent'}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-beige-200 dark:bg-velvet-gray flex items-center justify-center text-sm">🎲</div>
                                                <span className="text-[10px] font-medium">Any</span>
                                            </button>
                                            {allStaff.map((staff) => (
                                                <button
                                                    key={staff.id}
                                                    onClick={() => setWalkInStaff(staff)}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[70px] transition-all ${walkInStaff?.id === staff.id ? 'bg-gold/10 border-2 border-gold' : 'bg-beige-50 dark:bg-velvet-black/50 border border-transparent'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-beige-200 dark:bg-velvet-gray flex items-center justify-center text-sm">👤</div>
                                                    <span className="text-[10px] font-medium text-center">{staff.name.split(' ')[0]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {walkInServices.length > 0 && (
                                        <div className="p-3 bg-gold/10 rounded-xl border border-gold/30">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Services ({walkInServices.length})</span>
                                                <span className="font-semibold">{formatDuration(walkInDuration)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Total</span>
                                                <span className="text-gold">{formatPrice(walkInTotal)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowWalkInModal(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleWalkInSubmit}
                                        disabled={!walkInName || !walkInPhone || walkInServices.length === 0 || creatingWalkIn}
                                        className="flex-1 btn-primary"
                                    >
                                        {creatingWalkIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Booking'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Service Modal */}
                <AnimatePresence>
                    {showAddServiceModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddServiceModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-velvet-dark rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Add Service</h2>
                                    <button
                                        onClick={() => setShowAddServiceModal(false)}
                                        className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        value={addServiceSearch}
                                        onChange={(e) => setAddServiceSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-beige-50 dark:bg-velvet-black/50 border border-beige-200 dark:border-velvet-gray rounded-xl focus:outline-none focus:border-gold transition-colors text-sm"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {allServices
                                        .filter(s => s.name.toLowerCase().includes(addServiceSearch.toLowerCase()) || s.category.toLowerCase().includes(addServiceSearch.toLowerCase()))
                                        .map((service) => (
                                            <button
                                                key={service.id}
                                                onClick={() => handleAddService(service.id)}
                                                disabled={addingService}
                                                className="w-full flex items-center justify-between p-3 rounded-xl border border-beige-100 dark:border-velvet-gray/30 hover:border-gold hover:bg-gold/5 transition-all text-left group"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-gold transition-colors">{service.name}</p>
                                                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{service.category} • {service.duration_minutes} mins</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gold">{formatPrice(service.price)}</p>
                                                    {addingService ? (
                                                        <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                                                    ) : (
                                                        <Plus className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-all" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-beige-100 dark:border-velvet-gray/30">
                                    <button
                                        onClick={() => setShowAddServiceModal(false)}
                                        className="w-full py-2.5 bg-beige-100 dark:bg-velvet-gray rounded-xl font-bold text-sm hover:bg-beige-200 dark:hover:bg-velvet-gray/70 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Receipt Modal */}
                <AnimatePresence>
                    {showReceiptModal && currentBill && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                            onClick={() => setShowReceiptModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md max-h-[90vh] overflow-auto bg-white dark:bg-velvet-dark rounded-2xl shadow-2xl"
                            >
                                {/* Header */}
                                <div className="sticky top-0 bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-gold" />
                                        <h3 className="font-display text-lg font-semibold">Receipt Generated</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowReceiptModal(false)}
                                        className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Receipt Preview */}
                                <div className="border-b border-beige-200 dark:border-velvet-gray">
                                    <BillReceipt ref={receiptRef} bill={currentBill} />
                                </div>

                                {/* Action Buttons */}
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                const printWindow = window.open('', '_blank');
                                                if (printWindow && receiptRef.current) {
                                                    printWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>Receipt - ${currentBill.bill_number}</title>
                                                                <style>
                                                                    body { font-family: monospace; margin: 0; padding: 10px; }
                                                                    * { box-sizing: border-box; }
                                                                </style>
                                                            </head>
                                                            <body>${receiptRef.current.innerHTML}</body>
                                                        </html>
                                                    `);
                                                    printWindow.document.close();
                                                    printWindow.print();
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Simple text-based download
                                                const content = `
VELVET FAMILY SALON
Premium Grooming & Styling
================================
Bill No: ${currentBill.bill_number}
Date: ${new Date(currentBill.bill_date).toLocaleDateString('en-IN')} ${currentBill.bill_time.slice(0, 5)}

Customer: ${currentBill.customer_name}
${currentBill.customer_phone ? `Phone: ${currentBill.customer_phone}` : ''}
${currentBill.staff_name ? `Stylist: ${currentBill.staff_name}` : ''}

SERVICES
--------------------------------
${currentBill.services.map(s => `${s.name}: ${formatPrice(s.price)}`).join('\n')}

--------------------------------
Subtotal: ${formatPrice(currentBill.subtotal)}
${currentBill.discount_percent > 0 ? `Discount (${currentBill.discount_percent}%): -${formatPrice(currentBill.discount_amount)}` : ''}
TOTAL: ${formatPrice(currentBill.final_amount)}
Payment: ${currentBill.payment_mode?.toUpperCase() || 'CASH'}

================================
Thank you for visiting!
We hope to see you again soon ✨
                                                `;
                                                const blob = new Blob([content], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Receipt-${currentBill.bill_number}.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                                showToast('success', 'Receipt downloaded!');
                                            }}
                                            className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={getWhatsAppLink(currentBill.customer_phone || '', generateWhatsAppReceipt(currentBill))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>
                                        <a
                                            href={`mailto:${currentBill.customer_email || ''}?subject=${encodeURIComponent(generateEmailSubject(currentBill))}&body=${encodeURIComponent(generateEmailBody(currentBill))}`}
                                            className="flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => setShowReceiptModal(false)}
                                        className="w-full py-3 border border-beige-300 dark:border-velvet-gray rounded-xl font-medium hover:bg-beige-50 dark:hover:bg-velvet-gray transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cancellation Reason Modal */}
                <AnimatePresence>
                    {showReasonModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => {
                                setShowReasonModal(false);
                                setCancellationReason('');
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-velvet-dark rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            >
                                <h3 className="text-xl font-bold mb-4">Service Not Completed</h3>
                                <p className="text-sm text-[var(--muted)] mb-4">
                                    Please provide a reason why this service wasn't completed:
                                </p>
                                <textarea
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="e.g., Customer declined, Time constraint, etc."
                                    className="w-full px-4 py-3 border border-beige-300 dark:border-velvet-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-gold bg-white dark:bg-velvet-black resize-none"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowReasonModal(false);
                                            setCancellationReason('');
                                        }}
                                        className="flex-1 py-2.5 border border-beige-300 dark:border-velvet-gray rounded-xl font-medium hover:bg-beige-50 dark:hover:bg-velvet-gray transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitReason}
                                        disabled={!cancellationReason.trim()}
                                        className="flex-1 py-2.5 bg-gold text-velvet-black rounded-xl font-medium hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                    <div className="flex items-center justify-around h-16 px-2">
                        {navItems.slice(0, 4).map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-0.5 px-4 py-2 ${item.active ? 'text-gold' : 'text-[var(--muted)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div >
        </AuthGuard >
    );
}
