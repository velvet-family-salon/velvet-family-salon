'use client';

import { Phone, MessageCircle, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { SALON_CONFIG, getWhatsAppLink, getCallLink } from '@/lib/utils';

export function QuickActions() {
    const actions = [
        {
            icon: Calendar,
            label: 'Book',
            href: '/book',
            isLink: true,
            color: 'bg-velvet-rose text-velvet-black',
        },
        {
            icon: Phone,
            label: 'Call',
            href: getCallLink(SALON_CONFIG.phone),
            isLink: false,
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
        },
        {
            icon: MessageCircle,
            label: 'WhatsApp',
            href: getWhatsAppLink(SALON_CONFIG.whatsapp, `Hi! I would like to book an appointment at ${SALON_CONFIG.name}.`),
            isLink: false,
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        },
        {
            icon: MapPin,
            label: 'Location',
            href: '/contact',
            isLink: true,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        },
    ];

    return (
        <div className="px-4 py-4 max-w-lg mx-auto">
            <div className="flex justify-between gap-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    const content = (
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center transition-transform active:scale-95`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-[var(--muted)]">{action.label}</span>
                        </div>
                    );

                    if (action.isLink) {
                        return (
                            <Link key={action.label} href={action.href} className="flex-1 flex justify-center">
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <a
                            key={action.label}
                            href={action.href}
                            target={action.label === 'WhatsApp' ? '_blank' : undefined}
                            rel={action.label === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                            className="flex-1 flex justify-center"
                        >
                            {content}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
