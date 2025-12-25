'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/admin/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    if (sent) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-velvet-black via-velvet-dark to-velvet-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm text-center"
                >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-white mb-3">Check Your Email</h1>
                    <p className="text-beige-400 mb-6">
                        We've sent a password reset link to<br />
                        <span className="text-gold font-medium">{email}</span>
                    </p>
                    <p className="text-beige-500 text-sm mb-8">
                        Click the link in the email to reset your password. The link expires in 1 hour.
                    </p>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-velvet-black via-velvet-dark to-velvet-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg border-2 border-velvet-rose/30">
                        <Image src="/logo.jpg" alt="Velvet Family Salon" fill className="object-cover" priority />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-white">Forgot Password?</h1>
                    <p className="text-beige-400 text-sm mt-2">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <label className="text-beige-300 text-sm mb-1 block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-velvet-gray" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@velvetfamilysalon.com"
                                className="w-full bg-velvet-dark border border-velvet-gray rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-velvet-gray focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-beige-400 text-sm hover:text-gold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
