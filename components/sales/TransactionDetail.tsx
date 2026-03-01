import React from 'react';
import { LucideX, LucideReceipt, LucideClock, LucideCalendar, LucideUser, LucideAlertTriangle, LucideUndo2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TransactionItem {
    id: string;
    recipe_id: string;
    quantity: number;
    unit_price: number;
    hpp_at_sale: number;
    recipes: {
        name: string;
    };
}

interface Transaction {
    id: string;
    receipt_number: string;
    sale_date: string;
    sale_time: string;
    total_amount: number;
    total_hpp: number;
    payment_method: string;
    sale_channel: string;
    status: string;
    customer_name: string | null;
    notes: string | null;
    transaction_items: TransactionItem[];
}

interface TransactionDetailProps {
    transaction: Transaction;
    onClose: () => void;
    onStatusUpdate: () => void;
    isDemoMode?: boolean;
}

export default function TransactionDetail({ transaction, onClose, onStatusUpdate, isDemoMode = false }: TransactionDetailProps) {
    const handleVoid = async () => {
        if (!confirm('Apakah Anda yakin ingin membatalkan (void) transaksi ini? Stok yang telah terpotong akan dikembalikan.')) {
            return;
        }

        if (isDemoMode) {
            alert('Fitur void simulasi berjalan (Demo). Transaksi dibatalkan.');
            onStatusUpdate();
            onClose();
            return;
        }

        try {
            const { error } = await supabase.rpc('void_transaction', {
                p_transaction_id: transaction.id,
                p_void_reason: 'Dibatalkan oleh user melalui dashboard'
            });

            if (error) throw error;

            alert('Transaksi berhasil dibatalkan (void).');
            onStatusUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to void transaction:", error);
            alert("Gagal membatalkan transaksi.");
        }
    };

    const isVoided = transaction.status === 'void';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <LucideReceipt className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Detail Transaksi</h3>
                            <p className="text-sm text-zinc-500">{transaction.receipt_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isVoided && (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider">
                                VOID
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <LucideX className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5"><LucideCalendar className="h-3 w-3" /> Tanggal</p>
                            <p className="text-sm font-semibold">{new Date(transaction.sale_date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5"><LucideClock className="h-3 w-3" /> Waktu</p>
                            <p className="text-sm font-semibold">{transaction.sale_time.substring(0, 5)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">Channel</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-zinc-100 dark:bg-zinc-800">
                                {transaction.sale_channel}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">Pembayaran</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase bg-zinc-100 dark:bg-zinc-800">
                                {transaction.payment_method}
                            </span>
                        </div>
                    </div>

                    {transaction.customer_name && (
                        <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-3">
                            <LucideUser className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold">{transaction.customer_name}</p>
                                {transaction.notes && <p className="text-sm text-zinc-500 mt-1">Catatan: {transaction.notes}</p>}
                            </div>
                        </div>
                    )}

                    {/* Items List */}
                    <div>
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            <span>Item Pesanan</span>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">
                                {transaction.transaction_items.length}
                            </span>
                        </h4>
                        <div className="space-y-3">
                            {transaction.transaction_items.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-lg px-2 -mx-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{item.recipes?.name || 'Unknown Item'}</p>
                                        <p className="text-xs text-zinc-500">
                                            {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Total HPP (Modal)</span>
                            <span className="font-medium">Rp {transaction.total_hpp.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Estimasi Gross Profit</span>
                            <span className="font-medium text-emerald-600">
                                Rp {(transaction.total_amount - transaction.total_hpp).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="pt-3 border-t flex justify-between">
                            <span className="font-bold text-lg">Total Pembayaran</span>
                            <span className="font-black text-lg text-emerald-600">
                                Rp {transaction.total_amount.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                {!isVoided && (
                    <div className="p-6 border-t bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center">
                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                            <LucideAlertTriangle className="h-4 w-4 text-orange-500" />
                            Void akan mengembalikan stok & menghapus nilai pendapatan.
                        </div>
                        <button
                            onClick={handleVoid}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 text-red-600 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <LucideUndo2 className="h-4 w-4" />
                            Void Transaksi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
