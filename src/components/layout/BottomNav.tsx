'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Scissors, Calendar, Clock, Menu } from 'lucide-react';

const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/services', icon: Scissors, label: 'Services' },
    { href: '/book', icon: Calendar, label: 'Book' },
    { href: '/history', icon: Clock, label: 'History' },
    { href: '/menu', icon: Menu, label: 'More' },
];

export function BottomNav() {
    const pathname = usePathname();

    // Hide on admin pages
    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--card-border)]">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-16 h-full"
                        >
                            <motion.div
                                className={`flex flex-col items-center gap-0.5 ${isActive ? 'text-velvet-rose' : 'text-[var(--muted)]'
                                    }`}
                                whileTap={{ scale: 0.9 }}
                            >
                                <div className="relative">
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-velvet-rose rounded-full"
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'text-velvet-rose' : 'text-[var(--muted)]'
                                    }`}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
