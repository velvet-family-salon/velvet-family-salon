'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, User, Calendar, Clock, ChevronRight, X, Loader2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getServices, getStaff, getBookedSlots, createAppointment } from '@/lib/db';
import { Service, Staff, BookingState } from '@/lib/types';
import { formatPrice, formatDuration, formatTime, getNextNDays, generateTimeSlots, SALON_CONFIG, getWhatsAppLink } from '@/lib/utils';

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = ['Services', 'Time', 'Confirm'];

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${index + 1 < currentStep
                        ? 'bg-velvet-rose text-velvet-black'
                        : index + 1 === currentStep
                            ? 'bg-velvet-rose/20 text-velvet-rose border-2 border-velvet-rose'
                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)]'
                        }`}>
                        {index + 1 < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-1 ${index + 1 < currentStep ? 'bg-velvet-rose' : 'bg-[var(--card-border)]'
                            }`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function BookingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const preselectedServiceId = searchParams.get('service');

    const [allServices, setAllServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const [booking, setBooking] = useState<BookingState>({
        step: 1,
        services: [],
        staff: null,
        date: null,
        time: null,
        userName: '',
        userPhone: '',
        userEmail: '',
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Load services and staff from Supabase
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [servicesData, staffData] = await Promise.all([
                getServices(),
                getStaff(),
            ]);
            setAllServices(servicesData);
            setStaff(staffData);
            setLoading(false);
        }
        loadData();
    }, []);

    // Pre-select service if passed in URL
    useEffect(() => {
        if (preselectedServiceId && allServices.length > 0 && booking.services.length === 0) {
            const service = allServices.find(s => s.id === preselectedServiceId);
            if (service) {
                setBooking(prev => ({ ...prev, services: [service] }));
            }
        }
    }, [preselectedServiceId, allServices, booking.services.length]);

    // Calculate totals
    const totalDuration = booking.services.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalPrice = booking.services.reduce((sum, s) => sum + s.price, 0);

    // Fetch booked slots when date/staff changes
    useEffect(() => {
        async function loadBookedSlots() {
            if (booking.date) {
                // Pass staff id or null (for "Any" stylist)
                const slots = await getBookedSlots(booking.staff?.id || null, booking.date);
                setBookedSlots(slots);
            } else {
                setBookedSlots([]);
            }
        }
        loadBookedSlots();
    }, [booking.date, booking.staff]);

    const days = getNextNDays(14);
    const timeSlots = booking.date ? generateTimeSlots(
        SALON_CONFIG.openingHours.start,
        SALON_CONFIG.openingHours.end,
        totalDuration || 30,
        bookedSlots
    ) : [];

    const handleAddService = (service: Service) => {
        if (!booking.services.find(s => s.id === service.id)) {
            setBooking(prev => ({ ...prev, services: [...prev.services, service] }));
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setBooking(prev => ({
            ...prev,
            services: prev.services.filter(s => s.id !== serviceId)
        }));
    };

    const handleContinueToStep2 = () => {
        if (booking.services.length > 0) {
            setBooking(prev => ({ ...prev, step: 2 }));
        }
    };

    const handleStaffSelect = (selectedStaff: Staff | null) => {
        setBooking(prev => ({ ...prev, staff: selectedStaff }));
    };

    const handleDateSelect = (date: string) => {
        setBooking(prev => ({ ...prev, date, time: null }));
    };

    const handleTimeSelect = (time: string) => {
        setBooking(prev => ({ ...prev, time, step: 3 }));
    };

    const handleBack = () => {
        if (booking.step > 1) {
            setBooking(prev => ({ ...prev, step: (prev.step - 1) as 1 | 2 | 3 }));
        }
    };

    const handleConfirmBooking = async () => {
        if (!booking.services.length || !booking.date || !booking.time || !booking.userName || !booking.userPhone) {
            return;
        }

        setSubmitting(true);

        // Calculate end time based on total duration
        const [hours, minutes] = booking.time.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        const result = await createAppointment({
            service_ids: booking.services.map(s => s.id),
            staff_id: booking.staff?.id,
            appointment_date: booking.date,
            start_time: booking.time,
            end_time: endTime,
            user_name: booking.userName,
            user_phone: booking.userPhone,
            user_email: booking.userEmail || undefined,
        });

        setSubmitting(false);

        if (result.success) {
            setShowConfirmation(true);
        } else {
            alert('Failed to book appointment. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-velvet-rose animate-spin" />
            </div>
        );
    }

    if (showConfirmation) {
        const servicesText = booking.services.map(s => s.name).join(', ');
        return (
            <div className="min-h-screen flex flex-col">
                <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                        <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </Link>
                        <h1 className="font-display text-xl font-semibold">Booking Confirmed!</h1>
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center overflow-y-auto px-6 pt-12 pb-24">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
                    >
                        <Check className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="font-display text-2xl font-bold text-center mb-2"
                    >
                        You&apos;re All Set!
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-[var(--muted)] text-center mb-6"
                    >
                        Your appointment has been booked successfully
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card p-4 w-full max-w-sm mb-6"
                    >
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Services</span>
                                <span className="font-medium text-right max-w-[60%]">
                                    {booking.services.length} service{booking.services.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            {booking.services.map(service => (
                                <div key={service.id} className="flex justify-between pl-4 text-xs">
                                    <span className="text-[var(--muted)]">{service.name}</span>
                                    <span>{formatPrice(service.price)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Date</span>
                                <span className="font-medium">{booking.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Time</span>
                                <span className="font-medium">{booking.time && formatTime(booking.time)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--muted)]">Duration</span>
                                <span className="font-medium">{formatDuration(totalDuration)}</span>
                            </div>
                            {booking.staff && (
                                <div className="flex justify-between">
                                    <span className="text-[var(--muted)]">Stylist</span>
                                    <span className="font-medium">{booking.staff.name}</span>
                                </div>
                            )}
                            <div className="border-t border-[var(--card-border)] pt-3 flex justify-between">
                                <span className="text-[var(--muted)]">Estimated Total</span>
                                <span className="font-bold text-velvet-rose">{formatPrice(totalPrice)}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col gap-3 w-full max-w-sm"
                    >
                        <a
                            href={getWhatsAppLink(
                                SALON_CONFIG.whatsapp,
                                `Hi! I just booked an appointment for ${servicesText} on ${booking.date} at ${booking.time && formatTime(booking.time)}. Looking forward to it!`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                        >
                            Confirm via WhatsApp
                        </a>
                        <Link href="/" className="btn-secondary text-center">
                            Back to Home
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    {booking.step > 1 ? (
                        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <h1 className="font-display text-xl font-semibold">Book Appointment</h1>
                </div>
                <StepIndicator currentStep={booking.step} />
            </header>

            <div className="max-w-lg mx-auto px-4 pb-32">
                <AnimatePresence mode="wait">
                    {/* Step 1: Select Services */}
                    {booking.step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="py-4"
                        >
                            <h2 className="text-lg font-semibold mb-4">Select Services</h2>
                            <p className="text-sm text-[var(--muted)] mb-4">
                                Add one or more services to your appointment
                            </p>
                            <div className="space-y-3">
                                {allServices.map((service) => {
                                    const isSelected = booking.services.some(s => s.id === service.id);
                                    return (
                                        <motion.div
                                            key={service.id}
                                            className={`card p-4 flex items-center gap-4 transition-all ${isSelected ? 'ring-2 ring-velvet-rose bg-velvet-rose/5' : ''}`}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--card-border)] relative">
                                                {service.image_url ? (
                                                    <>
                                                        <img
                                                            src={service.image_url}
                                                            alt={service.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                                                            <span className="text-xl">✂️</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xl">✂️</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{service.name}</h3>
                                                <p className="text-sm text-[var(--muted)]">
                                                    {formatDuration(service.duration_minutes)} • {formatPrice(service.price)}
                                                </p>
                                            </div>
                                            {isSelected ? (
                                                <button
                                                    onClick={() => handleRemoveService(service.id)}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddService(service)}
                                                    className="p-2 bg-velvet-rose/10 text-velvet-rose rounded-xl hover:bg-velvet-rose/20 transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Select Staff, Date & Time */}
                    {booking.step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="py-4 space-y-6"
                        >
                            {/* Selected Services Summary */}
                            <div className="card p-3 bg-velvet-rose/5 border-velvet-rose/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShoppingBag className="w-5 h-5 text-velvet-rose" />
                                    <span className="font-semibold text-sm">Your Services ({booking.services.length})</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    {booking.services.map(s => (
                                        <div key={s.id} className="flex justify-between text-[var(--muted)]">
                                            <span>{s.name}</span>
                                            <span>{formatPrice(s.price)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t border-velvet-rose/20 font-medium">
                                        <span>Total: {formatDuration(totalDuration)}</span>
                                        <span className="text-velvet-rose">{formatPrice(totalPrice)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Selection */}
                            <div>
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-velvet-rose" />
                                    Choose Stylist <span className="text-sm font-normal text-[var(--muted)]">(optional)</span>
                                </h2>
                                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                                    <button
                                        onClick={() => handleStaffSelect(null)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] transition-all ${!booking.staff
                                            ? 'bg-velvet-rose/10 border-2 border-velvet-rose'
                                            : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-beige-200 to-beige-300 dark:from-velvet-dark dark:to-velvet-gray flex items-center justify-center">
                                            <span className="text-lg">🎲</span>
                                        </div>
                                        <span className="text-xs font-medium">Any</span>
                                    </button>
                                    {staff.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleStaffSelect(member)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] transition-all ${booking.staff?.id === member.id
                                                ? 'bg-velvet-rose/10 border-2 border-velvet-rose'
                                                : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-beige-200 to-beige-300 dark:from-velvet-dark dark:to-velvet-gray flex items-center justify-center">
                                                <span className="text-lg">👤</span>
                                            </div>
                                            <span className="text-xs font-medium text-center leading-tight">{member.name.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div>
                                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-velvet-rose" />
                                    Select Date
                                </h2>
                                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                                    {days.map((day) => (
                                        <button
                                            key={day.date}
                                            onClick={() => handleDateSelect(day.date)}
                                            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl min-w-[60px] transition-all ${booking.date === day.date
                                                ? 'bg-velvet-rose text-velvet-black'
                                                : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                                }`}
                                        >
                                            <span className={`text-xs ${booking.date === day.date ? 'text-velvet-black/70' : 'text-[var(--muted)]'}`}>
                                                {day.dayName}
                                            </span>
                                            <span className="text-lg font-bold">{day.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Selection */}
                            {booking.date && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-velvet-rose" />
                                        Select Time
                                    </h2>
                                    <div className="grid grid-cols-4 gap-2">
                                        {timeSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                onClick={() => slot.available && handleTimeSelect(slot.time)}
                                                disabled={!slot.available}
                                                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${booking.time === slot.time
                                                    ? 'bg-velvet-rose text-velvet-black'
                                                    : slot.available
                                                        ? 'bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-velvet-rose/50'
                                                        : 'bg-[var(--card-bg)] text-[var(--muted)] opacity-50 cursor-not-allowed line-through'
                                                    }`}
                                            >
                                                {formatTime(slot.time)}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 3: Confirm Details */}
                    {booking.step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="py-4 space-y-6"
                        >
                            <h2 className="text-lg font-semibold">Confirm Your Booking</h2>

                            {/* Booking Summary */}
                            <div className="card p-4 space-y-4">
                                {/* Services List */}
                                <div>
                                    <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Services</h4>
                                    {booking.services.map(service => (
                                        <div key={service.id} className="flex items-center gap-3 py-2">
                                            <div className="w-10 h-10 bg-velvet-rose/10 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">✂️</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{service.name}</p>
                                                <p className="text-xs text-[var(--muted)]">{formatDuration(service.duration_minutes)}</p>
                                            </div>
                                            <span className="font-medium text-sm">{formatPrice(service.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[var(--card-border)] pt-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-velvet-rose" />
                                        <span>{booking.date}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-velvet-rose" />
                                        <span>{booking.time && formatTime(booking.time)} ({formatDuration(totalDuration)})</span>
                                    </div>
                                    {booking.staff && (
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-velvet-rose" />
                                            <span>{booking.staff.name}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-[var(--card-border)] pt-4 flex justify-between items-center">
                                    <span className="text-[var(--muted)]">Estimated Total</span>
                                    <span className="text-2xl font-bold text-velvet-rose">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3">
                                <h3 className="font-semibold">Your Details</h3>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={booking.userName}
                                    onChange={(e) => setBooking(prev => ({ ...prev, userName: e.target.value }))}
                                    className="input-field"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={booking.userPhone}
                                    onChange={(e) => setBooking(prev => ({ ...prev, userPhone: e.target.value }))}
                                    className="input-field"
                                />
                                <input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={booking.userEmail}
                                    onChange={(e) => setBooking(prev => ({ ...prev, userEmail: e.target.value }))}
                                    className="input-field"
                                />
                            </div>

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirmBooking}
                                disabled={!booking.userName || !booking.userPhone || submitting}
                                className="btn-primary w-full"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>

                            <p className="text-xs text-center text-[var(--muted)]">
                                By booking, you agree to our cancellation policy. Payment is collected at the salon.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sticky Bottom Bar for Step 1 */}
            {booking.step === 1 && booking.services.length > 0 && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-velvet-dark border-t border-[var(--card-border)] p-4 shadow-lg"
                >
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="font-semibold">{booking.services.length} service{booking.services.length > 1 ? 's' : ''} selected</p>
                                <p className="text-sm text-[var(--muted)]">{formatDuration(totalDuration)} • {formatPrice(totalPrice)}</p>
                            </div>
                        </div>
                        <button onClick={handleContinueToStep2} className="btn-primary w-full">
                            Continue
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-velvet-rose animate-spin" />
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
