'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, User, Info, Phone, MapPin, Moon, Sun, LogIn, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SALON_CONFIG, getWhatsAppLink, getCallLink } from '@/lib/utils';

export default function MenuPage() {
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        {
            section: 'Quick Links',
            items: [
                { icon: User, label: 'About Us', href: '/about' },
                { icon: Phone, label: 'Contact', href: '/contact' },
                { icon: MapPin, label: 'Location', href: '/contact' },
            ],
        },
        {
            section: 'Settings',
            items: [
                {
                    icon: theme === 'dark' ? Sun : Moon,
                    label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
                    onClick: toggleTheme,
                },
            ],
        },
        {
            section: 'Admin',
            items: [
                { icon: LogIn, label: 'Admin Login', href: '/admin' },
            ],
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">More</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
                {menuItems.map((section, sectionIndex) => (
                    <motion.div
                        key={section.section}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1 }}
                    >
                        <h2 className="text-sm font-medium text-[var(--muted)] mb-2 px-1">
                            {section.section}
                        </h2>
                        <div className="card overflow-hidden divide-y divide-[var(--card-border)]">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const content = (
                                    <div className="flex items-center gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-velvet-rose/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-velvet-rose" />
                                        </div>
                                        <span className="flex-1 font-medium">{item.label}</span>
                                        <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                                    </div>
                                );

                                if ('onClick' in item && item.onClick) {
                                    return (
                                        <button
                                            key={item.label}
                                            onClick={item.onClick}
                                            className="w-full text-left hover:bg-beige-50 dark:hover:bg-velvet-dark transition-colors"
                                        >
                                            {content}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.label}
                                        href={'href' in item ? item.href : '#'}
                                        className="block hover:bg-beige-50 dark:hover:bg-velvet-dark transition-colors"
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}

                {/* Contact Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-sm font-medium text-[var(--muted)] mb-2 px-1">
                        Contact Salon
                    </h2>
                    <div className="flex gap-3">
                        <a
                            href={getCallLink(SALON_CONFIG.phone)}
                            className="flex-1 card p-4 flex flex-col items-center gap-2 hover:border-velvet-rose/50 transition-colors"
                        >
                            <Phone className="w-6 h-6 text-green-600" />
                            <span className="text-sm font-medium">Call</span>
                        </a>
                        <a
                            href={getWhatsAppLink(SALON_CONFIG.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 card p-4 flex flex-col items-center gap-2 hover:border-velvet-rose/50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="text-sm font-medium">WhatsApp</span>
                        </a>
                    </div>
                </motion.div>

                {/* Version */}
                <p className="text-center text-xs text-[var(--muted)]">
                    Velvet Family Salon v1.0.0
                </p>
            </div>
        </div>
    );
}
