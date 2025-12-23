'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { mockAppointments, mockServices, mockStaff } from '@/lib/mockData';
import { formatPrice, formatTime, formatDate } from '@/lib/utils';
import { AppointmentStatus } from '@/lib/types';

const statusColors: Record<AppointmentStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400',
    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function HistoryPage() {
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    // Enrich appointments with service and staff data
    const enrichedAppointments = mockAppointments.map(apt => ({
        ...apt,
        service: mockServices.find(s => s.id === apt.service_id),
        staff: mockStaff.find(s => s.id === apt.staff_id),
    }));

    // Filter by upcoming vs past
    const today = new Date().toISOString().split('T')[0];
    const filteredAppointments = enrichedAppointments.filter(apt => {
        const isUpcoming = apt.appointment_date >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
        return filter === 'upcoming' ? isUpcoming : !isUpcoming;
    });

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">My Bookings</h1>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="px-4 py-4 max-w-lg mx-auto">
                <div className="flex gap-2 p-1 bg-[var(--card-bg)] rounded-xl">
                    {(['upcoming', 'past'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${filter === tab
                                    ? 'bg-velvet-rose text-velvet-black'
                                    : 'text-[var(--muted)]'
                                }`}
                        >
                            {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Appointments List */}
            <div className="px-4 max-w-lg mx-auto pb-24 space-y-3">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt, index) => (
                        <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card p-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl flex items-center justify-center">
                                    <span className="text-2xl">✂️</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-semibold line-clamp-1">{apt.service?.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[apt.status]}`}>
                                            {apt.status}
                                        </span>
                                    </div>

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

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
                                        <span className="font-semibold text-velvet-rose">
                                            {formatPrice(apt.service?.price || 0)}
                                        </span>
                                        {apt.status === 'pending' && (
                                            <button className="text-sm text-[var(--muted)] hover:text-red-500 transition-colors">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--card-bg)] flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-[var(--muted)]" />
                        </div>
                        <h3 className="font-semibold mb-1">No {filter} bookings</h3>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            {filter === 'upcoming'
                                ? "You don't have any upcoming appointments"
                                : "You haven't completed any appointments yet"}
                        </p>
                        {filter === 'upcoming' && (
                            <Link href="/book" className="btn-primary inline-flex">
                                Book Now
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
