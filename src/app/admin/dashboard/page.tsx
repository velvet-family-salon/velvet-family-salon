'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, LogOut,
    TrendingUp, Clock, IndianRupee, ChevronRight, AlertCircle, Loader2, MessageSquare, Settings,
    RefreshCw, UserPlus, Plus, ExternalLink, Shield, CheckCircle, BarChart3
} from 'lucide-react';
import { getAppointmentsByDate, getAllServices, getAllStaff, getAppointmentServices, getTodayRevenue } from '@/lib/db';
import { Appointment, Service, Staff, AppointmentService } from '@/lib/types';
import { formatPrice, formatTime } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

// Extended appointment with services
interface AppointmentWithServices extends Appointment {
    allServices?: AppointmentService[];
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [todayAppointments, setTodayAppointments] = useState<AppointmentWithServices[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [revenueData, setRevenueData] = useState<{ total: number; count: number }>({ total: 0, count: 0 });

    const loadData = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const [appointments, servicesData, staffData, revenue] = await Promise.all([
            getAppointmentsByDate(today),
            getAllServices(),
            getAllStaff(),
            getTodayRevenue(),
        ]);

        // Load services for each appointment
        const appointmentsWithServices = await Promise.all(
            appointments.map(async (apt) => {
                const allServices = await getAppointmentServices(apt.id);
                return { ...apt, allServices };
            })
        );

        setTodayAppointments(appointmentsWithServices);
        setServices(servicesData);
        setStaff(staffData);
        setRevenueData(revenue);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData().then(() => setLoading(false));
    }, [loadData]);

    const { signOut } = useAuth();

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await signOut();
            router.push('/admin');
        }
    };

    // Calculate stats
    const pendingCount = todayAppointments.filter(a => a.status === 'pending').length;
    const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;
    const completedCount = todayAppointments.filter(a => a.status === 'completed').length;

    const stats = [
        { icon: Calendar, label: "Today's Bookings", value: todayAppointments.length, color: 'text-blue-500 bg-blue-500/10' },
        { icon: Clock, label: 'Pending', value: pendingCount, color: 'text-yellow-500 bg-yellow-500/10' },
        { icon: TrendingUp, label: 'Confirmed', value: confirmedCount, color: 'text-green-500 bg-green-500/10' },
        { icon: CheckCircle, label: 'Completed', value: completedCount, color: 'text-purple-500 bg-purple-500/10' },
        { icon: IndianRupee, label: 'Revenue', value: formatPrice(revenueData.total), color: 'text-gold bg-gold/10' },
    ];

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', active: true },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

    if (loading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-beige-50 dark:bg-velvet-black overflow-x-hidden">
                {/* Admin Header */}
                <header className="bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray sticky top-0 z-30">
                    <div className="w-full px-3 sm:px-4 md:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-velvet-rose/20 flex-shrink-0">
                                <Image src="/logo.jpg" alt="Velvet Family Salon" fill className="object-cover" priority />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-display text-sm sm:text-lg font-semibold truncate leading-tight">Admin Panel</h1>
                                <p className="text-[10px] sm:text-xs text-[var(--muted)] truncate">Velvet Family Salon</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-gold"
                            >
                                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-red-500"
                            >
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
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
                    <main className="flex-1 min-w-0 p-3 sm:p-4 pb-24 md:pb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Welcome */}
                            <div>
                                <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
                                <p className="text-[var(--muted)]">Here&apos;s what&apos;s happening today</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                                {stats.map((stat, i) => {
                                    const Icon = stat.icon;
                                    return (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white dark:bg-velvet-dark rounded-2xl p-3 sm:p-4 border border-beige-200 dark:border-velvet-gray min-w-0"
                                        >
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2 sm:mb-3 flex-shrink-0`}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                                            <p className="text-[10px] sm:text-sm text-[var(--muted)] truncate">{stat.label}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4">
                                <h3 className="font-semibold mb-3">Quick Actions</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    <Link
                                        href="/admin/bookings"
                                        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 transition-colors min-w-0"
                                    >
                                        <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="text-xs sm:text-sm font-medium truncate w-full text-center">Walk-In</span>
                                    </Link>
                                    <Link
                                        href="/admin/services"
                                        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors min-w-0"
                                    >
                                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="text-xs sm:text-sm font-medium truncate w-full text-center">Services</span>
                                    </Link>
                                    <Link
                                        href="/admin/staff"
                                        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors min-w-0"
                                    >
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="text-xs sm:text-sm font-medium truncate w-full text-center">Staff</span>
                                    </Link>
                                    <Link
                                        href="/book"
                                        target="_blank"
                                        className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold transition-colors min-w-0"
                                    >
                                        <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="text-xs sm:text-sm font-medium truncate w-full text-center">Book Page</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Today's Appointments */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-beige-200 dark:border-velvet-gray">
                                    <h3 className="font-semibold">Today&apos;s Appointments</h3>
                                    <Link href="/admin/bookings" className="text-gold text-sm font-medium flex items-center gap-1">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {todayAppointments.length > 0 ? (
                                    <div className="divide-y divide-beige-200 dark:divide-velvet-gray">
                                        {todayAppointments.slice(0, 5).map((apt) => {
                                            // Show actual service names
                                            const serviceNames = apt.allServices?.length
                                                ? apt.allServices.map(s => s.service?.name).filter(Boolean).join(', ')
                                                : apt.service?.name || 'Service';
                                            const totalPrice = apt.allServices && apt.allServices.length > 0
                                                ? apt.allServices.reduce((s, svc) => s + (svc.service?.price || 0), 0)
                                                : apt.service?.price || 0;

                                            // Detect walk-in: check if is_walkin flag exists, or fallback to time-based detection
                                            const createdAt = new Date(apt.created_at);
                                            const [startH, startM] = apt.start_time.split(':').map(Number);
                                            const appointmentDate = new Date(apt.appointment_date + 'T00:00:00');
                                            const createdDate = new Date(createdAt.toDateString());
                                            const isSameDay = appointmentDate.getTime() === createdDate.getTime();
                                            const createdTimeMinutes = createdAt.getHours() * 60 + createdAt.getMinutes();
                                            const startTimeMinutes = startH * 60 + startM;
                                            const isWalkIn = (apt as unknown as { is_walkin?: boolean }).is_walkin ||
                                                (isSameDay && Math.abs(createdTimeMinutes - startTimeMinutes) < 3);

                                            return (
                                                <div key={apt.id} className="p-4 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                                                        <span className="text-xl">✂️</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {serviceNames}
                                                            {isWalkIn && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded">Walk-In</span>}
                                                        </p>
                                                        <p className="text-sm text-[var(--muted)]">
                                                            {formatTime(apt.start_time)} • {apt.user?.name || 'Guest'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gold">{formatPrice(totalPrice)}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                                                            apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                                                                apt.status === 'completed' ? 'bg-blue-500/10 text-blue-600' :
                                                                    'bg-gray-500/10 text-gray-600'
                                                            }`}>
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <AlertCircle className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
                                        <p className="text-[var(--muted)]">No appointments for today</p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray">
                                    <h3 className="font-semibold mb-3">Services Overview</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted)]">Total Services</span>
                                            <span className="font-medium">{services.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted)]">Active</span>
                                            <span className="font-medium text-green-600">{services.filter(s => s.is_active).length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray">
                                    <h3 className="font-semibold mb-3">Staff Overview</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted)]">Total Staff</span>
                                            <span className="font-medium">{staff.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted)]">Available Today</span>
                                            <span className="font-medium text-green-600">{staff.filter(s => s.is_active).length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray safe-area-bottom">
                    <div className="flex items-center justify-around h-16 px-1">
                        {navItems.slice(0, 5).map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 w-full h-full ${item.active ? 'text-gold' : 'text-[var(--muted)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium truncate max-w-full text-center px-0.5">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </AuthGuard>
    );
}
