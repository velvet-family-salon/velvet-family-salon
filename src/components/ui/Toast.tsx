'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: Toast['type'], message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
};

const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const Icon = icons[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 shadow-lg max-w-sm"
        >
            <div className={`w-8 h-8 rounded-full ${colors[toast.type]} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-[var(--card-border)] rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
        </motion.div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((type: Toast['type'], message: string, duration = 4000) => {
        const id = Math.random().toString(36).substring(2);
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem toast={toast} onRemove={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
