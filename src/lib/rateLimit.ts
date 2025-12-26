/**
 * Rate Limiting Utility
 * Client-side throttling for form submissions
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple client-side rate limiter
 * @param key - Unique identifier (e.g., 'booking', 'login')
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
    key: string,
    maxRequests: number = 5,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && entry.resetTime < now) {
        rateLimitStore.delete(key);
    }

    const current = rateLimitStore.get(key);

    if (!current) {
        // First request
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return true;
    }

    if (current.count >= maxRequests) {
        // Rate limited
        return false;
    }

    // Increment counter
    current.count++;
    return true;
}

/**
 * Get remaining time until rate limit resets
 * @param key - Unique identifier
 * @returns Milliseconds until reset, or 0 if not limited
 */
export function getRateLimitReset(key: string): number {
    const entry = rateLimitStore.get(key);
    if (!entry) return 0;

    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? remaining : 0;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

/**
 * Hook-friendly rate limiter for React components
 * Usage: const { canSubmit, timeRemaining } = useRateLimit('booking', 3, 30000);
 */
export function createRateLimiter(key: string, maxRequests: number = 5, windowMs: number = 60000) {
    return {
        check: () => checkRateLimit(key, maxRequests, windowMs),
        getRemainingTime: () => getRateLimitReset(key),
        reset: () => resetRateLimit(key),
    };
}
