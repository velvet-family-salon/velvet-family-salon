import { Service } from '@/lib/types';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Clock, Check, Sparkles, Timer, ArrowRight, IndianRupee, User, Users } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ComboCardProps {
    service: Service;
}

export function ComboCard({ service }: ComboCardProps) {
    const percentOff = service.compare_at_price && service.compare_at_price > service.price
        ? Math.round(((service.compare_at_price - service.price) / service.compare_at_price) * 100)
        : 0;

    const savings = service.compare_at_price && service.compare_at_price > service.price
        ? service.compare_at_price - service.price
        : 0;

    // Calculate days remaining for offer
    const getDaysRemaining = () => {
        if (!service.offer_end_at) return null;
        const now = new Date();
        const endDate = new Date(service.offer_end_at);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysRemaining = getDaysRemaining();
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 2 && daysRemaining > 0;

    const isCombo = service.is_combo;
    const includedServices = service.included_services || [];

    // Get Gender Icon
    const getGenderIcon = () => {
        switch (service.category) {
            case 'men': return <User className="w-3 h-3" />;
            case 'women': return <User className="w-3 h-3" />;
            case 'unisex': return <Users className="w-3 h-3" />;
            case 'combo': return <Users className="w-3 h-3" />;
            default: return null;
        }
    };

    const getGenderLabel = () => {
        if (service.category === 'combo') return 'Combo Offers';
        return service.category.charAt(0).toUpperCase() + service.category.slice(1);
    };

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full min-w-[300px] h-40 rounded-2xl overflow-hidden bg-white dark:bg-velvet-dark shadow-lg hover:shadow-2xl hover:shadow-[rgba(196,118,124,0.2)] transition-all duration-300 group flex flex-row"
        >
            {/* Animated Rose Border - Always visible */}
            <div className="absolute inset-[-2px] rounded-2xl -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-[rgb(196,118,124)] via-pink-400 to-[rgb(196,118,124)] animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            {/* White Background to mask the center - leaves 2px for border */}
            <div className="absolute inset-[2px] rounded-xl bg-white dark:bg-velvet-dark z-0 overflow-hidden" />

            {/* Animated Shine Effect */}
            <div className="absolute inset-0 opacity-100 transition-opacity duration-1000 pointer-events-none z-30 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(196,118,124,0.3)] to-transparent -skew-x-12 animate-shine" />
            </div>

            {/* Left Side: Image or Gradient (30%) */}
            <div className="w-[30%] h-full relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {service.image_url ? (
                    <img src={service.image_url} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                    </div>
                )}

                {/* Overlay Text/Icon */}
                <div className="relative z-10 flex flex-col items-center justify-center text-white p-2 text-center w-full h-full text-shadow-sm">
                    {!service.image_url && <Sparkles className="w-6 h-6 mb-1 text-white/90" />}
                    {percentOff > 0 && (
                        <div className="font-bold text-xl leading-none drop-shadow-md">{percentOff}%</div>
                    )}
                    <div className="text-[9px] uppercase font-bold tracking-widest opacity-90 drop-shadow-md">OFF</div>
                </div>
            </div>

            {/* Right Side: Details (70%) */}
            <div className="w-[70%] h-full p-2 relative flex flex-col justify-between z-10">
                {/* Badges/Tags Row */}
                <div className="flex items-start justify-between gap-1 mb-0.5 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[8px] font-bold text-[rgb(196,118,124)] bg-[rgba(196,118,124,0.1)] px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-[rgba(196,118,124,0.2)] flex items-center gap-0.5 whitespace-nowrap">
                            {getGenderIcon()} {getGenderLabel()}
                        </span>
                        {/* Combo Badge */}
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white uppercase tracking-wider flex items-center gap-0.5 whitespace-nowrap">
                            <Sparkles className="w-2.5 h-2.5" />
                            COMBO
                        </span>
                    </div>
                    {daysRemaining !== null && daysRemaining > 0 && (
                        <span className={`text-[8px] font-bold flex items-center gap-0.5 ${isExpiringSoon ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                            <Timer className="w-2.5 h-2.5" />
                            {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                        </span>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-display text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 mb-0.5 group-hover:text-[rgb(196,118,124)] transition-colors">
                        {service.name}
                    </h3>
                    {/* Included Services Preview - Show ALL services */}
                    {includedServices.length > 0 && (
                        <div className="text-[8px] text-[var(--muted)] flex flex-wrap gap-0.5 mt-0.5">
                            {includedServices.map((s, i) => (
                                <span key={i} className="bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                    + {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pricing & CTA */}
                <div className="mt-1 pt-1.5 border-t border-dashed border-gray-200 dark:border-gray-700 flex items-end justify-between gap-2">
                    <div className="flex flex-col leading-none">
                        {/* Savings Display */}
                        {savings > 0 && (
                            <div className="flex items-center gap-0.5 text-[9px] text-green-600 font-bold mb-0.5 bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded w-fit">
                                <Sparkles className="w-2 h-2" />
                                <span>Save {formatPrice(savings)}</span>
                            </div>
                        )}
                        <div className="flex items-baseline gap-1">
                            {service.compare_at_price && (
                                <span className="text-[9px] text-[var(--muted)] line-through">
                                    {formatPrice(service.compare_at_price)}
                                </span>
                            )}
                            <span className="text-lg font-bold text-[rgb(196,118,124)]">
                                {formatPrice(service.price)}
                            </span>
                        </div>
                    </div>

                    <Link
                        href={`/book?service=${service.id}`}
                        className="h-8 px-3 rounded-full bg-[rgb(196,118,124)] text-white text-[10px] font-bold shadow-md shadow-[rgba(196,118,124,0.3)] flex items-center gap-1 hover:bg-[rgb(168,90,96)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                    >
                        BOOK <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
