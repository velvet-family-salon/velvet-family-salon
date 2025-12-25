'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, Star, Save, Loader2,
    MessageSquare, Settings, Info, Shield
} from 'lucide-react';
import { ReviewsConfig } from '@/lib/types';
import { getReviewsConfig, updateReviewsConfig } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/admin/AccessDenied';

export default function ReviewsConfigPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [config, setConfig] = useState<ReviewsConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { hasPermission, loading: permLoading } = usePermissions();

    const canView = hasPermission('view_reviews');
    const canManage = hasPermission('manage_reviews');

    const [formData, setFormData] = useState({
        average_rating: 5.0,
        total_reviews_count: 0,
    });

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config', active: true },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        setLoading(true);
        const data = await getReviewsConfig();
        if (data) {
            setConfig(data);
            setFormData({
                average_rating: data.average_rating,
                total_reviews_count: data.total_reviews_count,
            });
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const success = await updateReviewsConfig({
            average_rating: formData.average_rating,
            total_reviews_count: formData.total_reviews_count,
        });

        setSaving(false);
        if (success) {
            showToast('success', 'Review settings saved successfully');
        } else {
            showToast('error', 'Failed to save review settings');
        }
    }

    if (loading || permLoading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
            </AuthGuard>
        );
    }

    if (!canView) {
        return (
            <AuthGuard>
                <AccessDenied />
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
                {/* Header */}
                <header className="bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray sticky top-0 z-30">
                    <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between">
                        <h1 className="font-display text-xl font-semibold">Reviews Settings</h1>
                    </div>
                </header>

                <div className="flex w-full">
                    {/* Sidebar - Desktop */}
                    <aside className="hidden md:block w-56 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                        ? 'bg-gold/10 text-gold'
                                        : 'hover:bg-beige-100 dark:hover:bg-velvet-dark text-[var(--muted)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 pb-24 md:pb-8 max-w-lg">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Info Card */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        These values are displayed on the home page. Update them to match your current Google reviews.
                                    </p>
                                </div>
                            </div>

                            {/* Average Rating */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4">
                                <label className="block font-semibold mb-3">Average Rating</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-8 h-8 ${star <= Math.round(formData.average_rating)
                                                    ? 'text-gold fill-gold'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.average_rating}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            average_rating: Math.min(5, Math.max(1, parseFloat(e.target.value) || 1))
                                        })}
                                        min="1"
                                        max="5"
                                        step="0.1"
                                        className="w-20 px-3 py-2 rounded-xl border border-beige-200 dark:border-velvet-gray bg-beige-50 dark:bg-velvet-black text-center font-bold text-lg"
                                    />
                                </div>
                                <p className="text-sm text-[var(--muted)] mt-2">
                                    Enter your current Google rating (1.0 - 5.0)
                                </p>
                            </div>

                            {/* Total Reviews */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4">
                                <label className="block font-semibold mb-3">Total Reviews Count</label>
                                <input
                                    type="number"
                                    value={formData.total_reviews_count}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        total_reviews_count: parseInt(e.target.value) || 0
                                    })}
                                    min="0"
                                    className="input-field text-lg font-medium"
                                    placeholder="128"
                                />
                                <p className="text-sm text-[var(--muted)] mt-2">
                                    Enter the total number of reviews you have on Google
                                </p>
                            </div>

                            {/* Preview */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4">
                                <label className="block font-semibold mb-3">Preview</label>
                                <div className="flex items-center justify-center gap-3 py-4 bg-beige-50 dark:bg-velvet-black rounded-xl">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-6 h-6 text-gold fill-gold" />
                                        <span className="text-2xl font-bold">{formData.average_rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-[var(--muted)]">•</span>
                                    <span className="text-[var(--muted)]">
                                        Loved by {formData.total_reviews_count}+ customers
                                    </span>
                                </div>
                            </div>

                            {/* Submit */}
                            {canManage ? (
                                <motion.button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full btn-primary"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Settings
                                        </>
                                    )}
                                </motion.button>
                            ) : (
                                <p className="text-center text-sm text-[var(--muted)]">
                                    You don't have permission to edit these settings.
                                </p>
                            )}

                            {config?.updated_at && (
                                <p className="text-center text-sm text-[var(--muted)]">
                                    Last updated: {new Date(config.updated_at).toLocaleDateString()}
                                </p>
                            )}
                        </form>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                    <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-0.5 px-2 py-2 min-w-[60px] ${item.active ? 'text-gold' : 'text-[var(--muted)]'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[9px] font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </AuthGuard>
    );
}
