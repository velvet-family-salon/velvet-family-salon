// Permission keys for admin users
export type PermissionKey =
    | 'view_dashboard'
    | 'view_bookings'
    | 'manage_bookings'
    | 'view_services'
    | 'manage_services'
    | 'view_staff'
    | 'manage_staff'
    | 'view_testimonials'
    | 'manage_testimonials'
    | 'view_reviews'
    | 'manage_reviews'
    | 'view_users'
    | 'manage_users';

export interface Permissions {
    view_dashboard: boolean;
    view_bookings: boolean;
    manage_bookings: boolean;
    view_services: boolean;
    manage_services: boolean;
    view_staff: boolean;
    manage_staff: boolean;
    view_testimonials: boolean;
    manage_testimonials: boolean;
    view_reviews: boolean;
    manage_reviews: boolean;
    view_users: boolean;
    manage_users: boolean;
}

// Default permissions for new users
export const DEFAULT_PERMISSIONS: Permissions = {
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
};

// All permissions (for super admin)
export const ALL_PERMISSIONS: Permissions = {
    view_dashboard: true,
    view_bookings: true,
    manage_bookings: true,
    view_services: true,
    manage_services: true,
    view_staff: true,
    manage_staff: true,
    view_testimonials: true,
    manage_testimonials: true,
    view_reviews: true,
    manage_reviews: true,
    view_users: true,
    manage_users: true,
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = [
    {
        name: 'Dashboard',
        icon: 'LayoutDashboard',
        permissions: [
            { key: 'view_dashboard' as PermissionKey, label: 'View Dashboard' },
        ],
    },
    {
        name: 'Bookings',
        icon: 'Calendar',
        permissions: [
            { key: 'view_bookings' as PermissionKey, label: 'View Bookings' },
            { key: 'manage_bookings' as PermissionKey, label: 'Manage Bookings (accept/reject/cancel)' },
        ],
    },
    {
        name: 'Services',
        icon: 'Scissors',
        permissions: [
            { key: 'view_services' as PermissionKey, label: 'View Services' },
            { key: 'manage_services' as PermissionKey, label: 'Manage Services (add/edit/delete)' },
        ],
    },
    {
        name: 'Staff',
        icon: 'Users',
        permissions: [
            { key: 'view_staff' as PermissionKey, label: 'View Staff' },
            { key: 'manage_staff' as PermissionKey, label: 'Manage Staff (add/edit/delete)' },
        ],
    },
    {
        name: 'Testimonials',
        icon: 'MessageSquare',
        permissions: [
            { key: 'view_testimonials' as PermissionKey, label: 'View Testimonials' },
            { key: 'manage_testimonials' as PermissionKey, label: 'Manage Testimonials (approve/reject)' },
        ],
    },
    {
        name: 'Reviews Config',
        icon: 'Settings',
        permissions: [
            { key: 'view_reviews' as PermissionKey, label: 'View Reviews Config' },
            { key: 'manage_reviews' as PermissionKey, label: 'Manage Reviews Config' },
        ],
    },
    {
        name: 'Admin Users',
        icon: 'Shield',
        permissions: [
            { key: 'view_users' as PermissionKey, label: 'View Admin Users' },
            { key: 'manage_users' as PermissionKey, label: 'Manage Users (invite/deactivate)', superAdminOnly: true },
        ],
    },
];
