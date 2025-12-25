'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Loader2, Save, Lock,
    LayoutDashboard, Calendar, Scissors, Users,
    MessageSquare, Settings, Shield
} from 'lucide-react';
import { Permissions, PermissionKey, PERMISSION_CATEGORIES } from '@/types/permissions';

// Icon map for category icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Calendar,
    Scissors,
    Users,
    MessageSquare,
    Settings,
    Shield,
};

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    permissions: Permissions | null;
}

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser;
    onSave: (userId: string, permissions: Permissions) => Promise<void>;
    isSuperAdminViewer: boolean;
}

export function PermissionsModal({
    isOpen,
    onClose,
    user,
    onSave,
    isSuperAdminViewer
}: PermissionsModalProps) {
    const [permissions, setPermissions] = useState<Permissions>(() => ({
        view_dashboard: true,
        view_bookings: true,
        manage_bookings: false,
        view_services: true,
        manage_services: false,
        view_staff: true,
        manage_staff: false,
        view_testimonials: true,
        manage_testimonials: false,
        view_reviews: true,
        manage_reviews: false,
        view_users: false,
        manage_users: false,
        ...(user.permissions || {}),
    }));
    const [saving, setSaving] = useState(false);

    const handleToggle = (key: PermissionKey) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(user.id, permissions);
        setSaving(false);
        onClose();
    };

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName];
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
    };

    const isUserSuperAdmin = user.role === 'super_admin';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-lg bg-white dark:bg-velvet-dark rounded-2xl shadow-xl my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-beige-200 dark:border-velvet-gray">
                            <div>
                                <h2 className="font-display text-xl font-semibold">
                                    Edit Permissions
                                </h2>
                                <p className="text-sm text-[var(--muted)] mt-1">
                                    {user.name || user.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-1 rounded-lg ${user.role === 'super_admin'
                                    ? 'bg-gold/10 text-gold'
                                    : user.role === 'admin'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'bg-gray-100 dark:bg-velvet-gray text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Staff'}
                                </span>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                            {isUserSuperAdmin ? (
                                <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                                    <p className="text-sm text-gold">
                                        Super Admins have all permissions by default and cannot be modified.
                                    </p>
                                </div>
                            ) : (
                                PERMISSION_CATEGORIES.map((category) => (
                                    <div key={category.name}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-gold">
                                                {getIcon(category.icon)}
                                            </span>
                                            <h3 className="font-medium text-sm uppercase tracking-wide text-[var(--muted)]">
                                                {category.name}
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            {category.permissions.map((permission) => {
                                                const isSuperAdminOnly = 'superAdminOnly' in permission && permission.superAdminOnly;
                                                const isDisabled = isSuperAdminOnly && !isSuperAdminViewer;

                                                return (
                                                    <label
                                                        key={permission.key}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDisabled
                                                            ? 'bg-gray-100 dark:bg-velvet-gray/50 border-gray-200 dark:border-velvet-gray cursor-not-allowed opacity-60'
                                                            : 'bg-beige-50 dark:bg-velvet-black/50 border-beige-200 dark:border-velvet-gray hover:border-gold/50 cursor-pointer'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isSuperAdminOnly && (
                                                                <Lock className="w-4 h-4 text-[var(--muted)]" />
                                                            )}
                                                            <span className="text-sm">
                                                                {permission.label}
                                                            </span>
                                                        </div>

                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={permissions[permission.key]}
                                                                onChange={() => handleToggle(permission.key)}
                                                                disabled={isDisabled}
                                                                className="sr-only peer"
                                                            />
                                                            <div className={`w-11 h-6 rounded-full transition-colors ${permissions[permission.key]
                                                                ? 'bg-gold'
                                                                : 'bg-gray-300 dark:bg-velvet-gray'
                                                                } ${isDisabled ? '' : 'peer-focus:ring-2 peer-focus:ring-gold/50'}`}>
                                                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${permissions[permission.key] ? 'translate-x-5' : 'translate-x-0'
                                                                    }`} />
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {!isUserSuperAdmin && (
                            <div className="flex gap-3 p-6 border-t border-beige-200 dark:border-velvet-gray">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-beige-200 dark:border-velvet-gray hover:bg-beige-50 dark:hover:bg-velvet-gray transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Permissions
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
