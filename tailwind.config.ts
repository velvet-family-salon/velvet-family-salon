import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Velvet Family Salon Brand Colors
                velvet: {
                    black: '#1a1a1a',
                    dark: '#2d2d2d',
                    gray: '#4a4a4a',
                },
                beige: {
                    50: '#fdfcfa',
                    100: '#f9f6f0',
                    200: '#f5f0e8',
                    300: '#ebe3d5',
                    400: '#ddd2be',
                    500: '#c9b99a',
                },
                // Old gold colors (kept for admin panel)
                gold: {
                    light: '#f5e6c8',
                    DEFAULT: '#d4af37',
                    dark: '#b8960c',
                },
                // New brand colors (dusty rose from logo)
                'velvet-rose': {
                    light: '#F5E1E4',
                    DEFAULT: '#C4767C',
                    dark: '#A85A60',
                },
            },
            fontFamily: {
                sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
                display: ['var(--font-playfair)', 'serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-rose': 'pulseRose 2s infinite',
                'shimmer': 'shimmer 2s infinite',
                'borderTravel': 'borderTravel 4s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseRose: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(196, 118, 124, 0.4)' },
                    '50%': { boxShadow: '0 0 0 10px rgba(196, 118, 124, 0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                borderTravel: {
                    '0%': { top: '0', left: '0' },
                    '25%': { top: '0', left: '100%' },
                    '50%': { top: '100%', left: '100%' },
                    '75%': { top: '100%', left: '0' },
                    '100%': { top: '0', left: '0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'rose-shimmer': 'linear-gradient(90deg, transparent, rgba(196, 118, 124, 0.3), transparent)',
            },
        },
    },
    plugins: [],
};

export default config;
