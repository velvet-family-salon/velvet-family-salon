'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scissors, Clock, ChevronRight } from 'lucide-react';
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
    };

    if (compact) {
        return (
            <Link href={`/book?service=${service.id}`}>
                <motion.div
                    className="card p-3 h-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="aspect-square bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl mb-2 flex items-center justify-center">
                        <Scissors className="w-8 h-8 text-velvet-rose/50" />
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
        <Link href={`/book?service=${service.id}`}>
            <motion.div
                className="card p-4 flex gap-4"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="w-20 h-20 bg-gradient-to-br from-beige-100 to-beige-200 dark:from-velvet-dark dark:to-velvet-gray rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-8 h-8 text-velvet-rose/50" />
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-velvet-rose font-bold">
                                {formatPrice(service.price)}
                            </span>
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
