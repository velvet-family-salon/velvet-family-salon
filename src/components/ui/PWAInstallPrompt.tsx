'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Hook for install functionality
export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        if (iOS && !standalone) {
            setIsInstallable(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstallable(false);
            }
            setDeferredPrompt(null);
        }
    };

    return { isInstallable, isIOS, isStandalone, install, deferredPrompt };
}

// Small header button
export function InstallButton() {
    const { isInstallable, isIOS, isStandalone, install, deferredPrompt } = useInstallPrompt();

    if (isStandalone || !isInstallable) return null;

    if (isIOS) {
        return (
            <button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-velvet-rose/10 text-velvet-rose rounded-full text-xs font-medium hover:bg-velvet-rose/20 transition-colors"
                onClick={() => alert('Tap the Share button below, then "Add to Home Screen"')}
            >
                <Share className="w-3.5 h-3.5" />
                Install
            </button>
        );
    }

    if (deferredPrompt) {
        return (
            <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-velvet-rose/10 text-velvet-rose rounded-full text-xs font-medium hover:bg-velvet-rose/20 transition-colors"
            >
                <Download className="w-3.5 h-3.5" />
                Install
            </button>
        );
    }

    return null;
}

// Popup notification - shows on home page each visit, dismissed when X clicked
export function HomePageInstallBanner({ onDismiss }: { onDismiss: () => void }) {
    const { isInstallable, isIOS, isStandalone, install, deferredPrompt } = useInstallPrompt();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show after a short delay
        const timer = setTimeout(() => {
            if ((isInstallable || isIOS) && !isStandalone) {
                setVisible(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isInstallable, isIOS, isStandalone]);

    const handleInstall = async () => {
        await install();
        setVisible(false);
        onDismiss();
    };

    const handleDismiss = () => {
        setVisible(false);
        onDismiss();
    };

    if (isStandalone || !visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
                >
                    <div className="card p-4 shadow-xl border-velvet-rose/30">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 hover:bg-[var(--card-border)] rounded-full"
                        >
                            <X className="w-4 h-4 text-[var(--muted)]" />
                        </button>

                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-velvet-rose/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Download className="w-6 h-6 text-velvet-rose" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm mb-1">Install Velvet Salon</h3>
                                <p className="text-xs text-[var(--muted)] mb-3">
                                    {isIOS
                                        ? 'Tap Share, then "Add to Home Screen" for quick access.'
                                        : 'Install our app for faster booking and offline access.'}
                                </p>
                                {!isIOS && deferredPrompt && (
                                    <button
                                        onClick={handleInstall}
                                        className="btn-primary text-sm py-2 px-4"
                                    >
                                        Install App
                                    </button>
                                )}
                                {isIOS && (
                                    <div className="flex items-center gap-2 text-xs text-velvet-rose">
                                        <Share className="w-4 h-4" />
                                        <span>Tap Share → Add to Home Screen</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
