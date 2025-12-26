'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Star, Clock, MapPin, Phone, MessageCircle, ChevronRight, Sparkles, Loader2, ChevronLeft } from 'lucide-react';
import { formatPrice, SALON_CONFIG, getWhatsAppLink, getCallLink } from '@/lib/utils';
import { getServices, getReviewsConfig, getStaff, getMostBookedServices } from '@/lib/db';
import { Service, ReviewsConfig, Staff } from '@/lib/types';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { ComboCard } from '@/components/services/ComboCard';
import { QuickActions } from '@/components/ui/QuickActions';
import { ReviewsSection } from '@/components/ui/ReviewsSection';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { InstallButton, HomePageInstallBanner } from '@/components/ui/PWAInstallPrompt';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

export default function HomePage() {
    const { theme, toggleTheme } = useTheme();
    const [services, setServices] = useState<Service[]>([]);
    const [popularServices, setPopularServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [reviewsConfig, setReviewsConfig] = useState<ReviewsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [offerIndex, setOfferIndex] = useState(0);
    const [staffIndex, setStaffIndex] = useState(0);
    const [taglineIndex, setTaglineIndex] = useState(0);
    const [heroImageIndex, setHeroImageIndex] = useState(0);
    const [showInstallBanner, setShowInstallBanner] = useState(true);

    // Auto-slide offers - Bug #6 Fix: Match filter with visible slides
    useEffect(() => {
        const offersCount = services.filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured).length;
        if (offersCount <= 1) return;
        const interval = setInterval(() => {
            setOfferIndex((prev) => (prev + 1) % offersCount);
        }, 5000);
        return () => clearInterval(interval);
    }, [services]);

    // Hero background images
    const heroImages = [
        '/images/hero/hero-1.png',
        '/images/hero/hero-2.png',
        '/images/hero/hero-3.png',
        '/images/hero/hero-4.png',
        '/images/hero/hero-5.png',
        '/images/hero/hero-6.png',
        '/images/hero/hero-7.png',
        '/images/hero/hero-8.png',
        '/images/hero/hero-9.png',
        '/images/hero/hero-10.png',
        '/images/hero/hero-11.png',
        '/images/hero/hero-12.png',
        '/images/hero/hero-13.png',
        '/images/hero/hero-14.png',
    ];

    // Rotating taglines
    const taglines = [
        "Your family's complete grooming destination. Expert stylists, premium services.",
        "Where beauty meets perfection. Experience the Velvet difference today.",
        "Transform your look with our skilled stylists. Book your appointment now!",
        "Premium styling for the whole family. Men, Women & Kids welcome.",
        "Professional hair coloring & styling by certified experts.",
    ];

    useEffect(() => {
        async function loadData() {

            const [servicesData, popularServicesData, configData, staffData] = await Promise.all([
                getServices(),
                getMostBookedServices(4),
                getReviewsConfig(),
                getStaff(),
            ]);
            setServices(servicesData);

            // If most booked returns empty, fallback to the first 4 active non-combo services
            if (popularServicesData.length === 0) {
                setPopularServices(servicesData.filter(s => !s.is_combo).slice(0, 4));
            } else {
                setPopularServices(popularServicesData);
            }

            setReviewsConfig(configData);
            setStaff(staffData.filter(s => s.is_active));
            setLoading(false);
        }
        loadData();
    }, []);

    // Auto-slide staff
    useEffect(() => {
        if (staff.length <= 1) return;
        const interval = setInterval(() => {
            setStaffIndex((prev) => (prev + 1) % staff.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [staff.length]);

    // Auto-rotate taglines and hero images together
    useEffect(() => {
        const interval = setInterval(() => {
            setTaglineIndex((prev) => (prev + 1) % taglines.length);
            setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [taglines.length, heroImages.length]);

    const currentStaff = staff[staffIndex];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-velvet-rose/20 shadow-md">
                            <Image src="/logo.jpg" alt="Velvet Family Salon" fill sizes="48px" className="object-cover" priority />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-semibold leading-tight">Velvet</h1>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Family Salon</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <InstallButton />
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-beige-100 dark:hover:bg-velvet-dark transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-velvet-rose" />
                            ) : (
                                <Moon className="w-5 h-5 text-velvet-gray" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden min-h-[400px]">
                {/* Background Image Carousel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={heroImageIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={heroImages[heroImageIndex]}
                            alt="Velvet Family Salon"
                            fill
                            className="object-cover"
                            sizes="100vw"
                            quality={75}
                            priority={heroImageIndex === 0}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-[1]" />

                {/* Decorative Blurs */}
                <div className="absolute inset-0 opacity-30 z-[2]">
                    <div className="absolute top-10 right-10 w-32 h-32 bg-velvet-rose/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-velvet-rose/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    className="relative px-6 py-12 max-w-lg mx-auto text-center z-[10]"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-velvet-rose/10 rounded-full text-velvet-rose text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            Premium Grooming Experience
                        </span>
                    </motion.div>

                    <motion.h2
                        variants={fadeInUp}
                        className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight"
                    >
                        Where Style Meets
                        <span className="gradient-text block">Elegance</span>
                    </motion.h2>

                    {/* Rotating Taglines with Animation */}
                    <motion.div variants={fadeInUp} className="h-12 mb-6 max-w-xs mx-auto overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={taglineIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-beige-300 text-sm"
                            >
                                {taglines[taglineIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </motion.div>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/book" className="btn-primary animate-pulse-gold">
                            Book Appointment
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link href="/services" className="btn-secondary text-white border-white/30 hover:bg-white/10 hover:text-white">
                            Explore Services
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={fadeInUp}
                        className="flex items-center justify-center gap-6 mt-8 text-beige-300"
                    >
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-velvet-rose fill-gold" />
                            <span className="text-sm">
                                {reviewsConfig ? `${reviewsConfig.average_rating.toFixed(1)} Rating` : '5.0 Rating'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">9AM - 9PM</span>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Quick Actions */}
            <QuickActions />

            {/* Mega Savings Slideshow */}
            {!loading && services.filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured).length > 0 && (
                <section className="px-4 py-6 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold fill-gold animate-pulse" />
                            Mega Savings
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const offers = services.filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured);
                                    setOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
                                }}
                                className="w-8 h-8 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:bg-beige-100 dark:hover:bg-velvet-gray transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const offers = services.filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured);
                                    setOfferIndex((prev) => (prev + 1) % offers.length);
                                }}
                                className="w-8 h-8 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:bg-beige-100 dark:hover:bg-velvet-gray transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative min-h-[170px]">
                        <AnimatePresence mode="wait">
                            {services
                                .filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured)
                                .filter((_, i) => i === offerIndex)
                                .map((service) => (
                                    <motion.div
                                        key={service.id}
                                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="w-full flex justify-center"
                                    >
                                        <ComboCard service={service} />
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>

                    {/* Dots for Offers */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {services
                            // Bug #6 Fix: Match filter with slides (include is_featured check)
                            .filter(s => (s.is_combo || (s.compare_at_price && s.compare_at_price > s.price)) && s.is_featured)
                            .map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setOfferIndex(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === offerIndex ? 'bg-velvet-rose w-4' : 'bg-[var(--muted)]/30 w-1.5'}`}
                                />
                            ))}
                    </div>
                </section>
            )}

            {/* Featured Services */}
            <section className="px-4 py-6 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl font-semibold">Popular Services</h3>
                    <Link
                        href="/services"
                        className="text-velvet-rose text-sm font-medium flex items-center gap-1 hover:underline"
                    >
                        See all
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-velvet-rose animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 gap-3"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        {popularServices.map((service) => (
                            <motion.div key={service.id} variants={fadeInUp}>
                                <ServiceCard service={service} compact />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>

            {/* Why Choose Us */}
            <section className="px-4 py-6 max-w-lg mx-auto">
                <h3 className="font-display text-xl font-semibold mb-4 text-center">Why Choose Velvet?</h3>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: '✨', title: 'Premium', desc: 'Quality Products' },
                        { icon: '👨‍👩‍👧‍👦', title: 'Family', desc: 'All Ages Welcome' },
                        { icon: '⚡', title: 'Quick', desc: 'Easy Booking' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            className="card p-4 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <span className="text-2xl mb-2 block">{item.icon}</span>
                            <h4 className="font-semibold text-sm">{item.title}</h4>
                            <p className="text-[var(--muted)] text-xs">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Meet Our Stylists */}
            {staff.length > 0 && currentStaff && (
                <section className="px-4 py-6 max-w-lg mx-auto">
                    <h3 className="font-display text-xl font-semibold mb-4 text-center">Meet Our Stylists</h3>

                    {/* Slideshow Card */}
                    <div className="card p-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={staffIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex gap-4 items-center"
                            >
                                {/* Profile Image - Rounded Rectangle */}
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-velvet-rose/20 to-gold/20 overflow-hidden flex-shrink-0 border-2 border-beige-200 dark:border-velvet-gray shadow-md">
                                    {currentStaff.avatar_url ? (
                                        <img
                                            src={currentStaff.avatar_url}
                                            alt={currentStaff.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-3xl opacity-50">👤</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-xs text-green-600 font-medium">Available</span>
                                    </div>
                                    <h4 className="font-semibold text-lg leading-tight truncate">{currentStaff.name}</h4>
                                    <p className="text-velvet-rose text-sm font-medium">{currentStaff.role}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                                        <span className="text-xs text-[var(--muted)]">5+ Years Experience</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    {staff.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <button
                                onClick={() => setStaffIndex((prev) => (prev - 1 + staff.length) % staff.length)}
                                className="w-10 h-10 rounded-full bg-white dark:bg-velvet-dark shadow-md border border-[var(--card-border)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-velvet-gray transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Dots */}
                            <div className="flex gap-2">
                                {staff.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStaffIndex(i)}
                                        className={`h-2 rounded-full transition-all duration-300 ${i === staffIndex ? 'bg-velvet-rose w-6' : 'bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 w-2'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setStaffIndex((prev) => (prev + 1) % staff.length)}
                                className="w-10 h-10 rounded-full bg-white dark:bg-velvet-dark shadow-md border border-[var(--card-border)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-velvet-gray transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Google Reviews */}
            <ReviewsSection />

            {/* Location Preview */}
            <section className="px-4 py-4 max-w-lg mx-auto">
                <div className="card p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-velvet-rose/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-velvet-rose" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1">Visit Us</h4>
                            <p className="text-[var(--muted)] text-sm line-clamp-2">
                                {SALON_CONFIG.address}
                            </p>
                        </div>
                    </div>

                    {/* Embedded Google Map */}
                    <div className="mt-4 rounded-xl overflow-hidden">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.3250567426535!2d75.55867237375026!3d13.939240892928954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbba96b4a2bdbcf%3A0xb2c7cf91ef317ada!2sVelvet%20Family%20Salon!5e0!3m2!1sen!2sin!4v1766467123099!5m2!1sen!2sin"
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Velvet Family Salon Location"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <a
                            href={getCallLink(SALON_CONFIG.phone)}
                            className="flex-1 btn-ghost border border-[var(--card-border)] text-sm"
                        >
                            <Phone className="w-4 h-4" />
                            Call
                        </a>
                        <a
                            href={getWhatsAppLink(SALON_CONFIG.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 btn-ghost border border-[var(--card-border)] text-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </a>
                        <Link
                            href="/contact"
                            className="flex-1 btn-ghost border border-[var(--card-border)] text-sm"
                        >
                            <MapPin className="w-4 h-4" />
                            Map
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="px-4 pt-0 pb-4 max-w-lg mx-auto">
                <motion.div
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-velvet-black to-velvet-dark p-6 text-center"
                    whileInView={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    viewport={{ once: true }}
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-velvet-rose/20 rounded-full blur-2xl" />
                    <h3 className="font-display text-2xl font-bold text-white mb-2 relative">
                        Ready for a <span className="gradient-text">Fresh Look?</span>
                    </h3>
                    <p className="text-beige-300 text-sm mb-4 relative">
                        Book your appointment in under 60 seconds
                    </p>
                    <Link href="/book" className="btn-primary inline-flex relative">
                        Book Now
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="px-4 pb-8 text-center max-w-lg mx-auto">
                <p className="text-[10px] text-[var(--muted)]">
                    &copy; {new Date().getFullYear()} Velvet Family Salon. All rights reserved.
                </p>
            </footer>

            {/* Install App Banner - shows every time home page is visited */}
            {showInstallBanner && (
                <HomePageInstallBanner onDismiss={() => setShowInstallBanner(false)} />
            )}
        </div>
    );
}
