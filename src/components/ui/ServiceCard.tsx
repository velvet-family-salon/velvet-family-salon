'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scissors, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { Service } from '@/lib/types';
import { formatPrice, formatDuration } from '@/lib/utils';

interface ServiceCardProps {
    service: Service;
    compact?: boolean;
}

export function ServiceCard({ service, compact = false }: ServiceCardProps) {
    const categoryColors = {
        men: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        women: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
        unisex: 'bg-velvet-rose/10 text-velvet-rose',
        combo: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    };

    if (compact) {
        return (
            <Link href={`/book?service=${service.id}`}>
                <motion.div
                    className="card p-3 h-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="aspect-square bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl mb-2 flex items-center justify-center overflow-hidden border border-[var(--card-border)] relative">
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
                                    <Scissors className="w-8 h-8 text-velvet-rose/50" />
                                </div>
                            </>
                        ) : (
                            <Scissors className="w-8 h-8 text-velvet-rose/50" />
                        )}
                    </div>
                    <h4 className="font-semibold text-sm leading-tight mb-1 line-clamp-1">
                        {service.name}
                    </h4>
                    <div className="flex items-center justify-between">
                        <span className="text-velvet-rose font-semibold text-sm">
                            {formatPrice(service.price)}
                        </span>
                        <span className="text-[var(--muted)] text-xs">
                            {formatDuration(service.duration_minutes)}
                        </span>
                    </div>
                </motion.div>
            </Link>
        );
    }

    return (
        <Link
            href={`/book?service=${service.id}`}
            className="block"
        >
            <motion.div
                className={`relative card p-4 flex gap-4 ${service.is_combo ? 'overflow-visible' : ''}`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {/* Animated Rose Border Glow - Only for combo services */}
                {service.is_combo && (
                    <div
                        className="absolute inset-0 rounded-2xl -z-10 animate-pulse"
                        style={{
                            boxShadow: '0 0 0 2px rgb(196, 118, 124), 0 0 20px rgba(196, 118, 124, 0.6)'
                        }}
                    />
                )}

                {/* Animated Shine Effect - Only for combo services */}
                {service.is_combo && (
                    <div className="absolute inset-0 opacity-100 transition-opacity duration-1000 pointer-events-none z-30 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(196,118,124,0.3)] to-transparent -skew-x-12 animate-shine" />
                    </div>
                )}

                {/* Combo Offers Badge - Positioned on top-left corner */}
                {service.is_combo && (
                    <div className="absolute -top-1 -left-1 z-40">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            COMBO
                        </span>
                    </div>
                )}

                <div className="w-20 h-20 bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--card-border)] relative">
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
                                <Scissors className="w-8 h-8 text-velvet-rose/50" />
                            </div>
                        </>
                    ) : (
                        <Scissors className="w-8 h-8 text-velvet-rose/50" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold leading-tight line-clamp-1">
                            {service.name}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColors[service.category]}`}>
                            {service.category}
                        </span>
                    </div>

                    <p className="text-[var(--muted)] text-sm mb-2 line-clamp-1">
                        {service.description}
                    </p>

                    {/* Included Services for Combo */}
                    {service.is_combo && service.included_services && service.included_services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {service.included_services.map((item: any) => (
                                <span key={item.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50">
                                    + {item.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-velvet-rose font-bold">
                                    {formatPrice(service.price)}
                                </span>
                                {service.compare_at_price && service.compare_at_price > service.price && (
                                    <>
                                        <span className="text-[10px] text-[var(--muted)] line-through">
                                            {formatPrice(service.compare_at_price)}
                                        </span>
                                        <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                            {Math.round(((service.compare_at_price - service.price) / service.compare_at_price) * 100)}% OFF
                                        </span>
                                    </>
                                )}
                            </div>
                            <span className="flex items-center gap-1 text-[var(--muted)] text-sm">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDuration(service.duration_minutes)}
                            </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
