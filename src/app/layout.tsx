import type { Metadata, Viewport } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Velvet Family Salon | Premium Unisex Salon in Shivamogga',
    description: 'Experience luxury grooming at Velvet Family Salon. Book your appointment online for haircuts, styling, facials, and more. Men, Women & Kids welcome.',
    keywords: 'salon, haircut, Shivamogga, grooming, beauty, spa, unisex salon, family salon',
    authors: [{ name: 'Velvet Family Salon' }],
    openGraph: {
        title: 'Velvet Family Salon',
        description: 'Premium Unisex Salon in Shivamogga',
        type: 'website',
        locale: 'en_IN',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fdfcfa' },
        { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.variable} ${playfair.variable} font-sans antialiased`}>
                <ThemeProvider>
                    <main className="min-h-screen pb-safe">
                        {children}
                    </main>
                    <BottomNav />
                </ThemeProvider>
            </body>
        </html>
    );
}
