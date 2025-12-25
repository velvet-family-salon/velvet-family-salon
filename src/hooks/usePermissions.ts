'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PermissionKey, Permissions, ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from '@/types/permissions';

interface UsePermissionsReturn {
    permissions: Permissions | null;
    loading: boolean;
    isSuperAdmin: boolean;
    hasPermission: (key: PermissionKey) => boolean;
    refresh: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadPermissions = useCallback(async () => {
        if (!user) {
            setPermissions(null);
            setIsSuperAdmin(false);
            setLoading(false);
            return;
        }

        const supabase = createClient();

        const { data, error } = await supabase
            .from('admin_users')
            .select('role, permissions')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            console.error('Error loading permissions:', error);
            setPermissions(DEFAULT_PERMISSIONS);
            setIsSuperAdmin(false);
        } else {
            const isSuperAdminUser = data.role === 'super_admin';
            setIsSuperAdmin(isSuperAdminUser);

            // Super admin always has all permissions
            if (isSuperAdminUser) {
                setPermissions(ALL_PERMISSIONS);
            } else {
                // Merge stored permissions with defaults (in case new permissions are added)
                setPermissions({
                    ...DEFAULT_PERMISSIONS,
                    ...(data.permissions as Permissions || {}),
                });
            }
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const hasPermission = useCallback((key: PermissionKey): boolean => {
        // Super admin always has all permissions
        if (isSuperAdmin) return true;

        // Check specific permission
        if (!permissions) return false;
        return permissions[key] === true;
    }, [permissions, isSuperAdmin]);

    return {
        permissions,
        loading,
        isSuperAdmin,
        hasPermission,
        refresh: loadPermissions,
    };
}
