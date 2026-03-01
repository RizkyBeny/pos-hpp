"use client";

import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LucideTrendingUp, LucideInfo } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RevenueChartProps {
    isDemoMode?: boolean;
}

export default function RevenueChart({ isDemoMode = false }: RevenueChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            if (isDemoMode) {
                // Generate dummy data for the last 7 days
                const dummyData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);

                    const revenue = Math.floor(Math.random() * 500000) + 100000;
                    const hpp = Math.floor(revenue * 0.4); // ~40% HPP

                    dummyData.push({
                        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                        revenue,
                        profit: revenue - hpp
                    });
                }
                setData(dummyData);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                if (!userData.user) return;

                // Get date 7 days ago
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

                const { data: transactions, error } = await supabase
                    .from('transactions')
                    .select('sale_date, total_amount, total_hpp, status')
                    .eq('user_id', userData.user.id)
                    .gte('sale_date', startDateStr)
                    .eq('status', 'completed')
                    .order('sale_date', { ascending: true });

                if (error) throw error;

                // Group by date
                const grouped = new Map();

                // Initialize last 7 days with 0
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                    grouped.set(dateStr, { date: label, revenue: 0, profit: 0 });
                }

                // Fill data
                transactions?.forEach(tx => {
                    const existing = grouped.get(tx.sale_date);
                    if (existing) {
                        existing.revenue += tx.total_amount;
                        existing.profit += (tx.total_amount - tx.total_hpp);
                    }
                });

                setData(Array.from(grouped.values()));
            } catch (error) {
                console.error("Failed to fetch revenue data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [isDemoMode]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border shadow-xl">
                    <p className="font-bold text-sm mb-2">{label}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <span className="text-xs font-semibold w-20">Pendapatan</span>
                            <span className="font-bold text-sm">Rp {payload[0].value.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-blue-600">
                            <span className="text-xs font-semibold w-20">Gross Profit</span>
                            <span className="font-bold text-sm">Rp {payload[1].value.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="h-[300px] rounded-xl border bg-card flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                            <LucideTrendingUp className="h-4 w-4 text-emerald-500" />
                            Tren Penjualan (7 Hari)
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Pendapatan & Gross Profit</p>
                    </div>
                </div>
            </div>
            <div className="p-6 pt-6">
                <div className="h-[250px] sm:h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#71717a' }}
                                dy={10}
                            />
                            <YAxis
                                hide={false}
                                width={60}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#71717a' }}
                                tickFormatter={(value) => `Rp ${value / 1000}k`}
                                dx={-5}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '4 4' }} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area
                                type="monotone"
                                dataKey="profit"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorProfit)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
