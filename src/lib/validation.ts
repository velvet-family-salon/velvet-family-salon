/**
 * Input Validation & Sanitization Utilities
 * For use in admin panel and forms
 */

/**
 * Normalizes Indian phone numbers to a consistent 10-digit format.
 * Removes +91, 0, spaces, dashes, and other formatting.
 */
export function normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Remove leading 91 (country code)
    if (normalized.startsWith('91') && normalized.length > 10) {
        normalized = normalized.slice(2);
    }

    // Remove leading 0
    if (normalized.startsWith('0') && normalized.length > 10) {
        normalized = normalized.slice(1);
    }

    return normalized;
}

/**
 * Validates Indian phone number format (10 digits starting with 6-9)
 */
export function validatePhone(phone: string): boolean {
    const cleaned = normalizePhone(phone);
    return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Formats phone number for display (XXX-XXX-XXXX)
 */
export function formatPhoneDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * P2 FIX: Robust XSS sanitization using HTML entity encoding
 * BEFORE: Only removed HTML tags with regex (bypassed by many XSS vectors)
 * AFTER: Encodes all special characters that could be used in XSS attacks
 * 
 * XSS payloads that are now blocked:
 * - <script>alert('xss')</script> → &lt;script&gt;alert('xss')&lt;/script&gt;
 * - <img src=x onerror=alert('xss')> → &lt;img src=x onerror=alert('xss')&gt;
 * - javascript:alert('xss') → javascript:alert('xss') (safe as text)
 * - " onclick="alert('xss') → &quot; onclick=&quot;alert('xss')
 */
export function sanitizeText(text: string): string {
    if (!text) return '';

    // HTML entity encoding map for XSS prevention
    const htmlEntities: Record<string, string> = {
        '&': '&amp;',   // Must be first to avoid double-encoding
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',  // More compatible than &apos;
        '/': '&#x2F;',  // Prevents closing tags
        '`': '&#x60;',  // Template literals
    };

    return text
        .replace(/[&<>"'`/]/g, char => htmlEntities[char] || char)
        .trim();
}

/**
 * Sanitizes text for safe display - strips dangerous content but keeps readable text
 * Use this when you want to display user content but not as HTML
 */
export function sanitizeForDisplay(text: string): string {
    if (!text) return '';

    return text
        // Remove all HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '')
        // Remove event handlers like onclick, onerror, etc.
        .replace(/on\w+\s*=/gi, '')
        // Remove data: URLs (can contain scripts)
        .replace(/data:/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Validates that a price is a positive number
 */
export function validatePrice(price: number | string): boolean {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(num) && num >= 0;
}

/**
 * Validates that a duration is a positive integer
 */
export function validateDuration(duration: number | string): boolean {
    const num = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    return !isNaN(num) && num > 0 && Number.isInteger(num);
}

/**
 * Validates a name (non-empty, reasonable length)
 */
export function validateName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Formats price for display with Indian Rupee symbol
 */
export function formatPriceInput(value: string): string {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
        return parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned;
}

/**
 * Validates time format (HH:MM)
 */
export function validateTime(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Validates date format (YYYY-MM-DD) and is a valid date
 */
export function validateDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(date: string): boolean {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}

/**
 * Validates form data for appointment creation
 */
export function validateAppointmentForm(data: {
    name: string;
    phone: string;
    email?: string;
    date: string;
    time: string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!validateName(data.name)) {
        errors.push('Please enter a valid name (2-100 characters)');
    }

    if (!validatePhone(data.phone)) {
        errors.push('Please enter a valid 10-digit phone number');
    }

    if (data.email && !validateEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!validateDate(data.date)) {
        errors.push('Please select a valid date');
    } else if (!isFutureDate(data.date)) {
        errors.push('Please select a date today or in the future');
    }

    if (!validateTime(data.time)) {
        errors.push('Please select a valid time');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validates form data for service creation/editing
 */
export function validateServiceForm(data: {
    name: string;
    price: number | string;
    duration: number | string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!validateName(data.name)) {
        errors.push('Please enter a valid service name (2-100 characters)');
    }

    if (!validatePrice(data.price)) {
        errors.push('Please enter a valid price');
    }

    if (!validateDuration(data.duration)) {
        errors.push('Please enter a valid duration in minutes');
    }

    return { valid: errors.length === 0, errors };
}
