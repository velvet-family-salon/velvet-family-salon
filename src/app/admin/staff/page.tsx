'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, ArrowLeft,
    Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, MessageSquare, Settings
} from 'lucide-react';
import { getAllStaff, updateStaff, deleteStaff } from '@/lib/db';
import { Staff } from '@/lib/types';

export default function AdminStaffPage() {
    const router = useRouter();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredStaff = staff.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <button className="btn-primary text-sm py-2">
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
                                className={`bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4 ${!member.is_active ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-beige-200 to-beige-300 dark:from-velvet-dark dark:to-velvet-gray flex items-center justify-center">
                                        <span className="text-3xl">👤</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{member.name}</h3>
                                        <p className="text-sm text-[var(--muted)]">{member.role}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs mt-1 ${member.is_active ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-gray-400'
                                                }`} />
                                            {member.is_active ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>

                                {/* Working Hours */}
                                {member.working_hours && typeof member.working_hours === 'object' && (
                                    <div className="mt-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                        <p className="text-xs text-[var(--muted)] mb-2">Working Days</p>
                                        <div className="flex gap-1">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                                const isWorking = member.working_hours?.[day.toLowerCase()];
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
                                    <button className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors">
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
        </div>
    );
}
