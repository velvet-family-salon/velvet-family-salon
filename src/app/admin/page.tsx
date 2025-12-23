'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Demo login - in production, this would use Supabase Auth
        if (email === 'admin@velvet.com' && password === 'admin123') {
            localStorage.setItem('adminLoggedIn', 'true');
            router.push('/admin/dashboard');
        } else {
            setError('Invalid email or password');
        }
        setLoading(false);
    };

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
                    <h1 className="font-display text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-beige-400 text-sm">Velvet Family Salon</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
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
                        <label className="text-beige-300 text-sm mb-1 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@velvet.com"
                            className="w-full bg-velvet-dark border border-velvet-gray rounded-xl py-3 px-4 text-white placeholder:text-velvet-gray focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-beige-300 text-sm mb-1 block">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-velvet-dark border border-velvet-gray rounded-xl py-3 px-4 pr-12 text-white placeholder:text-velvet-gray focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                                required
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-velvet-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/20">
                    <p className="text-beige-300 text-sm text-center mb-2">Demo Credentials</p>
                    <p className="text-beige-400 text-xs text-center font-mono">
                        admin@velvet.com / admin123
                    </p>
                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-beige-400 text-sm hover:text-gold transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
