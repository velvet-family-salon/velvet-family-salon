'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, MessageSquare, Settings,
    X, Save, IndianRupee, Clock, RefreshCw, Shield, Sparkles, Tag, Timer, Eye
} from 'lucide-react';
import { getAllServices, updateService, deleteService, createService, uploadServiceImage } from '@/lib/db';
import { Service, ServiceCategory } from '@/lib/types';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/admin/AccessDenied';

export default function AdminServicesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<ServiceCategory | 'all'>('all');
    const { hasPermission, loading: permLoading } = usePermissions();

    const canView = hasPermission('view_services');
    const canManage = hasPermission('manage_services');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        compare_at_price: '',
        duration_minutes: '30',
        category: 'unisex' as ServiceCategory,
        image_url: '',
        is_active: true,
        is_combo: false,
        is_featured: false,
        offer_end_at: '',
        included_services: [] as { id: string; name: string; price: number; duration: number }[],
    });

    useEffect(() => {
        loadServices();
    }, []);

    async function loadServices() {
        setLoading(true);
        const data = await getAllServices();
        setServices(data);
        setLoading(false);
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        const data = await getAllServices();
        setServices(data);
        setRefreshing(false);
    };

    const filteredServices = services.filter((service) => {
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const success = await updateService(id, { is_active: !currentStatus });
        if (success) {
            setServices(services.map(s =>
                s.id === id ? { ...s, is_active: !currentStatus } : s
            ));
            showToast('success', `Service ${!currentStatus ? 'activated' : 'deactivated'}`);
        } else {
            showToast('error', 'Failed to update service status');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this service?')) {
            const success = await deleteService(id);
            if (success) {
                setServices(services.filter(s => s.id !== id));
                showToast('success', 'Service deleted successfully');
            } else {
                showToast('error', 'Failed to delete service');
            }
        }
    };

    function openAddModal(isCombo = false) {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            compare_at_price: '',
            duration_minutes: '30',
            category: isCombo ? 'combo' : 'unisex',
            image_url: '',
            is_active: true,
            is_combo: isCombo,
            is_featured: false,
            offer_end_at: '',
            included_services: [],
        });
        setShowModal(true);
    }

    function openEditModal(service: Service) {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price.toString(),
            compare_at_price: service.compare_at_price?.toString() || '',
            duration_minutes: service.duration_minutes.toString(),
            category: service.category,
            image_url: service.image_url || '',
            is_active: service.is_active,
            is_combo: service.is_combo || false,
            is_featured: service.is_featured || false,
            offer_end_at: service.offer_end_at ? new Date(service.offer_end_at).toISOString().slice(0, 16) : '',
            included_services: (service.included_services as any[]) || [],
        });
        setShowModal(true);
    }

    // Combo Logic
    const toggleServiceInCombo = (service: Service) => {
        const exists = formData.included_services.find(s => s.id === service.id);
        let newIncluded;

        if (exists) {
            newIncluded = formData.included_services.filter(s => s.id !== service.id);
        } else {
            newIncluded = [...formData.included_services, {
                id: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration_minutes
            }];
        }

        // Auto-calculate totals
        const totalDuration = newIncluded.reduce((sum, s) => sum + s.duration, 0);
        const totalPrice = newIncluded.reduce((sum, s) => sum + s.price, 0);

        // Auto-calculate Gender Category
        const includedIds = newIncluded.map(s => s.id);
        const selectedServices = services.filter(s => includedIds.includes(s.id));

        let newCategory: ServiceCategory = 'unisex';
        if (selectedServices.length > 0) {
            const allMen = selectedServices.every(s => s.category === 'men');
            const allWomen = selectedServices.every(s => s.category === 'women');

            if (allMen) newCategory = 'men';
            else if (allWomen) newCategory = 'women';
            else newCategory = 'unisex';
        }

        setFormData({
            ...formData,
            included_services: newIncluded,
            duration_minutes: totalDuration.toString(),
            compare_at_price: totalPrice.toString(),
            category: newCategory,
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadServiceImage(file);
        if (url) {
            setFormData({ ...formData, image_url: url });
            showToast('success', 'Image uploaded successfully');
        } else {
            showToast('error', 'Failed to upload image.');
        }
        setUploading(false);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const serviceData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
            duration_minutes: parseInt(formData.duration_minutes),
            category: formData.category,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            is_combo: formData.is_combo,
            is_featured: formData.is_featured,
            offer_end_at: formData.offer_end_at || null,
            included_services: formData.included_services,
        };

        if (editingId) {
            const success = await updateService(editingId, serviceData);
            if (success) {
                setServices(services.map(s =>
                    s.id === editingId ? { ...s, ...serviceData, id: editingId } as Service : s
                ));
                showToast('success', 'Service updated successfully');
            } else {
                showToast('error', 'Failed to update service');
            }
        } else {
            const success = await createService(serviceData);
            if (success) {
                loadServices();
                showToast('success', 'Service created successfully');
            } else {
                showToast('error', 'Failed to create service');
            }
        }

        setSaving(false);
        setShowModal(false);
    }

    const calculateSavings = () => {
        const price = parseFloat(formData.price) || 0;
        const compareAt = parseFloat(formData.compare_at_price) || 0;
        if (compareAt > price) {
            const diff = compareAt - price;
            const percent = Math.round((diff / compareAt) * 100);
            return { diff, percent };
        }
        return null;
    };

    const savings = calculateSavings();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services', active: true },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

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
                <header className="sticky top-0 z-30 glass border-b border-[var(--card-border)]">
                    <div className="px-4 py-3 max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Link href="/admin" className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-lg transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <h1 className="text-xl sm:text-2xl font-bold">Manage Services</h1>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-gold" title="Refresh">
                                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                                {canManage && (
                                    <div className="flex gap-2 flex-1 sm:flex-initial">
                                        <button onClick={() => openAddModal(false)} className="btn-secondary flex-1 sm:flex-initial px-3 py-2 flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                                            <Plus className="w-4 h-4" /> Service
                                        </button>
                                        <button onClick={() => openAddModal(true)} className="btn-primary flex-1 sm:flex-initial px-3 py-2 flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                                            <Sparkles className="w-4 h-4" /> Create Combo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex w-full">
                    {/* Sidebar */}
                    <aside className="hidden md:block w-56 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active ? 'bg-gold/10 text-gold' : 'hover:bg-beige-100 dark:hover:bg-velvet-dark text-[var(--muted)]'}`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 pb-24 md:pb-8">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-10"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value as ServiceCategory | 'all')}
                                className="input-field w-auto"
                            >
                                <option value="all">All Categories</option>
                                <option value="combo">Combos & Offers</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                                <option value="unisex">Unisex</option>
                            </select>
                        </div>

                        {/* Services Grid */}
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            {filteredServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white dark:bg-velvet-dark rounded-xl border p-3 hover:shadow-lg transition-shadow ${service.is_combo
                                        ? 'border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10'
                                        : 'border-beige-200 dark:border-velvet-gray'} ${!service.is_active ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        {/* Service Image/Icon */}
                                        <div className="w-14 h-14 rounded-lg bg-gold/10 overflow-hidden flex items-center justify-center flex-shrink-0 border border-beige-200 dark:border-velvet-gray">
                                            {service.image_url ? (
                                                <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl">{service.is_combo ? '🎁' : '✂️'}</span>
                                            )}
                                        </div>

                                        {/* Service Details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Title and Category */}
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                                    {service.name}
                                                    {service.is_featured && <Sparkles className="w-3 h-3 text-gold fill-gold" />}
                                                </h3>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize whitespace-nowrap ${service.category === 'combo' ? 'bg-purple-500/10 text-purple-600' :
                                                    service.category === 'men' ? 'bg-blue-500/10 text-blue-600' :
                                                        service.category === 'women' ? 'bg-pink-500/10 text-pink-600' :
                                                            'bg-green-500/10 text-green-600'
                                                    }`}>
                                                    {service.category}
                                                </span>
                                            </div>

                                            {/* Price, Duration, Offer */}
                                            <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-velvet-rose">{formatPrice(service.price)}</span>
                                                    {service.compare_at_price && service.compare_at_price > service.price && (
                                                        <>
                                                            <span className="text-[10px] text-[var(--muted)] line-through">{formatPrice(service.compare_at_price)}</span>
                                                            <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-1 py-0.5 rounded">
                                                                {Math.round(((service.compare_at_price - service.price) / service.compare_at_price) * 100)}% OFF
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <span className="text-[var(--muted)] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDuration(service.duration_minutes)}
                                                </span>
                                                {service.offer_end_at && (
                                                    <span className="text-red-500 text-[10px] flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded">
                                                        <Timer className="w-3 h-3" />
                                                        Exp: {new Date(service.offer_end_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {canManage && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleToggleActive(service.id, service.is_active)}
                                                        className={`p-1.5 rounded-lg transition-colors ${service.is_active ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'}`}
                                                        title={service.is_active ? 'Active' : 'Inactive'}
                                                    >
                                                        {service.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>
                                                    <div className="h-4 w-px bg-beige-200 dark:bg-velvet-gray" />
                                                    <button
                                                        onClick={() => openEditModal(service)}
                                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(service.id)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <Link
                                                        href={`/book?service=${service.id}`}
                                                        className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-600 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                    <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-2 min-w-[60px] ${item.active ? 'text-gold' : 'text-[var(--muted)]'}`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[9px] font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Add/Edit Service Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="w-full max-w-2xl bg-white dark:bg-velvet-dark rounded-2xl p-4 sm:p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                                        {formData.is_combo ? <Sparkles className="w-5 h-5 text-purple-500" /> : <Scissors className="w-5 h-5" />}
                                        {editingId ? 'Edit' : 'Create'} {formData.is_combo ? 'Combo Offer' : 'Service'}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Left Column: Details */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                    className="input-field"
                                                    placeholder={formData.is_combo ? "e.g. Summer Glow Package" : "e.g. Haircut"}
                                                />
                                            </div>

                                            {/* Description - Hidden for all services */}
                                            {false && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Description</label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        rows={3}
                                                        className="input-field resize-none"
                                                        placeholder="Brief description..."
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Offer Price</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                                        <input
                                                            type="number"
                                                            value={formData.price}
                                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                            required
                                                            min="0"
                                                            className="input-field pl-9 font-bold text-green-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Original Price</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                                        <input
                                                            type="number"
                                                            value={formData.compare_at_price}
                                                            onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                                                            min="0"
                                                            className="input-field pl-9 text-[var(--muted)]"
                                                            readOnly={formData.is_combo} // Auto-calc for combos
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {savings && (
                                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-2 rounded-lg text-sm flex items-center justify-center gap-2">
                                                    <Tag className="w-4 h-4" />
                                                    <span>User saves <b>{formatPrice(savings.diff)}</b> ({savings.percent}% OFF)</span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Duration (min)</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                                        <input
                                                            type="number"
                                                            value={formData.duration_minutes}
                                                            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                                            required
                                                            min="5"
                                                            step="5"
                                                            className="input-field pl-9"
                                                            readOnly={formData.is_combo} // Auto-calc for combos
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">
                                                        Category {formData.is_combo && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={formData.category}
                                                        onChange={(e) => {
                                                            const newCategory = e.target.value as ServiceCategory;
                                                            // If changing category for combo with services, warn user
                                                            if (formData.is_combo && formData.included_services.length > 0) {
                                                                if (confirm('Changing category will clear all selected services. Continue?')) {
                                                                    setFormData({ ...formData, category: newCategory, included_services: [] });
                                                                }
                                                            } else {
                                                                setFormData({ ...formData, category: newCategory });
                                                            }
                                                        }}
                                                        className="input-field"
                                                        required={formData.is_combo}
                                                    >
                                                        <option value="men">Men</option>
                                                        <option value="women">Women</option>
                                                        <option value="unisex">Unisex</option>
                                                    </select>
                                                    {formData.is_combo && (
                                                        <p className="text-[10px] text-[var(--muted)] mt-1">
                                                            ⚠️ Select category first, then add services
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Offer Expires (Optional)</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.offer_end_at}
                                                    onChange={(e) => setFormData({ ...formData, offer_end_at: e.target.value })}
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column: Combo Builder & Config */}
                                        <div className="space-y-4">
                                            {formData.is_combo && (
                                                <div className="bg-beige-50 dark:bg-velvet-gray/50 p-4 rounded-xl border border-beige-200 dark:border-velvet-gray h-[300px] flex flex-col">
                                                    <h3 className="font-medium mb-2 text-sm flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            Include Services
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 capitalize font-bold">
                                                                {formData.category} only
                                                            </span>
                                                        </span>
                                                        <span className="text-[var(--muted)] text-xs">{formData.included_services.length} selected</span>
                                                    </h3>
                                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                        {services
                                                            .filter(s => !s.is_combo && s.is_active && s.category === formData.category)
                                                            .map(service => {
                                                                const isSelected = formData.included_services.some(s => s.id === service.id);
                                                                return (
                                                                    <div
                                                                        key={service.id}
                                                                        onClick={() => toggleServiceInCombo(service)}
                                                                        className={`p-2 rounded-lg border cursor-pointer transition-all ${isSelected
                                                                            ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700'
                                                                            : 'bg-white dark:bg-velvet-dark border-transparent hover:border-beige-300 dark:hover:border-gray-600'}`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-medium">{service.name}</span>
                                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                                                        </div>
                                                                        <div className="text-xs text-[var(--muted)] flex justify-between mt-1">
                                                                            <span>{formatPrice(service.price)}</span>
                                                                            <span>{formatDuration(service.duration_minutes)}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        {services.filter(s => !s.is_combo && s.is_active && s.category === formData.category).length === 0 && (
                                                            <div className="text-center text-sm text-[var(--muted)] py-8">
                                                                <p className="font-medium">No {formData.category} services available</p>
                                                                <p className="text-xs mt-1">Create {formData.category} services first</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Image</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gold/10 overflow-hidden flex items-center justify-center flex-shrink-0 border border-beige-200 dark:border-velvet-gray">
                                                        {formData.image_url ? (
                                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Scissors className="w-6 h-6 text-gold" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="btn-secondary text-sm py-2 cursor-pointer inline-flex items-center gap-2 w-full justify-center">
                                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                            {formData.image_url ? 'Change' : 'Upload'}
                                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`} />
                                                    </div>
                                                    <span className="text-sm">Active (visible to customers)</span>
                                                </div>

                                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}>
                                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.is_featured ? 'bg-gold' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_featured ? 'translate-x-4' : ''}`} />
                                                    </div>
                                                    <span className="text-sm">Feature on Home Page</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={saving} className="flex-1 btn-primary">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save {formData.is_combo ? 'Combo' : 'Service'}</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AuthGuard>
    );
}
