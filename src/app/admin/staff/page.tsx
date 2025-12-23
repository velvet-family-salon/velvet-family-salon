'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, MessageSquare, Settings,
    X, Save, Camera
} from 'lucide-react';
import { getAllStaff, updateStaff, deleteStaff, createStaff, uploadStaffImage } from '@/lib/db';
import { Staff } from '@/lib/types';

export default function AdminStaffPage() {
    const router = useRouter();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        is_active: true,
        working_hours: {
            monday: { start: '09:00', end: '21:00', isOff: false },
            tuesday: { start: '09:00', end: '21:00', isOff: false },
            wednesday: { start: '09:00', end: '21:00', isOff: false },
            thursday: { start: '09:00', end: '21:00', isOff: false },
            friday: { start: '09:00', end: '21:00', isOff: false },
            saturday: { start: '09:00', end: '21:00', isOff: false },
            sunday: { start: '09:00', end: '21:00', isOff: true },
        } as Record<string, { start: string; end: string; isOff: boolean }>,
        avatar_url: '',
    });

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isLoggedIn) {
            router.push('/admin');
            return;
        }
        loadStaff();
    }, [router]);

    async function loadStaff() {
        setLoading(true);
        const data = await getAllStaff();
        setStaff(data);
        setLoading(false);
    }

    const filteredStaff = staff
        .filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            // Sort active first, then by name
            if (a.is_active === b.is_active) return a.name.localeCompare(b.name);
            return a.is_active ? -1 : 1;
        });

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const success = await updateStaff(id, { is_active: !currentStatus });
        if (success) {
            setStaff(staff.map(s =>
                s.id === id ? { ...s, is_active: !currentStatus } : s
            ));
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            const success = await deleteStaff(id);
            if (success) {
                setStaff(staff.filter(s => s.id !== id));
            }
        }
    };

    function openAddModal() {
        setEditingId(null);
        setFormData({
            name: '',
            role: '',
            is_active: true,
            working_hours: {
                monday: { start: '09:00', end: '21:00', isOff: false },
                tuesday: { start: '09:00', end: '21:00', isOff: false },
                wednesday: { start: '09:00', end: '21:00', isOff: false },
                thursday: { start: '09:00', end: '21:00', isOff: false },
                friday: { start: '09:00', end: '21:00', isOff: false },
                saturday: { start: '09:00', end: '21:00', isOff: false },
                sunday: { start: '09:00', end: '21:00', isOff: true },
            },
            avatar_url: '',
        });
        setShowModal(true);
    }

    function openEditModal(member: Staff) {
        setEditingId(member.id);
        setFormData({
            name: member.name,
            role: member.role,
            is_active: member.is_active,
            working_hours: member.working_hours || {
                monday: { start: '09:00', end: '21:00', isOff: false },
                tuesday: { start: '09:00', end: '21:00', isOff: false },
                wednesday: { start: '09:00', end: '21:00', isOff: false },
                thursday: { start: '09:00', end: '21:00', isOff: false },
                friday: { start: '09:00', end: '21:00', isOff: false },
                saturday: { start: '09:00', end: '21:00', isOff: false },
                sunday: { start: '09:00', end: '21:00', isOff: true },
            },
            avatar_url: member.avatar_url || '',
        });
        setShowModal(true);
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadStaffImage(file);
        if (url) {
            setFormData({ ...formData, avatar_url: url });
        } else {
            alert('Failed to upload image. Please check Supabase storage settings.');
        }
        setUploading(false);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const staffData = {
            name: formData.name,
            role: formData.role,
            is_active: formData.is_active,
            working_hours: formData.working_hours,
            avatar_url: formData.avatar_url || null,
        };

        if (editingId) {
            const success = await updateStaff(editingId, staffData);
            if (success) {
                setStaff(staff.map(s =>
                    s.id === editingId ? { ...s, ...staffData } : s
                ));
            }
        } else {
            const success = await createStaff(staffData);
            if (success) {
                loadStaff();
            }
        }

        setSaving(false);
        setShowModal(false);
    }

    function toggleWorkingDay(day: string) {
        setFormData({
            ...formData,
            working_hours: {
                ...formData.working_hours,
                [day]: {
                    ...formData.working_hours[day],
                    isOff: !formData.working_hours[day].isOff,
                },
            },
        });
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff', active: true },
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
                        <h1 className="font-display text-xl font-semibold">Manage Staff</h1>
                    </div>
                    <button onClick={openAddModal} className="btn-primary text-sm py-2">
                        <Plus className="w-4 h-4" />
                        Add Staff
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
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    {/* Summary */}
                    <div className="flex gap-4 mb-6">
                        <div className="bg-gold/10 text-gold px-4 py-2 rounded-xl">
                            <span className="font-bold">{staff.length}</span> Total Staff
                        </div>
                        <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-xl">
                            <span className="font-bold">{staff.filter(s => s.is_active).length}</span> Available
                        </div>
                    </div>

                    {/* Staff Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredStaff.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white dark:bg-velvet-dark rounded-2xl border-2 ${member.is_active ? 'border-green-200 dark:border-green-900' : 'border-beige-200 dark:border-velvet-gray'} p-5 shadow-sm hover:shadow-md transition-shadow ${!member.is_active ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-velvet-rose/20 to-gold/20 flex items-center justify-center overflow-hidden border-3 border-white dark:border-velvet-dark shadow-lg">
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={member.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-4xl">👤</span>
                                            )}
                                        </div>
                                        {member.is_active && (
                                            <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-velvet-dark" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{member.name}</h3>
                                        <p className="text-sm text-velvet-rose font-medium">{member.role}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${member.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {member.is_active ? '✓ Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>

                                {/* Working Hours */}
                                {member.working_hours && typeof member.working_hours === 'object' && (
                                    <div className="mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                        <p className="text-xs text-[var(--muted)] mb-2">Working Days</p>
                                        <div className="flex gap-1">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                                const dayKey = day.toLowerCase();
                                                const dayData = member.working_hours?.[dayKey];
                                                const isWorking = dayData && !dayData.isOff;
                                                return (
                                                    <span
                                                        key={day}
                                                        className={`w-8 h-6 rounded text-[10px] font-medium flex items-center justify-center ${isWorking
                                                            ? 'bg-gold/20 text-gold'
                                                            : 'bg-gray-100 dark:bg-velvet-gray text-gray-400 dark:text-gray-600'
                                                            }`}
                                                    >
                                                        {day}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                    <button
                                        onClick={() => handleToggleActive(member.id, member.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${member.is_active
                                            ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                            : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                                            }`}
                                        title={member.is_active ? 'Set Unavailable' : 'Set Available'}
                                    >
                                        {member.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(member)}
                                        className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredStaff.length === 0 && (
                        <div className="text-center py-12 text-[var(--muted)]">
                            No staff found
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-4 py-2 ${item.active ? 'text-gold' : 'text-[var(--muted)]'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Add/Edit Staff Modal */}
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
                            className="bg-white dark:bg-velvet-dark rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-beige-200 dark:border-velvet-gray">
                                <h2 className="font-display text-lg font-semibold">
                                    {editingId ? 'Edit Staff' : 'Add Staff'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Profile Picture */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-velvet-rose/20 to-gold/20 flex items-center justify-center overflow-hidden border-4 border-beige-100 dark:border-velvet-gray shadow-lg">
                                            {formData.avatar_url ? (
                                                <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-4xl">👤</span>
                                            )}
                                        </div>
                                        <label
                                            htmlFor="avatar-upload"
                                            className="absolute bottom-0 right-0 p-2 bg-velvet-rose text-white rounded-full cursor-pointer shadow-lg hover:bg-velvet-rose/90 transition-colors"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--muted)]">Click the camera to upload a photo</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        required
                                        placeholder="e.g., John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Role *</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="input-field"
                                        required
                                        placeholder="e.g., Senior Stylist"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Working Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleWorkingDay(day)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!formData.working_hours[day]?.isOff
                                                    ? 'bg-gold/20 text-gold border border-gold/30'
                                                    : 'bg-gray-100 dark:bg-velvet-gray text-gray-500 border border-transparent'
                                                    }`}
                                            >
                                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`p-2 rounded-lg transition-colors ${formData.is_active
                                            ? 'bg-green-500/10 text-green-600'
                                            : 'bg-gray-500/10 text-gray-500'
                                            }`}
                                    >
                                        {formData.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <span className="text-sm">
                                        {formData.is_active ? 'Available for bookings' : 'Unavailable'}
                                    </span>
                                </div>

                                <div className="flex gap-3 pt-4">
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
                                                {editingId ? 'Update' : 'Add Staff'}
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
