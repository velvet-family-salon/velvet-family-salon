'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Check, X, Loader2, Phone, MessageCircle, Mail,
    IndianRupee, CreditCard, Banknote, Smartphone, Receipt, MessageSquare, Settings,
    CheckSquare, Square, Plus, UserPlus, Minus
} from 'lucide-react';
import { getAppointments, updateAppointmentStatus, completeAppointment, getAppointmentServices, updateServiceCompletion, createAppointment, getServices, getStaff } from '@/lib/db';
import { Appointment, AppointmentStatus, AppointmentService, Service, Staff } from '@/lib/types';
import { formatPrice, formatTime, formatDate, getWhatsAppLink, getCallLink, formatDuration } from '@/lib/utils';

// Extended appointment with services
interface AppointmentWithServices extends Appointment {
    allServices?: AppointmentService[];
}

export default function AdminBookingsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<AppointmentWithServices[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
    const [filterDate, setFilterDate] = useState('');

    // Complete modal state
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithServices | null>(null);
    const [finalAmount, setFinalAmount] = useState('');
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

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isLoggedIn) {
            router.push('/admin');
            return;
        }

        loadAppointments();
    }, [router]);

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

    const filteredAppointments = appointments.filter((apt) => {
        const matchesSearch =
            apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.allServices?.some(s => s.service?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            apt.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.user?.phone?.includes(searchQuery) || false;
        const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
        const matchesDate = !filterDate || apt.appointment_date === filterDate;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleStatusChange = async (id: string, status: AppointmentStatus) => {
        const success = await updateAppointmentStatus(id, status);
        if (success) {
            setAppointments(appointments.map(apt =>
                apt.id === id ? { ...apt, status } : apt
            ));
        }
    };

    const handleServiceToggle = async (appointmentId: string, serviceId: string, currentStatus: boolean) => {
        const success = await updateServiceCompletion(serviceId, !currentStatus);
        if (success) {
            setAppointments(appointments.map(apt => {
                if (apt.id === appointmentId && apt.allServices) {
                    return {
                        ...apt,
                        allServices: apt.allServices.map(s =>
                            s.id === serviceId ? { ...s, is_completed: !currentStatus } : s
                        )
                    };
                }
                return apt;
            }));
        }
    };

    const openCompleteModal = (apt: AppointmentWithServices) => {
        setSelectedAppointment(apt);
        // Calculate total from all services (or just completed ones)
        const total = apt.allServices?.reduce((sum, s) => sum + (s.service?.price || 0), 0) || apt.service?.price || 0;
        setFinalAmount(total.toString());
        setPaymentMode('cash');
        setShowCompleteModal(true);
    };

    const handleComplete = async () => {
        if (!selectedAppointment || !finalAmount) return;

        setCompleting(true);
        const success = await completeAppointment(
            selectedAppointment.id,
            parseFloat(finalAmount),
            paymentMode
        );
        setCompleting(false);

        if (success) {
            setAppointments(appointments.map(apt =>
                apt.id === selectedAppointment.id
                    ? { ...apt, status: 'completed', final_amount: parseFloat(finalAmount), payment_mode: paymentMode }
                    : apt
            ));
            setShowCompleteModal(false);
            setSelectedAppointment(null);
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
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        );
    }

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
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Calculate end time based on total duration
        const totalDuration = walkInServices.reduce((sum, s) => sum + s.duration_minutes, 0);
        const endMinutes = now.getHours() * 60 + now.getMinutes() + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        const result = await createAppointment({
            service_ids: walkInServices.map(s => s.id),
            staff_id: walkInStaff?.id,
            appointment_date: today,
            start_time: currentTime,
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
        <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="font-display text-xl font-semibold">Manage Bookings</h1>
                    </div>
                    <button
                        onClick={openWalkInModal}
                        className="flex items-center gap-2 px-4 py-2 bg-gold text-velvet-black rounded-xl font-medium hover:bg-gold-dark transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Walk-In
                    </button>
                </div>
            </header>

            <div className="flex max-w-6xl mx-auto">
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
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="input-field w-auto"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
                            className="input-field w-auto"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total', count: filteredAppointments.length, color: 'bg-gray-500/10 text-gray-600' },
                            { label: 'Pending', count: filteredAppointments.filter(a => a.status === 'pending').length, color: 'bg-yellow-500/10 text-yellow-600' },
                            { label: 'Confirmed', count: filteredAppointments.filter(a => a.status === 'confirmed').length, color: 'bg-green-500/10 text-green-600' },
                            { label: 'Completed', count: filteredAppointments.filter(a => a.status === 'completed').length, color: 'bg-blue-500/10 text-blue-600' },
                        ].map((stat) => (
                            <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
                                <p className="text-2xl font-bold">{stat.count}</p>
                                <p className="text-xs">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bookings List */}
                    <div className="space-y-4">
                        {filteredAppointments.map((apt, index) => {
                            // Detect walk-in: created same time as start_time (within 5 min)
                            const createdAt = new Date(apt.created_at);
                            const [startH, startM] = apt.start_time.split(':').map(Number);
                            const appointmentStart = new Date(apt.appointment_date);
                            appointmentStart.setHours(startH, startM, 0, 0);
                            const isWalkIn = Math.abs(createdAt.getTime() - appointmentStart.getTime()) < 5 * 60 * 1000;

                            return (
                                <motion.div
                                    key={apt.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4"
                                >
                                    {/* Client Info Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{apt.user?.name || 'Guest'}</h3>
                                                {isWalkIn && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded font-medium">Walk-In</span>}
                                            </div>
                                            <p className="text-sm text-[var(--muted)]">{apt.user?.phone || 'No phone'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                                            apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                                                apt.status === 'completed' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-red-500/10 text-red-600'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </div>

                                    {/* Services List */}
                                    <div className="mb-4 p-3 bg-beige-50 dark:bg-velvet-black/50 rounded-xl space-y-2">
                                        <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
                                            <span>{formatDate(apt.appointment_date)} at {formatTime(apt.start_time)}</span>
                                            {apt.staff && <span>{apt.staff.name}</span>}
                                        </div>

                                        {/* Show all services or fallback to primary service */}
                                        {apt.allServices && apt.allServices.length > 0 ? (
                                            apt.allServices.map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-3 py-2 border-t border-beige-200 dark:border-velvet-gray first:border-0 first:pt-0">
                                                    <button
                                                        onClick={() => handleServiceToggle(apt.id, svc.id, svc.is_completed)}
                                                        className={`flex-shrink-0 p-1 rounded ${svc.is_completed ? 'text-green-600' : 'text-[var(--muted)]'}`}
                                                        disabled={apt.status === 'completed'}
                                                    >
                                                        {svc.is_completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className={`font-medium ${svc.is_completed ? 'line-through text-[var(--muted)]' : ''}`}>
                                                            {svc.service?.name}
                                                        </p>
                                                    </div>
                                                    <span className="font-semibold text-gold">
                                                        {formatPrice(svc.service?.price || 0)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                                                    <span className="text-lg">✂️</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{apt.service?.name}</p>
                                                </div>
                                                <span className="font-bold text-gold">
                                                    {formatPrice(apt.final_amount || apt.service?.price || 0)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Total */}
                                        {apt.allServices && apt.allServices.length > 1 && (
                                            <div className="flex justify-between pt-2 mt-2 border-t border-beige-200 dark:border-velvet-gray font-semibold">
                                                <span>Total ({apt.allServices.length} services)</span>
                                                <span className="text-gold">
                                                    {formatPrice(apt.final_amount || apt.allServices.reduce((sum, s) => sum + (s.service?.price || 0), 0))}
                                                </span>
                                            </div>
                                        )}

                                        {apt.payment_mode && (
                                            <p className="text-xs text-[var(--muted)] capitalize pt-1">Paid via {apt.payment_mode}</p>
                                        )}
                                    </div>

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
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                        {apt.status === 'confirmed' && (
                                            <button
                                                onClick={() => openCompleteModal(apt)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gold text-velvet-black rounded-lg hover:bg-gold-dark transition-colors text-sm font-medium"
                                            >
                                                <Check className="w-4 h-4" />
                                                Mark as Completed
                                            </button>
                                        )}
                                        {apt.status === 'completed' && (
                                            <a
                                                href={getWhatsAppLink(apt.user?.phone || '', getReceiptMessage(apt))}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
                                            >
                                                <Receipt className="w-4 h-4" />
                                                Send Receipt on WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredAppointments.length === 0 && (
                            <div className="text-center py-12 text-[var(--muted)]">
                                No bookings found
                            </div>
                        )}
                    </div>
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
                                            <div key={s.id} className="flex justify-between text-sm">
                                                <span className={s.is_completed ? '' : 'text-[var(--muted)]'}>
                                                    {s.is_completed ? '✓' : '○'} {s.service?.name}
                                                </span>
                                                <span>{formatPrice(s.service?.price || 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="font-medium">{selectedAppointment.service?.name}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Final Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                                        <input
                                            type="number"
                                            value={finalAmount}
                                            onChange={(e) => setFinalAmount(e.target.value)}
                                            className="input-field pl-10"
                                            placeholder="Enter final amount"
                                        />
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
        </div>
    );
}
