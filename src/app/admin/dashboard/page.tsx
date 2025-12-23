'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, LogOut,
    TrendingUp, Clock, IndianRupee, ChevronRight, AlertCircle, Loader2, MessageSquare, Settings
} from 'lucide-react';
import { getAppointmentsByDate, getAllServices, getAllStaff, getAppointmentServices } from '@/lib/db';
import { Appointment, Service, Staff, AppointmentService } from '@/lib/types';
import { formatPrice, formatTime } from '@/lib/utils';

// Extended appointment with services
interface AppointmentWithServices extends Appointment {
    allServices?: AppointmentService[];
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [todayAppointments, setTodayAppointments] = useState<AppointmentWithServices[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isLoggedIn) {
            router.push('/admin');
            return;
        }

        async function loadData() {
            const today = new Date().toISOString().split('T')[0];
            const [appointments, servicesData, staffData] = await Promise.all([
                getAppointmentsByDate(today),
                getAllServices(),
                getAllStaff(),
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
            setLoading(false);
        }
        loadData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        router.push('/admin');
    };

    // Calculate stats
    const pendingCount = todayAppointments.filter(a => a.status === 'pending').length;
    const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;

    // Calculate revenue estimate from ALL services
    const todayRevenue = todayAppointments.reduce((sum, apt) => {
        if (apt.allServices && apt.allServices.length > 0) {
            return sum + apt.allServices.reduce((s, svc) => s + (svc.service?.price || 0), 0);
        }
        return sum + (apt.service?.price || 0);
    }, 0);

    const stats = [
        { icon: Calendar, label: "Today's Bookings", value: todayAppointments.length, color: 'text-blue-500 bg-blue-500/10' },
        { icon: Clock, label: 'Pending', value: pendingCount, color: 'text-yellow-500 bg-yellow-500/10' },
        { icon: TrendingUp, label: 'Confirmed', value: confirmedCount, color: 'text-green-500 bg-green-500/10' },
        { icon: IndianRupee, label: 'Est. Revenue', value: formatPrice(todayRevenue), color: 'text-gold bg-gold/10' },
    ];

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', active: true },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
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

    return (
        <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
            {/* Admin Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-velvet-black" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-semibold">Admin Panel</h1>
                            <p className="text-xs text-[var(--muted)]">Velvet Family Salon</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-red-500"
                    >
                        <LogOut className="w-5 h-5" />
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-[var(--muted)]">{stat.label}</p>
                                    </motion.div>
                                );
                            })}
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

                                        // Detect walk-in: created same time as start_time (within 5 min)
                                        const createdAt = new Date(apt.created_at);
                                        const [startH, startM] = apt.start_time.split(':').map(Number);
                                        const appointmentStart = new Date(apt.appointment_date);
                                        appointmentStart.setHours(startH, startM, 0, 0);
                                        const isWalkIn = Math.abs(createdAt.getTime() - appointmentStart.getTime()) < 5 * 60 * 1000;

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
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
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
