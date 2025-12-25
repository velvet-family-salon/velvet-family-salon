'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scissors, Users, Calendar, LogOut, TrendingUp, TrendingDown,
    IndianRupee, ChevronRight, Loader2, MessageSquare, Settings, RefreshCw, Shield,
    BarChart3, PieChart, Receipt, Percent, UserCheck, ArrowUpRight, ArrowDownRight,
    Sparkles, Award, AlertTriangle
} from 'lucide-react';
import { getRevenueStats, RevenueStats } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<RevenueStats | null>(null);

    const loadData = useCallback(async () => {
        const data = await getRevenueStats();
        setStats(data);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData().then(() => setLoading(false));
    }, [loadData]);

    const { signOut } = useAuth();

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await signOut();
            router.push('/admin');
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/admin/bookings' },
        { icon: Scissors, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Staff', href: '/admin/staff' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', active: true },
        { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: Settings, label: 'Reviews', href: '/admin/reviews-config' },
        { icon: Shield, label: 'Users', href: '/admin/users' },
    ];

    const formatMonth = (month: string) => {
        const [year, m] = month.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    };

    if (loading) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex items-center justify-center bg-beige-50 dark:bg-velvet-black">
                    <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
            </AuthGuard>
        );
    }

    const maxMonthlyRevenue = stats?.monthlyRevenue.reduce((max, m) => Math.max(max, m.revenue), 0) || 1;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-beige-50 dark:bg-velvet-black">
                {/* Header */}
                <header className="bg-white dark:bg-velvet-dark border-b border-beige-200 dark:border-velvet-gray sticky top-0 z-30">
                    <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-velvet-rose/20">
                                <Image src="/logo.jpg" alt="Velvet Family Salon" fill className="object-cover" priority />
                            </div>
                            <div>
                                <h1 className="font-display text-lg font-semibold">Analytics</h1>
                                <p className="text-xs text-[var(--muted)]">Revenue & Insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-gold"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-beige-100 dark:hover:bg-velvet-gray rounded-full transition-colors text-[var(--muted)] hover:text-red-500"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex w-full">
                    {/* Sidebar - Desktop */}
                    <aside className="hidden md:block w-56 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                        ? 'bg-gold/10 text-gold'
                                        : 'hover:bg-beige-100 dark:hover:bg-velvet-dark text-[var(--muted)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 pb-24 md:pb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Revenue Timeline */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray">
                                    <p className="text-xs text-[var(--muted)] mb-1">Today</p>
                                    <p className="text-xl font-bold text-green-600">{formatPrice(stats?.todayRevenue || 0)}</p>
                                </div>
                                <div className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray">
                                    <p className="text-xs text-[var(--muted)] mb-1">This Month</p>
                                    <p className="text-xl font-bold text-blue-600">{formatPrice(stats?.mtdRevenue || 0)}</p>
                                </div>
                                <div className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray">
                                    <p className="text-xs text-[var(--muted)] mb-1">This Year</p>
                                    <p className="text-xl font-bold text-purple-600">{formatPrice(stats?.ytdRevenue || 0)}</p>
                                </div>
                            </div>

                            {/* Main Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-3">
                                        <IndianRupee className="w-5 h-5" />
                                    </div>
                                    <p className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
                                    <p className="text-sm text-[var(--muted)]">Total Revenue</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <p className="text-2xl font-bold">{stats?.totalBills || 0}</p>
                                    <p className="text-sm text-[var(--muted)]">Total Bills</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
                                    <p className="text-sm text-[var(--muted)]">Unique Clients</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white dark:bg-velvet-dark rounded-2xl p-4 border border-beige-200 dark:border-velvet-gray"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <p className="text-2xl font-bold">{formatPrice(stats?.avgBillValue || 0)}</p>
                                    <p className="text-sm text-[var(--muted)]">Avg Bill Value</p>
                                </motion.div>
                            </div>

                            {/* Discount Insights */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray overflow-hidden">
                                <div className="p-4 border-b border-beige-200 dark:border-velvet-gray">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Percent className="w-5 h-5 text-orange-500" />
                                        Discount Insights
                                    </h3>
                                </div>
                                <div className="p-4 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-500">{formatPrice(stats?.totalDiscount || 0)}</p>
                                        <p className="text-xs text-[var(--muted)]">Total Discounts Given</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{stats?.billsWithDiscount || 0}</p>
                                        <p className="text-xs text-[var(--muted)]">Bills with Discount</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{stats?.avgDiscountPercent || 0}%</p>
                                        <p className="text-xs text-[var(--muted)]">Avg Discount %</p>
                                    </div>
                                </div>
                            </div>

                            {/* Best & Worst Month */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-4 border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="w-5 h-5 text-green-600" />
                                        <span className="font-semibold text-green-600">Best Month</span>
                                    </div>
                                    {stats?.bestMonth ? (
                                        <>
                                            <p className="text-xl font-bold">{formatMonth(stats.bestMonth.month)}</p>
                                            <p className="text-sm text-green-600">{formatPrice(stats.bestMonth.revenue)}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[var(--muted)]">No data yet</p>
                                    )}
                                </div>
                                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-4 border border-red-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <span className="font-semibold text-red-500">Lowest Month</span>
                                    </div>
                                    {stats?.worstMonth ? (
                                        <>
                                            <p className="text-xl font-bold">{formatMonth(stats.worstMonth.month)}</p>
                                            <p className="text-sm text-red-500">{formatPrice(stats.worstMonth.revenue)}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[var(--muted)]">No data yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Revenue Trend - Line Chart */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray overflow-hidden">
                                <div className="p-4 border-b border-beige-200 dark:border-velvet-gray flex items-center justify-between">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-gold" />
                                        Monthly Revenue Trend
                                    </h3>
                                    <select
                                        className="text-xs bg-beige-100 dark:bg-velvet-gray border-none rounded-lg px-2 py-1 outline-none"
                                        onChange={(e) => {
                                            // Ideally handles timeframe changes
                                        }}
                                    >
                                        <option value="6m">Last 6 Months</option>
                                    </select>
                                </div>
                                <div className="p-4">
                                    {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                        <>
                                            {/* Chart Container */}
                                            <div className="relative h-64 w-full mb-6">
                                                {/* Y-axis Labels */}
                                                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] text-[var(--muted)] font-mono">
                                                    <span>{formatPrice(maxMonthlyRevenue)}</span>
                                                    <span>{formatPrice(maxMonthlyRevenue * 0.75)}</span>
                                                    <span>{formatPrice(maxMonthlyRevenue * 0.5)}</span>
                                                    <span>{formatPrice(maxMonthlyRevenue * 0.25)}</span>
                                                    <span>₹0</span>
                                                </div>

                                                {/* Chart Area */}
                                                <div className="ml-14 relative h-full">
                                                    {/* Horizontal Grid Lines */}
                                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div key={i} className={`w-full border-b ${i === 4 ? 'border-beige-300 dark:border-velvet-gray' : 'border-dashed border-beige-200 dark:border-velvet-gray/50'}`} />
                                                        ))}
                                                    </div>

                                                    {/* SVG Chart */}
                                                    <svg className="w-full h-[calc(100%-32px)] overflow-visible" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
                                                                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>

                                                        {stats.monthlyRevenue.length > 1 ? (() => {
                                                            const data = stats.monthlyRevenue.slice(-6);
                                                            const width = 100;
                                                            const height = 100;

                                                            const points = data.map((m, i) => {
                                                                const x = (i / (data.length - 1)) * width;
                                                                const y = height - (m.revenue / maxMonthlyRevenue) * height;
                                                                return [x, y];
                                                            });

                                                            const pathD = `M ${points[0][0]} ${points[0][1]} ` + points.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ');
                                                            const areaD = `${pathD} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;

                                                            return (
                                                                <>
                                                                    <motion.path
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        d={areaD}
                                                                        fill="url(#chartGradient)"
                                                                        className="transition-all duration-300"
                                                                        vectorEffect="non-scaling-stroke"
                                                                    />
                                                                    <motion.path
                                                                        initial={{ pathLength: 0 }}
                                                                        animate={{ pathLength: 1 }}
                                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                                        d={pathD}
                                                                        fill="none"
                                                                        stroke="#D4AF37"
                                                                        strokeWidth="3"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        vectorEffect="non-scaling-stroke"
                                                                    />
                                                                    {points.map((p, i) => (
                                                                        <g key={i}>
                                                                            <motion.circle
                                                                                initial={{ r: 0 }}
                                                                                animate={{ r: 4 }}
                                                                                transition={{ delay: 1 + i * 0.1 }}
                                                                                cx={p[0] + '%'}
                                                                                cy={p[1]}
                                                                                fill="white"
                                                                                stroke="#D4AF37"
                                                                                strokeWidth="2"
                                                                            />
                                                                        </g>
                                                                    ))}
                                                                </>
                                                            );
                                                        })() : null}
                                                    </svg>

                                                    {/* Tooltips Overlay */}
                                                    <div className="absolute inset-0 flex justify-between items-end h-[calc(100%-32px)]">
                                                        {stats.monthlyRevenue.slice(-6).map((m, i) => {
                                                            const heightPercent = (m.revenue / maxMonthlyRevenue) * 100;
                                                            return (
                                                                <div key={m.month} className="relative group" style={{ height: `${heightPercent}%`, width: '1px' }}>
                                                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 opacity-0 group-hover:opacity-100 bg-white border-2 border-gold rounded-full z-10 transition-opacity cursor-pointer" />
                                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-velvet-dark text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                                                        {formatPrice(m.revenue)}
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-velvet-dark" />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                    {/* X-axis Labels */}
                                                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[var(--muted)] pt-2">
                                                        {stats.monthlyRevenue.slice(-6).map((m) => (
                                                            <span key={m.month} className="text-center w-12 truncate">{formatMonth(m.month)}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed List View */}
                                            <div className="space-y-4 pt-4 border-t border-beige-200 dark:border-velvet-gray">
                                                {stats.monthlyRevenue.slice(-6).reverse().map((month, i) => (
                                                    <div key={month.month} className="flex items-center gap-4 group hover:bg-beige-50 dark:hover:bg-velvet-gray/20 p-2 rounded-xl transition-colors">
                                                        <div className="w-12 text-center">
                                                            <div className="text-xs font-bold text-[var(--muted)]">{month.month.split('-')[1]}</div>
                                                            <div className="text-[10px] text-[var(--muted)] opacity-70">{month.month.split('-')[0]}</div>
                                                        </div>

                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-medium text-velvet-black dark:text-white">{formatPrice(month.revenue)}</span>
                                                                <span className="text-[var(--muted)]">{month.bills} bills</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-beige-100 dark:bg-velvet-gray rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%` }}
                                                                    transition={{ delay: 0.2 + i * 0.1, duration: 1 }}
                                                                    className="h-full bg-gradient-to-r from-gold to-yellow-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="text-xs font-medium text-green-600 hidden md:block w-16 text-right">
                                                            <TrendingUp className="w-3 h-3 inline mr-1" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
                                            <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                                            <p>No revenue data recorded yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Top Services */}
                            <div className="bg-white dark:bg-velvet-dark rounded-2xl border border-beige-200 dark:border-velvet-gray overflow-hidden">
                                <div className="p-4 border-b border-beige-200 dark:border-velvet-gray">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-gold" />
                                        Top Services
                                    </h3>
                                </div>
                                <div className="divide-y divide-beige-200 dark:divide-velvet-gray">
                                    {stats?.serviceStats && stats.serviceStats.length > 0 ? (
                                        stats.serviceStats.slice(0, 5).map((service, i) => (
                                            <div key={service.name} className="p-4 flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-gray-300/30 text-gray-600' : i === 2 ? 'bg-orange-500/20 text-orange-600' : 'bg-beige-100 dark:bg-velvet-gray text-[var(--muted)]'}`}>
                                                    #{i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{service.name}</p>
                                                    <p className="text-xs text-[var(--muted)]">{service.count} times</p>
                                                </div>
                                                <p className="font-semibold text-green-600">{formatPrice(service.revenue)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-[var(--muted)] py-8">No service data yet</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-velvet-dark border-t border-beige-200 dark:border-velvet-gray">
                    <div className="flex items-center justify-around h-16 px-2">
                        {navItems.slice(0, 5).map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-2 ${item.active ? 'text-gold' : 'text-[var(--muted)]'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </AuthGuard>
    );
}
