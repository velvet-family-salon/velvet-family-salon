'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getServices } from '@/lib/db';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { Service, ServiceCategory } from '@/lib/types';

const categories: { value: ServiceCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
];

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function loadServices() {
            setLoading(true);
            const data = await getServices();
            setServices(data);
            setLoading(false);
        }
        loadServices();
    }, []);

    const filteredServices = services.filter((service) => {
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 glass border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <Link href="/" className="p-2 -ml-2 hover:bg-beige-100 dark:hover:bg-velvet-dark rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-display text-xl font-semibold">Our Services</h1>
                </div>
            </header>

            {/* Search */}
            <div className="px-4 py-4 max-w-lg mx-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-4 max-w-lg mx-auto">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.value
                                    ? 'bg-velvet-rose text-velvet-black'
                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Services List */}
            <div className="px-4 py-4 max-w-lg mx-auto pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-velvet-rose animate-spin" />
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                        </p>

                        <AnimatePresence mode="popLayout">
                            <motion.div className="space-y-3">
                                {filteredServices.map((service, index) => (
                                    <motion.div
                                        key={service.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ServiceCard service={service} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {filteredServices.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <p className="text-[var(--muted)]">No services found</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                    className="text-velvet-rose mt-2 text-sm font-medium"
                                >
                                    Clear filters
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
