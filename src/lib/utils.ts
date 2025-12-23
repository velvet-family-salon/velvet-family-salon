import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getWhatsAppLink(phone: string, message?: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = message ? encodeURIComponent(message) : '';
    return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

export function getCallLink(phone: string): string {
    return `tel:${phone}`;
}

export function generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    bookedSlots: string[] = []
): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let mins = startMinutes; mins + durationMinutes <= endMinutes; mins += 30) {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        slots.push({
            time: timeStr,
            available: !bookedSlots.includes(timeStr),
        });
    }

    return slots;
}

export function getNextNDays(n: number): { date: string; label: string; dayName: string }[] {
    const days: { date: string; label: string; dayName: string }[] = [];
    const today = new Date();

    for (let i = 0; i < n; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName;

        days.push({ date: dateStr, label: date.getDate().toString(), dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayName });
    }

    return days;
}

export const SALON_CONFIG = {
    name: process.env.NEXT_PUBLIC_SALON_NAME || 'Velvet Family Salon',
    phone: process.env.NEXT_PUBLIC_SALON_PHONE || '+919876543210',
    whatsapp: process.env.NEXT_PUBLIC_SALON_WHATSAPP || '919876543210',
    address: process.env.NEXT_PUBLIC_SALON_ADDRESS || 'Shubham Mangala, 60 Feet Rd, opposite Euro Kids, near Commando GYM, Sharavathi Nagar, Hosamane, Shivamogga, Karnataka – 577201',
    openingHours: {
        start: '09:00',
        end: '21:00',
    },
    coordinates: {
        lat: parseFloat(process.env.NEXT_PUBLIC_MAPS_LAT || '13.929936446586899'),
        lng: parseFloat(process.env.NEXT_PUBLIC_MAPS_LNG || '75.56808927116366'),
    },
};

