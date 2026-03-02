"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    LucideHistory,
    LucideSearch,
    LucideFilter,
    LucideCalendarDays,
    LucideArrowUpRight,
    LucideArrowDownRight,
    LucideDownload,
    LucideReceipt
} from 'lucide-react';
import TransactionDetail from './TransactionDetail';

interface SalesHistoryPageProps {
    isDemoMode?: boolean;
}

export default function SalesHistoryPage({ isDemoMode = false }: SalesHistoryPageProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

    const fetchTransactions = async () => {
        if (isDemoMode) {
            setTransactions([
                {
                    id: 't-demo-1',
                    receipt_number: 'INV-20231027-001',
                    sale_date: new Date().toISOString().split('T')[0],
                    sale_time: '12:30:00',
                    total_amount: 50000,
                    total_hpp: 25000,
                    payment_method: 'qris',
                    sale_channel: 'walk-in',
                    status: 'completed',
                    customer_name: null,
                    notes: null,
                    transaction_items: [
                        { id: 'ti-1', recipe_id: 'r1', quantity: 2, unit_price: 15000, hpp_at_sale: 8000, recipes: { name: 'Ayam Geprek' } },
                        { id: 'ti-2', recipe_id: 'r2', quantity: 1, unit_price: 20000, hpp_at_sale: 9000, recipes: { name: 'Nasi Goreng' } }
                    ]
                },
                {
                    id: 't-demo-2',
                    receipt_number: 'INV-20231027-002',
                    sale_date: new Date().toISOString().split('T')[0],
                    sale_time: '14:15:00',
                    total_amount: 15000,
                    total_hpp: 5000,
                    payment_method: 'transfer',
                    sale_channel: 'whatsapp',
                    status: 'void',
                    customer_name: 'Budi (Demo)',
                    notes: 'Dibatalkan karena stok kosong',
                    transaction_items: [
                        { id: 'ti-3', recipe_id: 'r3', quantity: 1, unit_price: 15000, hpp_at_sale: 5000, recipes: { name: 'Es Teh Manis' } }
                    ]
                }
            ]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id, 
                    receipt_number, 
                    sale_date, 
                    sale_time, 
                    total_amount, 
                    total_hpp, 
                    payment_method, 
                    sale_channel, 
                    status,
                    customer_name,
                    notes,
                    transaction_items (
                        id,
                        recipe_id,
                        quantity,
                        unit_price,
                        hpp_at_sale,
                        recipes (
                            name
                        )
                    )
                `)
                .eq('user_id', userData.user.id)
                .order('sale_date', { ascending: false })
                .order('sale_time', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [isDemoMode]);

    const filteredTransactions = transactions.filter(t =>
        t.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalSales = filteredTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.total_amount, 0);
    const totalTransactions = filteredTransactions.filter(t => t.status === 'completed').length;

    const handleExportCSV = () => {
        const headers = ['Receipt Number', 'Date', 'Time', 'Channel', 'Payment Method', 'Status', 'Total Amount', 'Total HPP', 'Gross Profit'];

        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(t => {
                const profit = t.total_amount - t.total_hpp;
                return [
                    t.receipt_number,
                    new Date(t.sale_date).toLocaleDateString('id-ID'),
                    t.sale_time.substring(0, 5),
                    t.sale_channel,
                    t.payment_method,
                    t.status,
                    t.total_amount,
                    t.total_hpp,
                    profit
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-row items-center justify-between gap-2 mb-1">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Riwayat</h2>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Pantau performa historis</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                    >
                        <LucideDownload className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Export</span>
                    </button>
                    <button className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900 transition-opacity">
                        <LucideCalendarDays className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Hari Ini</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats - Compacted Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs font-bold uppercase text-muted-foreground">Total Omzet</h3>
                        <LucideArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                            <span className="text-sm font-medium mr-1">Rp</span>
                            {totalSales.toLocaleString('id-ID')}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total pendapatan selesai</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs font-bold uppercase text-muted-foreground">Transaksi</h3>
                        <LucideReceipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold">{totalTransactions}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Jumlah nota berhasil</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-xs font-bold uppercase text-muted-foreground">Void / Batal</h3>
                        <LucideArrowDownRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold">{filteredTransactions.filter(t => t.status === 'void').length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Transaksi dibatalkan</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b flex flex-row gap-2">
                    <div className="relative flex-1">
                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari resi atau nama pelanggan..."
                            className="flex h-9 w-full rounded-md border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                        <LucideFilter className="h-4 w-4 mr-2" />
                        <span className="hidden xs:inline">Filter</span>
                    </button>
                </div>

                {/* Table for Desktop */}
                <div className="hidden md:block flex-1 overflow-x-auto">
                    <table className="w-full text-sm text-left relative">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] whitespace-nowrap">Receipt & Waktu</th>
                                <th className="px-6 py-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] whitespace-nowrap">Channel</th>
                                <th className="px-6 py-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] whitespace-nowrap">Pembayaran</th>
                                <th className="px-6 py-4 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] whitespace-nowrap">Total</th>
                                <th className="px-6 py-4 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
                                            <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <LucideHistory className="h-6 w-6 text-zinc-300" />
                                        </div>
                                        <p className="text-zinc-500 font-medium">Belum ada riwayat transaksi</p>
                                        {searchTerm && <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci pencarian</p>}
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-bold text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 transition-colors">{tx.receipt_number}</p>
                                            <div className="flex items-center text-xs text-zinc-500 mt-0.5 space-x-2">
                                                <span>{new Date(tx.sale_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                                <span>{tx.sale_time.substring(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                {tx.sale_channel}
                                            </span>
                                            {tx.customer_name && (
                                                <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-[120px]" title={tx.customer_name}>
                                                    {tx.customer_name}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 uppercase text-xs font-bold text-zinc-600">
                                            {tx.payment_method}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <p className="font-bold">Rp {tx.total_amount.toLocaleString('id-ID')}</p>
                                            <p className="text-[10px] text-zinc-400 mt-0.5">
                                                {tx.transaction_items.reduce((s: number, i: any) => s + i.quantity, 0)} items
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {tx.status === 'completed' ? (
                                                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold border">
                                                    Selesai
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground border border-dashed">
                                                    Void
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Cards for Mobile */}
                <div className="md:hidden flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 space-y-3 animate-pulse">
                                <div className="flex justify-between">
                                    <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                    <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                    <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                </div>
                            </div>
                        ))
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400">
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <LucideHistory className="h-6 w-6" />
                            </div>
                            <p className="font-medium text-sm">Belum ada riwayat transaksi</p>
                            {searchTerm && <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci pencarian</p>}
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedTransaction(tx)}
                                className="p-3 flex flex-col gap-2 active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-xs text-emerald-900 dark:text-emerald-100">{tx.receipt_number}</p>
                                        <div className="flex items-center text-[10px] text-zinc-500 mt-0.5">
                                            <span>{new Date(tx.sale_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                                            <span className="mx-1">•</span>
                                            <span>{tx.sale_time.substring(0, 5)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold tracking-tight text-xs">Rp {tx.total_amount.toLocaleString('id-ID')}</p>
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            {tx.status === 'completed' ? (
                                                <span className="text-[9px] font-black uppercase tracking-tight bg-secondary px-1.5 py-0.5 rounded border">Selesai</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-dashed">Batal</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-tight bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                            {tx.sale_channel}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase text-zinc-400">{tx.payment_method}</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500">
                                        {tx.transaction_items.reduce((s: number, i: any) => s + i.quantity, 0)} items
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedTransaction && (
                <TransactionDetail
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onStatusUpdate={fetchTransactions}
                    isDemoMode={isDemoMode}
                />
            )}
        </div>
    );
}
