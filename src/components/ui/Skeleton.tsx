'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rectangle' | 'card';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export function Skeleton({
    className = '',
    variant = 'rectangle',
    width,
    height,
    count = 1
}: SkeletonProps) {
    const baseClasses = 'bg-[var(--card-border)] animate-pulse rounded';

    const variantClasses = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        rectangle: 'rounded-xl',
        card: 'rounded-2xl',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <>
            {items.map((i) => (
                <div
                    key={i}
                    className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                    style={style}
                />
            ))}
        </>
    );
}

// Pre-built skeleton patterns
export function ServiceCardSkeleton() {
    return (
        <div className="card p-4 flex items-center gap-4">
            <Skeleton variant="rectangle" className="w-16 h-16 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="50%" height={16} />
            </div>
            <Skeleton variant="circle" width={40} height={40} />
        </div>
    );
}

export function ServiceListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function StaffCarouselSkeleton() {
    return (
        <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 min-w-[80px]">
                    <Skeleton variant="circle" width={48} height={48} />
                    <Skeleton variant="text" width={60} height={12} />
                </div>
            ))}
        </div>
    );
}

export function HeroSkeleton() {
    return (
        <div className="relative overflow-hidden min-h-[400px] bg-velvet-dark">
            <div className="relative px-6 py-12 max-w-lg mx-auto text-center z-10">
                <Skeleton variant="rectangle" className="w-40 h-6 mx-auto mb-4" />
                <Skeleton variant="text" className="w-64 h-10 mx-auto mb-2" />
                <Skeleton variant="text" className="w-48 h-8 mx-auto mb-6" />
                <Skeleton variant="text" className="w-full max-w-xs h-12 mx-auto mb-6" />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Skeleton variant="rectangle" className="w-40 h-12 mx-auto" />
                    <Skeleton variant="rectangle" className="w-40 h-12 mx-auto" />
                </div>
            </div>
        </div>
    );
}

export function PageLoadingSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <HeroSkeleton />
            <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
                <ServiceListSkeleton count={4} />
            </div>
        </motion.div>
    );
}
