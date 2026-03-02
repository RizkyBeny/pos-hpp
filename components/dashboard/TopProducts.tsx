"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideTrophy, LucideTrendingUp, LucidePackage } from 'lucide-react';

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

interface TopProductsProps {
    isDemoMode?: boolean;
}

export default function TopProducts({ isDemoMode = false }: TopProductsProps) {
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            if (isDemoMode) {
                // Dummy data
                const dummy = [
                    { name: 'Nasi Goreng Spesial', quantity: 45, revenue: 1125000 },
                    { name: 'Es Teh Manis', quantity: 38, revenue: 190000 },
                    { name: 'Ayam Bakar', quantity: 22, revenue: 550000 },
                    { name: 'Kopi Susu Gula Aren', quantity: 18, revenue: 360000 },
                    { name: 'Mendoan', quantity: 15, revenue: 150000 },
                ];
                setProducts(dummy);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                if (!userData.user) return;

                // Fetch transaction items for completed transactions
                const { data, error } = await supabase
                    .from('transaction_items')
                    .select('recipe_name, quantity, subtotal, transactions!inner(user_id, status)')
                    .eq('transactions.user_id', userData.user.id)
                    .eq('transactions.status', 'completed');

                if (error) throw error;

                if (data) {
                    const grouped = data.reduce((acc: any, item: any) => {
                        const name = item.recipe_name;
                        if (!acc[name]) {
                            acc[name] = { name, quantity: 0, revenue: 0 };
                        }
                        acc[name].quantity += item.quantity;
                        acc[name].revenue += Number(item.subtotal);
                        return acc;
                    }, {});

                    const sorted = Object.values(grouped) as TopProduct[];
                    sorted.sort((a, b) => b.revenue - a.revenue);
                    setProducts(sorted.slice(0, 5));
                }
            } catch (err) {
                console.error("Failed to fetch top products:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, [isDemoMode]);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm animate-pulse h-[400px]">
                <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                <div className="h-2 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold tracking-tight">Produk Terlaris</h3>
                <p className="text-sm text-muted-foreground">Berdasarkan total pendapatan</p>
            </div>

            <div className="space-y-1">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300">
                            <LucidePackage className="h-6 w-6" />
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">Belum ada data penjualan<br />untuk dianalisis.</p>
                    </div>
                ) : products.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center relative shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">{product.name.charAt(0)}</span>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{product.quantity} terjual</p>
                        </div>
                        <div className="ml-auto font-medium text-sm">
                            Rp {product.revenue.toLocaleString('id-ID')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
