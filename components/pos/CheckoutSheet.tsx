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
    onClose: () => void;
    isDemoMode?: boolean;
}

export default function CheckoutSheet({ onClose, isDemoMode = false }: CheckoutSheetProps) {
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

    const handleProcessSale = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                // Simulate success in demo mode
                await new Promise(resolve => setTimeout(resolve, 1500));
                setLastTrx({ receipt_number: `TRX-DEMO-${Math.floor(Math.random() * 10000)}` });
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
        <div className="animate-in fade-in duration-300">
            {/* Content Container */}
            <div className={cn(
                "relative bg-card w-full rounded-lg border flex flex-col min-h-[70vh] shadow-lg animate-in fade-in zoom-in-95 duration-500",
                success ? "border-zinc-200 dark:border-zinc-800" : ""
            )}>
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight">Checkout</h2>
                        <p className="text-sm text-muted-foreground font-medium">Lengkapi detail transaksi pelanggan</p>
                    </div>
                    {!loading && !success && (
                        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                            <LucideX className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {success ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-900 dark:text-zinc-50 border shadow-sm">
                            <LucideCheckCircle2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">Transaksi Berhasil</h3>
                            <p className="text-sm text-muted-foreground font-medium">
                                Struk: <span className="text-foreground font-bold">{lastTrx?.receipt_number}</span>
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col items-center gap-2">
                            <div className="flex gap-2">
                                <button className="h-10 px-4 rounded-md bg-zinc-900 text-zinc-50 text-sm font-bold flex items-center gap-2">
                                    <LucideReceipt className="h-4 w-4" /> Print Struk
                                </button>
                                <button onClick={onClose} className="h-10 px-4 rounded-md border text-sm font-bold">Tutup</button>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest pt-2">Menu ditutup otomatis...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                            {/* Sale Channel */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Saluran Penjualan</label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                    {(['walkin', 'whatsapp', 'manual'] as SaleChannel[]).map((channel) => (
                                        <button
                                            key={channel}
                                            onClick={() => setSaleChannel(channel)}
                                            className={cn(
                                                "py-2 rounded-sm text-xs font-bold transition-all",
                                                saleChannel === channel
                                                    ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                                                    : "text-zinc-500 hover:text-zinc-900"
                                            )}
                                        >
                                            {channel === 'walkin' ? 'Walk-in' : channel === 'whatsapp' ? 'WhatsApp' : 'Manual'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Metode Pembayaran</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['cash', 'transfer', 'qris', 'cod'] as PaymentMethod[]).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={cn(
                                                "py-2.5 rounded-md border text-xs font-bold uppercase transition-all",
                                                paymentMethod === method
                                                    ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 shadow-sm"
                                                    : "bg-background border-input hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Informasi Pelanggan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Nama Pelanggan"
                                            className="w-full h-10 bg-background border rounded-md pl-10 pr-4 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all"
                                            value={customerName}
                                            onChange={(e) => setCustomerInfo(e.target.value, customerContact)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <LucidePhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="WhatsApp / Phone"
                                            className="w-full h-10 bg-background border rounded-md pl-10 pr-4 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all"
                                            value={customerContact}
                                            onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Discount & Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Potongan Harga</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground mr-1">Rp</div>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full h-10 bg-background border rounded-md pl-10 pr-4 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all"
                                            value={discount || ''}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Catatan Pesanan</label>
                                    <textarea
                                        placeholder="Ekstra pedas, dll..."
                                        className="w-full h-10 bg-background border rounded-md px-4 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all resize-none"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} produk)</span>
                                        <span className="font-medium">Rp {getSubtotal().toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Diskon</span>
                                        <span className="font-medium text-red-500">- Rp {discount.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="border-t pt-4 flex items-center justify-between">
                                        <span className="text-base font-bold">Total Pembayaran</span>
                                        <span className="text-2xl font-bold tracking-tight">Rp {getTotal().toLocaleString('id-ID')}</span>
                                    </div>
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
                        <div className="p-6 border-t bg-muted/30">
                            <button
                                onClick={handleProcessSale}
                                disabled={loading || cart.length === 0}
                                className="w-full h-12 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-50 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <LucideLoader2 className="h-4 w-4 animate-spin" />
                                        Sedang memproses...
                                    </>
                                ) : (
                                    <>
                                        Konfirmasi Pembayaran
                                        <LucideReceipt className="h-4 w-4" />
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
