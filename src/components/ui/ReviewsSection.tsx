'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Testimonial, ReviewsConfig } from '@/lib/types';
import { getActiveTestimonials, getReviewsConfig } from '@/lib/db';

export function ReviewsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [config, setConfig] = useState<ReviewsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Google Maps links
    const googleReviewsUrl = "https://www.google.com/maps/place/Velvet+Family+Salon/@13.939240892928954,75.55867237375026,17z/data=!4m8!3m7!1s0x3bbba96b4a2bdbcf:0xb2c7cf91ef317ada!8m2!3d13.9392409!4d75.5586724!9m1!1b1!16s%2Fg%2F11y3cwjsxn";

    useEffect(() => {
        async function loadData() {
            const [testimonialsData, configData] = await Promise.all([
                getActiveTestimonials(),
                getReviewsConfig(),
            ]);
            setTestimonials(testimonialsData);
            setConfig(configData);
            setLoading(false);
        }
        loadData();
    }, []);

    // Auto-slide effect
    useEffect(() => {
        if (testimonials.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [testimonials.length, isPaused]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const currentTestimonial = testimonials[currentIndex];

    return (
        <section className="px-4 py-6 max-w-lg mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                {/* Section Header with Rating */}
                <div className="text-center mb-6">
                    {config && (
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="flex items-center gap-1">
                                <Star className="w-6 h-6 text-velvet-rose fill-gold" />
                                <span className="text-2xl font-bold">{config.average_rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[var(--muted)]">•</span>
                            <span className="text-[var(--muted)] text-sm">
                                Loved by {config.total_reviews_count}+ customers
                            </span>
                        </div>
                    )}
                    <h3 className="font-display text-xl font-semibold">
                        Customer Testimonials
                    </h3>
                    <p className="text-[var(--muted)] text-sm mt-1">
                        Based on customer feedback
                    </p>
                </div>

                {loading ? (
                    /* Skeleton Loader */
                    <div className="card p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--muted)]/20" />
                                <div className="flex-1">
                                    <div className="h-4 bg-[var(--muted)]/20 rounded w-24 mb-2" />
                                    <div className="h-3 bg-[var(--muted)]/10 rounded w-20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-[var(--muted)]/20 rounded" />
                                <div className="h-3 bg-[var(--muted)]/20 rounded w-3/4" />
                            </div>
                        </div>
                    </div>
                ) : testimonials.length > 0 ? (
                    /* Testimonials Slideshow */
                    <div
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                    >
                        {/* Card with Animation */}
                        <div className="card p-5 min-h-[140px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-velvet-rose/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {currentTestimonial?.customer_image_url ? (
                                                <img
                                                    src={currentTestimonial.customer_image_url}
                                                    alt={currentTestimonial.customer_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-velvet-rose font-bold text-lg">
                                                    {currentTestimonial?.customer_name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold mb-1">{currentTestimonial?.customer_name}</h4>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < (currentTestimonial?.rating || 5) ? 'text-velvet-rose fill-gold' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[var(--muted)] text-sm mt-3 leading-relaxed">
                                        "{currentTestimonial?.review_text}"
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation - Below the card */}
                        {testimonials.length > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <button
                                    onClick={prevSlide}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-velvet-dark shadow-md border border-[var(--card-border)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-velvet-gray transition-colors"
                                    aria-label="Previous testimonial"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {/* Dots */}
                                <div className="flex gap-2">
                                    {testimonials.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex
                                                ? 'bg-velvet-rose w-6'
                                                : 'bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 w-2'
                                                }`}
                                            aria-label={`Go to testimonial ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={nextSlide}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-velvet-dark shadow-md border border-[var(--card-border)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-velvet-gray transition-colors"
                                    aria-label="Next testimonial"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="card p-6 text-center">
                        <p className="text-[var(--muted)] mb-4">Check out our reviews on Google</p>
                    </div>
                )}

                {/* View More CTA */}
                <a
                    href={googleReviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-xl bg-velvet-rose/10 hover:bg-velvet-rose/20 text-velvet-rose font-medium text-sm transition-colors"
                >
                    <Star className="w-4 h-4 fill-gold" />
                    <span>View all reviews on Google</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </motion.div>
        </section>
    );
}
