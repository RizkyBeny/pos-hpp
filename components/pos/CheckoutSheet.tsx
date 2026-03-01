"use client";

import React, { useState } from 'react';
import { usePOSStore } from '@/lib/store/usePOSStore';
import { supabase } from '@/lib/supabase';
import {
    LucideX,
    LucideUser,
    LucidePhone,
    LucideTag,
    LucideCheckCircle2,
    LucideAlertCircle,
    LucideLoader2,
    LucideReceipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaleChannel, PaymentMethod } from '@/types/pos';

interface CheckoutSheetProps {
    isOpen: boolean;
    onClose: () => void;
    isDemoMode?: boolean;
}

export default function CheckoutSheet({ isOpen, onClose, isDemoMode = false }: CheckoutSheetProps) {
    const {
        cart,
        saleChannel,
        paymentMethod,
        discount,
        customerName,
        customerContact,
        notes,
        setSaleChannel,
        setPaymentMethod,
        setDiscount,
        setCustomerInfo,
        setNotes,
        getTotal,
        getSubtotal,
        clearCart
    } = usePOSStore();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTrx, setLastTrx] = useState<any>(null);

    if (!isOpen) return null;

    const handleProcessSale = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                // Simulate success in demo mode
                await new Promise(resolve => setTimeout(resolve, 1500));
                setLastTrx({ trx_number: `TRX-DEMO-${Math.floor(Math.random() * 10000)}` });
                setSuccess(true);
                setTimeout(() => {
                    clearCart();
                    setSuccess(false);
                    onClose();
                }, 3000);
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error("User not authenticated");

            const saleItems = cart.map(item => ({
                recipe_id: item.recipe_id,
                recipe_name: item.recipe_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                hpp_at_sale: item.hpp
            }));

            const { data, error: rpcError } = await supabase.rpc('process_sale', {
                p_user_id: userData.user.id,
                p_sale_channel: saleChannel,
                p_payment_method: paymentMethod,
                p_customer_name: customerName,
                p_customer_contact: customerContact,
                p_discount: discount,
                p_notes: notes,
                p_sale_date: new Date().toISOString().split('T')[0],
                p_sale_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                p_items: saleItems
            });

            if (rpcError) throw rpcError;

            setLastTrx(data);
            setSuccess(true);
            setTimeout(() => {
                clearCart();
                setSuccess(false);
                onClose();
            }, 3000);

        } catch (err: any) {
            console.error("Sale processing failed:", err);
            setError(err.message || "Gagal memproses transaksi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
                onClick={!loading ? onClose : undefined}
            />

            {/* Content */}
            <div className={cn(
                "relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 duration-300",
                success && "border-2 border-emerald-500"
            )}>
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">Checkout</h2>
                        <p className="text-xs text-zinc-400 font-medium">Selesaikan transaksi pelanggan</p>
                    </div>
                    {!loading && !success && (
                        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <LucideX className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {success ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                            <LucideCheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black">Transaksi Berhasil!</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                                Nomor struk: <span className="text-zinc-900 dark:text-zinc-100 font-black">{lastTrx?.trx_number}</span>
                            </p>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pt-4">Menutup otomatis...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {/* Sale Channel */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Saluran Penjualan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['walkin', 'whatsapp', 'manual'] as SaleChannel[]).map((channel) => (
                                        <button
                                            key={channel}
                                            onClick={() => setSaleChannel(channel)}
                                            className={cn(
                                                "py-3 rounded-xl border text-[10px] font-black uppercase transition-all",
                                                saleChannel === channel
                                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10"
                                                    : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                                            )}
                                        >
                                            {channel === 'walkin' ? 'Walk-in' : channel === 'whatsapp' ? 'WhatsApp' : 'Manual'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Metode Pembayaran</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['cash', 'transfer', 'qris', 'cod'] as PaymentMethod[]).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={cn(
                                                "py-3 rounded-xl border text-[10px] font-black uppercase transition-all",
                                                paymentMethod === method
                                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10"
                                                    : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                                            )}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Informasi Pelanggan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="Nama Pelanggan"
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 pl-9 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                            value={customerName}
                                            onChange={(e) => setCustomerInfo(e.target.value, customerContact)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <LucidePhone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="WhatsApp / Phone"
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 pl-9 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                            value={customerContact}
                                            onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Discount & Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Potongan Harga</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">Rp</div>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-3 pl-9 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                            value={discount || ''}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Catatan Pesanan</label>
                                    <textarea
                                        placeholder="Ekstra pedas, dll..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all h-[42px] resize-none"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-zinc-900 border rounded-2xl p-4 text-white space-y-3 shadow-xl">
                                <div className="flex items-center justify-between text-[11px] font-bold opacity-60 uppercase tracking-widest">
                                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} pcs)</span>
                                    <span>Rp {getSubtotal().toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-red-400 uppercase tracking-widest">
                                    <span>Diskon</span>
                                    <span>- Rp {discount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black uppercase tracking-widest">Total Bayar</span>
                                    <span className="text-2xl font-black">Rp {getTotal().toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-shake">
                                    <LucideAlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 border-t bg-zinc-50/50 dark:bg-emerald-950/5">
                            <button
                                onClick={handleProcessSale}
                                disabled={loading || cart.length === 0}
                                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-black shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <LucideLoader2 className="h-5 w-5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Bayar Sekarang
                                        <LucideReceipt className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
