'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, Plus, Star, Edit, Trash2,
    Eye, EyeOff, Loader2, Save, X, User, MessageSquare, Settings, RefreshCw, Shield
} from 'lucide-react';
import { Testimonial } from '@/lib/types';
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/admin/AccessDenied';

export default function TestimonialsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const { hasPermission, loading: permLoading } = usePermissions();

    const canView = hasPermission('view_testimonials');
    const canManage = hasPermission('manage_testimonials');

    // Form state
    const [formData, setFormData] = useState({
        customer_name: '',
        rating: 5,
        review_text: '',
        customer_image_url: '',
        is_active: true,
    });

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials', active: true },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

    useEffect(() => {
        loadTestimonials();
    }, []);

    async function loadTestimonials() {
        setLoading(true);
        const data = await getAllTestimonials();
        setTestimonials(data);
        setLoading(false);
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        const data = await getAllTestimonials();
        setTestimonials(data);
        setRefreshing(false);
    };

    function openAddModal() {
        setEditingId(null);
        setFormData({
            customer_name: '',
            rating: 5,
            review_text: '',
            customer_image_url: '',
            is_active: true,
        });
        setShowModal(true);
    }

    function openEditModal(testimonial: Testimonial) {
        setEditingId(testimonial.id);
        setFormData({
            customer_name: testimonial.customer_name,
            rating: testimonial.rating,
            review_text: testimonial.review_text,
            customer_image_url: testimonial.customer_image_url || '',
            is_active: testimonial.is_active,
        });
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const testimonialData = {
            customer_name: formData.customer_name,
            rating: formData.rating,
            review_text: formData.review_text,
            customer_image_url: formData.customer_image_url || null,
            is_active: formData.is_active,
        };

        let success = false;
        if (editingId) {
            success = await updateTestimonial(editingId, testimonialData);
            if (success) {
                showToast('success', 'Testimonial updated successfully');
            } else {
                showToast('error', 'Failed to update testimonial');
            }
        } else {
            success = await createTestimonial(testimonialData);
            if (success) {
                showToast('success', 'Testimonial created successfully');
            } else {
                showToast('error', 'Failed to create testimonial');
            }
        }

        setSaving(false);
        setShowModal(false);
        loadTestimonials();
    }

    async function handleToggleActive(id: string, currentState: boolean) {
        const success = await updateTestimonial(id, { is_active: !currentState });
        if (success) {
            showToast('success', `Testimonial ${!currentState ? 'shown' : 'hidden'}`);
        } else {
            showToast('error', 'Failed to update testimonial visibility');
        }
        loadTestimonials();
    }

    async function handleDelete(id: string) {
        if (confirm('Are you sure you want to delete this testimonial?')) {
            const success = await deleteTestimonial(id);
            if (success) {
                showToast('success', 'Testimonial deleted successfully');
            } else {
                showToast('error', 'Failed to delete testimonial');
            }
            loadTestimonials();
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
                        <h1 className="font-display text-xl font-semibold">Testimonials</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-gold"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            {canManage && (
                                <button onClick={openAddModal} className="btn-primary text-sm py-2">
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            )}
                        </div>
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
                    <main className="flex-1 p-4 pb-24 md:pb-8">
                        {testimonials.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" />
                                <p className="text-[var(--muted)]">No testimonials yet</p>
                                <button onClick={openAddModal} className="btn-primary mt-4">
                                    <Plus className="w-4 h-4" />
                                    Add First Testimonial
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {testimonials.map((testimonial, index) => (
                                    <motion.div
                                        key={testimonial.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4 ${!testimonial.is_active ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {testimonial.customer_image_url ? (
                                                    <img
                                                        src={testimonial.customer_image_url}
                                                        alt={testimonial.customer_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-gold font-bold text-lg">
                                                        {testimonial.customer_name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{testimonial.customer_name}</h3>
                                                    {!testimonial.is_active && (
                                                        <span className="text-xs bg-gray-500/20 px-2 py-0.5 rounded">Hidden</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < testimonial.rating ? 'text-gold fill-gold' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-[var(--muted)] line-clamp-2">
                                                    {testimonial.review_text}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {canManage && (
                                            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                                <button
                                                    onClick={() => handleToggleActive(testimonial.id, testimonial.is_active)}
                                                    className={`p-2 rounded-lg transition-colors ${testimonial.is_active
                                                        ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                                        : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                                                        }`}
                                                    title={testimonial.is_active ? 'Hide' : 'Show'}
                                                >
                                                    {testimonial.is_active ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(testimonial)}
                                                    className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(testimonial.id)}
                                                    className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
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

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white dark:bg-velvet-dark rounded-2xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-lg font-semibold">
                                    {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                        required
                                        className="input-field"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className="p-1"
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${star <= formData.rating ? 'text-gold fill-gold' : 'text-gray-300'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Review Text</label>
                                    <textarea
                                        value={formData.review_text}
                                        onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                                        required
                                        rows={3}
                                        className="input-field resize-none"
                                        placeholder="Share the customer's experience..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
                                    <input
                                        type="url"
                                        value={formData.customer_image_url}
                                        onChange={(e) => setFormData({ ...formData, customer_image_url: e.target.value })}
                                        className="input-field"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="is_active" className="text-sm">Show on website</label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 btn-primary"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
