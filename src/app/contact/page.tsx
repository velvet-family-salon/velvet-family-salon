'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { SALON_CONFIG, getWhatsAppLink, getCallLink } from '@/lib/utils';

export default function ContactPage() {
    // Correct embed URL for Velvet Family Salon
    const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.3250567426535!2d75.55867237375026!3d13.939240892928954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbba96b4a2bdbcf%3A0xb2c7cf91ef317ada!2sVelvet%20Family%20Salon!5e0!3m2!1sen!2sin!4v1766467123099!5m2!1sen!2sin";

    // Direct link to Velvet Family Salon on Google Maps with place ID
    const googleMapsUrl = "https://www.google.com/maps/place/Velvet+Family+Salon/@13.939240892928954,75.55867237375026,17z/data=!3m1!4b1!4m6!3m5!1s0x3bbba96b4a2bdbcf:0xb2c7cf91ef317ada!8m2!3d13.9392409!4d75.5586724!16s%2Fg%2F11y3cwjsxn";

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">Contact Us</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden border border-[var(--card-border)]"
                >
                    <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full"
                    />
                </motion.div>

                {/* Address Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-velvet-rose/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-velvet-rose" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold mb-1">Our Location</h3>
                            <p className="text-sm text-[var(--muted)] mb-3">
                                {SALON_CONFIG.address}
                            </p>
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-velvet-rose text-sm font-medium"
                            >
                                Get Directions
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Contact Options */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-3"
                >
                    <a
                        href={getCallLink(SALON_CONFIG.phone)}
                        className="card p-4 flex flex-col items-center gap-3 text-center hover:border-velvet-rose/50 transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">Call Us</h4>
                            <p className="text-xs text-[var(--muted)]">Tap to call directly</p>
                        </div>
                    </a>

                    <a
                        href={getWhatsAppLink(SALON_CONFIG.whatsapp, 'Hi! I would like to know more about your services.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card p-4 flex flex-col items-center gap-3 text-center hover:border-velvet-rose/50 transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">WhatsApp</h4>
                            <p className="text-xs text-[var(--muted)]">Chat with us</p>
                        </div>
                    </a>
                </motion.div>

                {/* Working Hours */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-4"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-velvet-rose/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-velvet-rose" />
                        </div>
                        <h3 className="font-semibold">Working Hours</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        {[
                            { day: 'Monday - Saturday', time: '9:00 AM - 9:00 PM' },
                            { day: 'Sunday', time: '10:00 AM - 6:00 PM' },
                        ].map((item) => (
                            <div key={item.day} className="flex justify-between">
                                <span className="text-[var(--muted)]">{item.day}</span>
                                <span className="font-medium">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Book CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/book" className="btn-primary w-full">
                        Book an Appointment
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
