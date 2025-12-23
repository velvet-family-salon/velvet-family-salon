'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, MessageSquare, Settings,
    X, Save, IndianRupee, Clock
} from 'lucide-react';
import { getAllServices, updateService, deleteService, createService, uploadServiceImage } from '@/lib/db';
import { Service, ServiceCategory } from '@/lib/types';
import { formatPrice, formatDuration } from '@/lib/utils';

export default function AdminServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<ServiceCategory | 'all'>('all');

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
        duration_minutes: '30',
        category: 'unisex' as ServiceCategory,
        image_url: '',
        is_active: true,
    });

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isLoggedIn) {
            router.push('/admin');
            return;
        }
        loadServices();
    }, [router]);

    async function loadServices() {
        setLoading(true);
        const data = await getAllServices();
        setServices(data);
        setLoading(false);
    }

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
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this service?')) {
            const success = await deleteService(id);
            if (success) {
                setServices(services.filter(s => s.id !== id));
            }
        }
    };

    function openAddModal() {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            duration_minutes: '30',
            category: 'unisex',
            image_url: '',
            is_active: true,
        });
        setShowModal(true);
    }

    function openEditModal(service: Service) {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price.toString(),
            duration_minutes: service.duration_minutes.toString(),
            category: service.category,
            image_url: service.image_url || '',
            is_active: service.is_active,
        });
        setShowModal(true);
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadServiceImage(file);
        if (url) {
            setFormData({ ...formData, image_url: url });
        } else {
            alert('Failed to upload image. Please ensure you have created a "service-images" bucket in Supabase and set its policy to public.');
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
            duration_minutes: parseInt(formData.duration_minutes),
            category: formData.category,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
        };

        if (editingId) {
            const success = await updateService(editingId, serviceData);
            if (success) {
                setServices(services.map(s =>
                    s.id === editingId ? { ...s, ...serviceData } : s
                ));
            }
        } else {
            const success = await createService(serviceData);
            if (success) {
                loadServices();
            }
        }

        setSaving(false);
        setShowModal(false);
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services', active: true },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="font-display text-xl font-semibold">Manage Services</h1>
                    </div>
                    <button onClick={openAddModal} className="btn-primary text-sm py-2">
                        <Plus className="w-4 h-4" />
                        Add Service
                    </button>
                </div>
            </header>

            <div className="flex max-w-6xl mx-auto">
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
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="unisex">Unisex</option>
                        </select>
                    </div>

                    {/* Summary */}
                    <div className="flex gap-4 mb-6">
                        <div className="bg-gold/10 text-gold px-4 py-2 rounded-xl">
                            <span className="font-bold">{services.length}</span> Total
                        </div>
                        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-xl">
                            <span className="font-bold">{services.filter(s => s.is_active).length}</span> Active
                        </div>
                        <div className="bg-gray-500/10 text-gray-600 px-4 py-2 rounded-xl">
                            <span className="font-bold">{services.filter(s => !s.is_active).length}</span> Inactive
                        </div>
                    </div>

                    {/* Services Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredServices.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4 ${!service.is_active ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gold/10 overflow-hidden flex items-center justify-center flex-shrink-0 border border-beige-200 dark:border-velvet-gray relative">
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
                                                    <span className="text-2xl">✂️</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-2xl">✂️</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold">{service.name}</h3>
                                                <p className="text-sm text-[var(--muted)] line-clamp-2">{service.description}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${service.category === 'men' ? 'bg-blue-500/10 text-blue-600' :
                                                service.category === 'women' ? 'bg-pink-500/10 text-pink-600' :
                                                    'bg-purple-500/10 text-purple-600'
                                                }`}>
                                                {service.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 text-sm">
                                            <span className="font-bold text-gold">{formatPrice(service.price)}</span>
                                            <span className="text-[var(--muted)]">{formatDuration(service.duration_minutes)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                    <button
                                        onClick={() => handleToggleActive(service.id, service.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${service.is_active
                                            ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                            : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                                            }`}
                                        title={service.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {service.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(service)}
                                        className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredServices.length === 0 && (
                        <div className="text-center py-12 text-[var(--muted)]">
                            No services found
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.slice(0, 4).map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-4 py-2 ${item.active ? 'text-gold' : 'text-[var(--muted)]'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-white dark:bg-velvet-dark rounded-2xl p-6 shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-lg font-semibold">
                                    {editingId ? 'Edit Service' : 'Add Service'}
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
                                    <label className="block text-sm font-medium mb-1">Service Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="input-field"
                                        placeholder="Haircut, Facial, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="input-field resize-none"
                                        placeholder="Brief description of the service"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                required
                                                min="0"
                                                className="input-field pl-9"
                                                placeholder="500"
                                            />
                                        </div>
                                    </div>
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
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                                        className="input-field"
                                    >
                                        <option value="men">Men</option>
                                        <option value="women">Women</option>
                                        <option value="unisex">Unisex</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Service Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-gold/10 overflow-hidden flex items-center justify-center flex-shrink-0 border border-beige-200 dark:border-velvet-gray">
                                            {formData.image_url ? (
                                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Scissors className="w-6 h-6 text-gold" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className="btn-secondary text-sm py-2 cursor-pointer inline-flex items-center gap-2"
                                            >
                                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                {formData.image_url ? 'Change Image' : 'Upload Image'}
                                            </label>
                                            <p className="text-[10px] text-[var(--muted)] mt-1">
                                                Recommended: Square or 16:9 ratio. Max 5MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <label htmlFor="is_active" className="text-sm">Active (visible to customers)</label>
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
