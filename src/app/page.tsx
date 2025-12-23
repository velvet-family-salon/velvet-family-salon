'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Star, Clock, MapPin, Phone, MessageCircle, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { formatPrice, SALON_CONFIG, getWhatsAppLink, getCallLink } from '@/lib/utils';
import { getServices, getReviewsConfig } from '@/lib/db';
import { Service, ReviewsConfig } from '@/lib/types';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { QuickActions } from '@/components/ui/QuickActions';
import { ReviewsSection } from '@/components/ui/ReviewsSection';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

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
    const [reviewsConfig, setReviewsConfig] = useState<ReviewsConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const [servicesData, configData] = await Promise.all([
                getServices(),
                getReviewsConfig(),
            ]);
            setServices(servicesData.slice(0, 4)); // Get first 4 for featured
            setReviewsConfig(configData);
            setLoading(false);
        }
        loadData();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-velvet-rose/20">
                            <Image src="/logo_hq.png" alt="Velvet Family Salon" fill className="object-cover scale-125" priority />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-semibold leading-tight">Velvet</h1>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Family Salon</p>
                        </div>
                    </div>
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
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-velvet-black via-velvet-dark to-velvet-black" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 right-10 w-32 h-32 bg-velvet-rose/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-velvet-rose/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    className="relative px-6 py-12 max-w-lg mx-auto text-center"
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

                    <motion.p
                        variants={fadeInUp}
                        className="text-beige-300 text-sm mb-6 max-w-xs mx-auto"
                    >
                        Your family&apos;s complete grooming destination. Expert stylists, premium services, unforgettable experience.
                    </motion.p>

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
                        {services.map((service) => (
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
        </div>
    );
}
