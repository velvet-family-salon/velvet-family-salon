'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, User, ChevronRight, AlertCircle,
    Phone, Search, Sparkles, IndianRupee, Heart, CalendarCheck,
    RefreshCw, X, CreditCard, Wallet, Banknote, Footprints
} from 'lucide-react';
import Link from 'next/link';
import { getAppointmentsByPhone, getUserByPhone, getCustomerStats, CustomerStats } from '@/lib/db';
import { formatPrice, formatTime, formatDate } from '@/lib/utils';
import { Appointment, AppointmentStatus, AppointmentService } from '@/lib/types';

const statusColors: Record<AppointmentStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
};

const paymentIcons: Record<string, React.ReactNode> = {
    cash: <Banknote className="w-3 h-3" />,
    upi: <Wallet className="w-3 h-3" />,
    card: <CreditCard className="w-3 h-3" />,
};

export default function HistoryPage() {
    const [phone, setPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [customerName, setCustomerName] = useState<string | null>(null);
    const [memberSince, setMemberSince] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<(Appointment & { allServices?: AppointmentService[] })[]>([]);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    const handleSearch = async () => {
        if (phone.length !== 10) return;

        setIsSearching(true);
        setHasSearched(true);

        try {
            // Fetch user info
            const user = await getUserByPhone(phone);
            if (user) {
                setCustomerName(user.name);
                setMemberSince(user.created_at);
            } else {
                setCustomerName(null);
                setMemberSince(null);
            }

            // Fetch appointments
            const appointmentsData = await getAppointmentsByPhone(phone);
            setAppointments(appointmentsData);

            // Fetch stats
            const statsData = await getCustomerStats(phone);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClear = () => {
        setPhone('');
        setHasSearched(false);
        setCustomerName(null);
        setMemberSince(null);
        setAppointments([]);
        setStats(null);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
    };

    // Filter appointments
    const today = new Date().toISOString().split('T')[0];
    const upcomingAppointments = appointments.filter(apt =>
        apt.appointment_date >= today && apt.status !== 'cancelled' && apt.status !== 'completed'
    );
    const pastAppointments = appointments.filter(apt =>
        apt.appointment_date < today || apt.status === 'cancelled' || apt.status === 'completed'
    );

    const displayedAppointments = filter === 'upcoming' ? upcomingAppointments : pastAppointments;

    // Group past appointments by month
    const groupedAppointments = displayedAppointments.reduce((groups, apt) => {
        const date = new Date(apt.appointment_date);
        const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(apt);
        return groups;
    }, {} as Record<string, Appointment[]>);

    return (
        <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white dark:from-velvet-black dark:to-velvet-gray">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">My Bookings</h1>
                </div>
            </header>

            <div className="px-4 max-w-lg mx-auto pb-24">
                {/* Phone Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 mb-6"
                >
                    <div className="card p-5 bg-gradient-to-br from-velvet-rose/5 to-transparent">
                        <div className="flex items-center gap-2 mb-3">
                            <Phone className="w-5 h-5 text-velvet-rose" />
                            <h2 className="font-semibold">Find Your Bookings</h2>
                        </div>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            Enter your phone number to view your booking history
                        </p>

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Enter 10 digit number"
                                    className="w-full pl-12 pr-10 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-velvet-rose/50 transition-all"
                                />
                                {phone && (
                                    <button
                                        onClick={handleClear}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={phone.length !== 10 || isSearching}
                                className="px-5 py-3 bg-velvet-rose text-velvet-black font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-velvet-rose/90 transition-all flex items-center gap-2"
                            >
                                {isSearching ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* No search yet */}
                    {!hasSearched && (
                        <motion.div
                            key="no-search"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-velvet-rose/20 to-velvet-rose/5 flex items-center justify-center">
                                <Search className="w-8 h-8 text-velvet-rose" />
                            </div>
                            <h3 className="font-semibold mb-2">Search Your History</h3>
                            <p className="text-sm text-[var(--muted)]">
                                Enter your registered phone number to view<br />
                                your appointments and booking history
                            </p>
                        </motion.div>
                    )}

                    {/* Searching */}
                    {hasSearched && isSearching && (
                        <motion.div
                            key="searching"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-velvet-rose animate-spin" />
                            <p className="text-[var(--muted)]">Finding your bookings...</p>
                        </motion.div>
                    )}

                    {/* Results */}
                    {hasSearched && !isSearching && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Customer Not Found */}
                            {!customerName && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--card-bg)] flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8 text-[var(--muted)]" />
                                    </div>
                                    <h3 className="font-semibold mb-2">No Account Found</h3>
                                    <p className="text-sm text-[var(--muted)] mb-4">
                                        We couldn't find any bookings with this phone number.
                                        <br />Book your first appointment to get started!
                                    </p>
                                    <Link href="/book" className="btn-primary inline-flex items-center gap-2">
                                        Book Now
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}

                            {/* Customer Found */}
                            {customerName && (
                                <>
                                    {/* Welcome Card */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="card p-5 bg-gradient-to-br from-velvet-rose/10 via-transparent to-transparent border-velvet-rose/20"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-[var(--muted)] mb-1">Welcome back,</p>
                                                <h2 className="text-xl font-display font-semibold">{customerName}</h2>
                                                {memberSince && (
                                                    <p className="text-xs text-[var(--muted)] mt-1">
                                                        Member since {new Date(memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-velvet-rose to-velvet-rose/70 flex items-center justify-center text-velvet-black text-xl font-semibold">
                                                {customerName.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Stats Grid */}
                                    {stats && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="card p-4 text-center"
                                            >
                                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <CalendarCheck className="w-5 h-5 text-green-500" />
                                                </div>
                                                <p className="text-2xl font-bold text-green-500">{stats.totalVisits}</p>
                                                <p className="text-xs text-[var(--muted)]">Total Visits</p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                                className="card p-4 text-center"
                                            >
                                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-velvet-rose/10 flex items-center justify-center">
                                                    <IndianRupee className="w-5 h-5 text-velvet-rose" />
                                                </div>
                                                <p className="text-2xl font-bold text-velvet-rose">{formatPrice(stats.totalSpent)}</p>
                                                <p className="text-xs text-[var(--muted)]">Total Spent</p>
                                            </motion.div>

                                            {stats.favouriteService && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="card p-4 text-center"
                                                >
                                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-pink-500/10 flex items-center justify-center">
                                                        <Heart className="w-5 h-5 text-pink-500" />
                                                    </div>
                                                    <p className="text-sm font-semibold line-clamp-1">{stats.favouriteService}</p>
                                                    <p className="text-xs text-[var(--muted)]">Favourite Service</p>
                                                </motion.div>
                                            )}

                                            {stats.lastVisit && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.25 }}
                                                    className="card p-4 text-center"
                                                >
                                                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <Sparkles className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-semibold">{formatDate(stats.lastVisit)}</p>
                                                    <p className="text-xs text-[var(--muted)]">Last Visit</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* Filter Tabs */}
                                    <div className="flex gap-2 p-1 bg-[var(--card-bg)] rounded-xl">
                                        {(['upcoming', 'past'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setFilter(tab)}
                                                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${filter === tab
                                                    ? 'bg-velvet-rose text-velvet-black'
                                                    : 'text-[var(--muted)]'
                                                    }`}
                                            >
                                                {tab === 'upcoming' ? `Upcoming (${upcomingAppointments.length})` : `Past (${pastAppointments.length})`}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Appointments List */}
                                    {displayedAppointments.length > 0 ? (
                                        <div className="space-y-4">
                                            {filter === 'past' ? (
                                                // Grouped by month for past appointments
                                                Object.entries(groupedAppointments).map(([month, apts]) => (
                                                    <div key={month}>
                                                        <h3 className="text-sm font-medium text-[var(--muted)] mb-3 px-1">{month}</h3>
                                                        <div className="space-y-3">
                                                            {apts.map((apt, index) => (
                                                                <AppointmentCard key={apt.id} apt={apt} index={index} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                // Simple list for upcoming
                                                <div className="space-y-3">
                                                    {displayedAppointments.map((apt, index) => (
                                                        <AppointmentCard key={apt.id} apt={apt} index={index} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-8"
                                        >
                                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--card-bg)] flex items-center justify-center">
                                                <AlertCircle className="w-6 h-6 text-[var(--muted)]" />
                                            </div>
                                            <h3 className="font-semibold mb-1">
                                                No {filter} bookings
                                            </h3>
                                            <p className="text-sm text-[var(--muted)] mb-4">
                                                {filter === 'upcoming'
                                                    ? "You don't have any upcoming appointments"
                                                    : "No past appointments to show"}
                                            </p>
                                            {filter === 'upcoming' && (
                                                <Link href="/book" className="btn-primary inline-flex items-center gap-2">
                                                    Book Now
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Quick Book Again CTA */}
                                    {stats && stats.totalVisits > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="card p-4 bg-gradient-to-r from-velvet-rose/10 to-transparent border-velvet-rose/20"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">Ready for another visit?</p>
                                                    <p className="text-sm text-[var(--muted)]">Book your next appointment</p>
                                                </div>
                                                <Link href="/book" className="btn-primary text-sm py-2">
                                                    Book Now
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Appointment Card Component
function AppointmentCard({ apt, index }: { apt: Appointment & { allServices?: AppointmentService[] }; index: number }) {
    // Detect walk-in: created same time as start_time (within 5 min)
    const createdAt = new Date(apt.created_at);
    const [startH, startM] = apt.start_time.split(':').map(Number);
    const appointmentStart = new Date(apt.appointment_date);
    appointmentStart.setHours(startH, startM, 0, 0);
    const isWalkIn = Math.abs(createdAt.getTime() - appointmentStart.getTime()) < 5 * 60 * 1000;

    // Get all services to display
    const services = apt.allServices && apt.allServices.length > 0
        ? apt.allServices
        : [{ service: apt.service, id: apt.service_id }];

    const hasMultipleServices = services.length > 1;

    // Calculate total price
    const totalPrice = apt.final_amount || (
        apt.allServices && apt.allServices.length > 0
            ? apt.allServices.reduce((sum, s) => sum + (s.service?.price || 0), 0)
            : apt.service?.price || 0
    );

    // Get first service image for thumbnail
    const thumbnailImage = services[0]?.service?.image_url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-4 hover:shadow-lg transition-all"
        >
            <div className="flex items-start gap-4">
                {/* Service Image(s) */}
                {hasMultipleServices ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 grid grid-cols-2 gap-0.5 bg-beige-100 dark:bg-velvet-dark">
                        {services.slice(0, 4).map((svc, i) => (
                            svc.service?.image_url ? (
                                <img
                                    key={i}
                                    src={svc.service.image_url}
                                    alt={svc.service.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div key={i} className="w-full h-full bg-beige-200 dark:bg-velvet-gray flex items-center justify-center">
                                    <span className="text-xs">✂️</span>
                                </div>
                            )
                        ))}
                    </div>
                ) : thumbnailImage ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                            src={thumbnailImage}
                            alt={services[0]?.service?.name || 'Service'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">✂️</span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Header with status and walk-in badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold line-clamp-1">
                                {hasMultipleServices
                                    ? `${services.length} Services`
                                    : services[0]?.service?.name || 'Service'
                                }
                            </h3>
                            {isWalkIn && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded font-medium flex items-center gap-0.5 flex-shrink-0">
                                    <Footprints className="w-3 h-3" />
                                    Walk-In
                                </span>
                            )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColors[apt.status]}`}>
                            {apt.status}
                        </span>
                    </div>

                    {/* Multiple Services List */}
                    {hasMultipleServices && (
                        <div className="mb-2 space-y-1">
                            {services.map((svc, i) => (
                                <div key={i} className="text-xs text-[var(--muted)] flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-velvet-rose"></span>
                                    {svc.service?.name}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Date, Time, Staff */}
                    <div className="space-y-1 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(apt.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(apt.start_time)}</span>
                        </div>
                        {apt.staff && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{apt.staff.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer with Price and Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-velvet-rose">
                                {formatPrice(totalPrice)}
                            </span>
                            {apt.payment_mode && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--card-bg)] text-[var(--muted)] flex items-center gap-1 capitalize">
                                    {paymentIcons[apt.payment_mode]}
                                    {apt.payment_mode}
                                </span>
                            )}
                        </div>
                        {apt.status === 'completed' && (
                            <Link
                                href="/book"
                                className="text-sm text-velvet-rose hover:underline flex items-center gap-1"
                            >
                                Book Again
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
