'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Scissors, Star, Heart, Award, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">About Us</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                        <Scissors className="w-10 h-10 text-velvet-black" />
                    </div>
                    <h2 className="font-display text-3xl font-bold mb-2">
                        Velvet <span className="gradient-text">Family Salon</span>
                    </h2>
                    <p className="text-[var(--muted)]">
                        Where Every Visit is a Premium Experience
                    </p>
                </motion.div>

                {/* Story */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="prose prose-sm dark:prose-invert"
                >
                    <p className="text-[var(--muted)] leading-relaxed">
                        Welcome to <strong className="text-[var(--foreground)]">Velvet Family Salon</strong>,
                        Shivamogga&apos;s premier destination for luxury grooming and beauty services.
                        We believe that looking good is the first step to feeling great.
                    </p>
                    <p className="text-[var(--muted)] leading-relaxed">
                        Our team of expert stylists and beauty professionals are dedicated to providing
                        you with personalized services that enhance your natural beauty. Whether you&apos;re
                        here for a quick trim or a complete makeover, we ensure every visit leaves you
                        feeling refreshed and confident.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-3"
                >
                    {[
                        { icon: Users, value: '5000+', label: 'Happy Clients' },
                        { icon: Star, value: '4.8', label: 'Rating' },
                        { icon: Award, value: '5+', label: 'Years' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="card p-4 text-center">
                                <Icon className="w-6 h-6 text-velvet-rose mx-auto mb-2" />
                                <div className="font-bold text-xl">{stat.value}</div>
                                <div className="text-xs text-[var(--muted)]">{stat.label}</div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Why Choose Us */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="font-display text-xl font-semibold mb-4">Why Choose Velvet?</h3>
                    <div className="space-y-3">
                        {[
                            { emoji: '✨', title: 'Premium Products', desc: 'We use only the finest professional-grade products' },
                            { emoji: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: 'Services for men, women, and kids under one roof' },
                            { emoji: '🎯', title: 'Expert Stylists', desc: 'Trained professionals with years of experience' },
                            { emoji: '💆', title: 'Relaxing Ambiance', desc: 'Unwind in our modern, comfortable space' },
                            { emoji: '📱', title: 'Easy Booking', desc: 'Book your appointment in under 60 seconds' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                className="card p-4 flex items-start gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <span className="text-2xl">{item.emoji}</span>
                                <div>
                                    <h4 className="font-semibold text-sm">{item.title}</h4>
                                    <p className="text-xs text-[var(--muted)]">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center space-y-4"
                >
                    <p className="text-[var(--muted)] flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Made with love in Shivamogga
                    </p>
                    <Link href="/book" className="btn-primary inline-flex">
                        Book Your Visit
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
