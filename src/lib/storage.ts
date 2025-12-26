/**
 * P3 FIX: localStorage wrapper with TTL support
 * Automatically expires data after configured duration
 * No new dependencies - uses native APIs
 */

interface StorageItem<T> {
    value: T;
    expiresAt: number | null; // null = never expires
}

// Default TTL: 30 days in milliseconds
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Set an item in localStorage with optional TTL
 * @param key - Storage key
 * @param value - Value to store
 * @param ttlMs - Time to live in milliseconds (default: 30 days, null = never expires)
 */
export function setStorageItem<T>(key: string, value: T, ttlMs: number | null = DEFAULT_TTL_MS): void {
    try {
        const item: StorageItem<T> = {
            value,
            expiresAt: ttlMs ? Date.now() + ttlMs : null,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        // localStorage might be full or disabled
        console.error('Failed to save to localStorage:', error);
    }
}

/**
 * Get an item from localStorage, respecting TTL
 * Returns null if expired or not found
 */
export function getStorageItem<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const item: StorageItem<T> = JSON.parse(raw);

        // Check for old format (no wrapper) - migrate it
        if (item.expiresAt === undefined) {
            // Legacy data without TTL - return as-is but wrap for next save
            return raw as unknown as T;
        }

        // Check if expired
        if (item.expiresAt !== null && Date.now() > item.expiresAt) {
            localStorage.removeItem(key);
            return null;
        }

        return item.value;
    } catch (error) {
        // Invalid JSON or other error
        return null;
    }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        // Ignore errors
    }
}

/**
 * Clear all expired items from localStorage
 * Call this on app init to clean up old data
 */
export function clearExpiredItems(): void {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;

                const item = JSON.parse(raw);
                if (item.expiresAt && Date.now() > item.expiresAt) {
                    keysToRemove.push(key);
                }
            } catch {
                // Not our format, skip
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        // Ignore errors
    }
}

// Storage keys used in the app (for reference)
export const STORAGE_KEYS = {
    THEME: 'theme',
    USER_DETAILS: 'velvet_user_details',
} as const;

// TTL configurations
export const TTL = {
    NEVER: null,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
    THREE_MONTHS: 90 * 24 * 60 * 60 * 1000,
} as const;
