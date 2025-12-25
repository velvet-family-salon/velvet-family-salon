'use client';

import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
    message?: string;
    backUrl?: string;
}

export function AccessDenied({
    message = "You don't have permission to access this page.",
    backUrl = '/admin/dashboard'
}: AccessDeniedProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="font-display text-2xl font-bold mb-3">
                    Access Denied
                </h1>

                <p className="text-[var(--muted)] mb-8">
                    {message}
                </p>

                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-2 btn-primary"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </Link>
            </motion.div>
        </div>
    );
}
