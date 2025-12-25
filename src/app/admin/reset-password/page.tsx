'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Check for error in URL (e.g., expired link)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
            setError(errorDescription || 'Invalid or expired reset link');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
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
                    <h1 className="font-display text-2xl font-bold text-white mb-3">Password Updated!</h1>
                    <p className="text-beige-400 mb-8">
                        Your password has been successfully reset. You can now log in with your new password.
                    </p>
                    <Link
                        href="/admin"
                        className="btn-primary inline-flex"
                    >
                        Go to Login
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
                    <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
                    <p className="text-beige-400 text-sm mt-2">
                        Enter your new password below
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
                        <label className="text-beige-300 text-sm mb-1 block">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-velvet-gray" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-velvet-dark border border-velvet-gray rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-velvet-gray focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-velvet-gray hover:text-beige-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-beige-300 text-sm mb-1 block">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-velvet-gray" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-velvet-dark border border-velvet-gray rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-velvet-gray focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                                required
                                minLength={6}
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
                            'Update Password'
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <Link
                        href="/admin"
                        className="text-beige-400 text-sm hover:text-gold transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-velvet-black via-velvet-dark to-velvet-black">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
