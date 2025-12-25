import type { Metadata, Viewport } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';

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
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Velvet Salon',
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
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
            <head>
                <link rel="preconnect" href="https://hvjprbquuqeqhwnjbwcg.supabase.co" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
            </head>
            <body className={`${outfit.variable} ${playfair.variable} font-sans antialiased`}>
                <AuthProvider>
                    <ThemeProvider>
                        <ToastProvider>
                            <main className="min-h-screen pb-safe">
                                {children}
                            </main>
                            <BottomNav />
                        </ToastProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}




