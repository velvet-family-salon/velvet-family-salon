'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Calendar, Scissors, Users, MessageSquare, Settings,
    UserPlus, Shield, ShieldCheck, User, Loader2, MoreVertical,
    CheckCircle, XCircle, Trash2, Mail, KeyRound
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { PermissionsModal } from '@/components/admin/PermissionsModal';
import { Permissions } from '@/types/permissions';

interface AdminUser {
    id: string;
    user_id: string;
    email: string;
    name: string | null;
    role: 'super_admin' | 'admin' | 'staff';
    created_at: string;
    is_active: boolean;
    permissions: Permissions | null;
}

export default function AdminUsersPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [permissionsModalUser, setPermissionsModalUser] = useState<AdminUser | null>(null);

    // Form state for adding new user
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('admin');
    const [inviting, setInviting] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users', active: true },
    ];

    const loadUsers = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        // Get current user's role
        if (user) {
            const { data: currentAdmin } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (currentAdmin) {
                setCurrentUserRole(currentAdmin.role);
            }
        }

        // Get all admin users
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading users:', error);
            showToast('error', 'Failed to load users');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }, [user, showToast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUserEmail,
                    name: newUserName,
                    role: newUserRole,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to invite user');
            }

            showToast('success', 'Invitation sent successfully');
            setShowAddModal(false);
            setNewUserEmail('');
            setNewUserName('');
            setNewUserRole('admin');
            loadUsers();
        } catch (error) {
            showToast('error', error instanceof Error ? error.message : 'Failed to invite user');
        }

        setInviting(false);
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('admin_users')
            .update({ is_active: !currentStatus })
            .eq('id', userId);

        if (error) {
            showToast('error', 'Failed to update user status');
        } else {
            showToast('success', `User ${!currentStatus ? 'activated' : 'deactivated'}`);
            loadUsers();
        }
        setActionMenuOpen(null);
    };

    const deleteUser = async (userId: string, authUserId: string) => {
        if (!confirm('Are you sure you want to delete this user? This will permanently remove them from the system.')) return;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, authUserId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            showToast('success', 'User deleted successfully');
            loadUsers();
        } catch (error) {
            console.error('Delete user error:', error);
            showToast('error', error instanceof Error ? error.message : 'Failed to delete user');
        }
        setActionMenuOpen(null);
    };

    const handleSavePermissions = async (userId: string, permissions: Permissions) => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, permissions }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update permissions');
            }

            showToast('success', 'Permissions updated successfully');
            loadUsers();
        } catch (error) {
            showToast('error', error instanceof Error ? error.message : 'Failed to update permissions');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <ShieldCheck className="w-4 h-4 text-gold" />;
            case 'admin':
                return <Shield className="w-4 h-4 text-blue-500" />;
            default:
                return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'Super Admin';
            case 'admin':
                return 'Admin';
            default:
                return 'Staff';
        }
    };

    const isSuperAdmin = currentUserRole === 'super_admin';

    if (loading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
                {/* Header */}
                <header className="bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray sticky top-0 z-30">
                    <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between">
                        <h1 className="font-display text-xl font-semibold">Admin Users</h1>
                        {isSuperAdmin && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary text-sm py-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invite User
                            </button>
                        )}
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
                        {/* Info Banner for non-super admins */}
                        {!isSuperAdmin && (
                            <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Only Super Admins can invite or manage users.
                                </p>
                            </div>
                        )}

                        {/* Users List */}
                        <div className="space-y-3">
                            {users.length === 0 ? (
                                <div className="text-center py-12 text-[var(--muted)]">
                                    No admin users found
                                </div>
                            ) : (
                                users.map((adminUser) => (
                                    <motion.div
                                        key={adminUser.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${adminUser.is_active
                                                    ? 'bg-gold/10'
                                                    : 'bg-gray-200 dark:bg-velvet-gray'
                                                    }`}>
                                                    {getRoleIcon(adminUser.role)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {adminUser.name || 'Unnamed'}
                                                        </span>
                                                        {!adminUser.is_active && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                                        <Mail className="w-3 h-3" />
                                                        {adminUser.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs px-2 py-1 rounded-lg ${adminUser.role === 'super_admin'
                                                    ? 'bg-gold/10 text-gold'
                                                    : adminUser.role === 'admin'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-gray-100 dark:bg-velvet-gray text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                    {getRoleLabel(adminUser.role)}
                                                </span>

                                                {isSuperAdmin && adminUser.user_id !== user?.id && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setActionMenuOpen(
                                                                actionMenuOpen === adminUser.id ? null : adminUser.id
                                                            )}
                                                            className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-lg"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {actionMenuOpen === adminUser.id && (
                                                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-velvet-dark rounded-xl shadow-lg border border-beige-200 dark:border-velvet-gray py-1 z-10">
                                                                <button
                                                                    onClick={() => toggleUserStatus(adminUser.id, adminUser.is_active)}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-beige-50 dark:hover:bg-velvet-gray"
                                                                >
                                                                    {adminUser.is_active ? (
                                                                        <>
                                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                                            Deactivate
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                                            Activate
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setPermissionsModalUser(adminUser);
                                                                        setActionMenuOpen(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-beige-50 dark:hover:bg-velvet-gray"
                                                                >
                                                                    <KeyRound className="w-4 h-4 text-gold" />
                                                                    Edit Permissions
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteUser(adminUser.id, adminUser.user_id)}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-beige-50 dark:hover:bg-velvet-gray"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                    <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
                        {navItems.slice(0, 6).map((item) => {
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

                {/* Invite User Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white dark:bg-velvet-dark rounded-2xl shadow-xl"
                        >
                            <div className="p-6 border-b border-beige-200 dark:border-velvet-gray">
                                <h2 className="font-display text-xl font-semibold">Invite Admin User</h2>
                                <p className="text-sm text-[var(--muted)] mt-1">
                                    Send an invitation email to add a new admin
                                </p>
                            </div>

                            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                        className="input-field"
                                        placeholder="user@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="input-field"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Role *</label>
                                    <select
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')}
                                        className="input-field"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-beige-200 dark:border-velvet-gray hover:bg-beige-50 dark:hover:bg-velvet-gray transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="flex-1 btn-primary"
                                    >
                                        {inviting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Send Invitation'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Permissions Modal */}
                {permissionsModalUser && (
                    <PermissionsModal
                        isOpen={!!permissionsModalUser}
                        onClose={() => setPermissionsModalUser(null)}
                        user={permissionsModalUser}
                        onSave={handleSavePermissions}
                        isSuperAdminViewer={isSuperAdmin}
                    />
                )}
            </div>
        </AuthGuard>
    );
}
