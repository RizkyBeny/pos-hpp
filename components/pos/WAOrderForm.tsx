"use client";

import React, { useState } from 'react';
import { usePOSStore } from '@/lib/store/usePOSStore';
import { LucidePhone, LucideUser, LucideCalendar, LucideSearch, LucidePlus, LucideTrash2, LucideCheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WAOrderFormProps {
    isDemoMode?: boolean;
}

export default function WAOrderForm({ isDemoMode = false }: WAOrderFormProps) {
    const { cart, removeFromCart, updateQuantity, clearCart } = usePOSStore();
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const total = subtotal; // Assuming no discount form in WA for now, or we can add it later

    const handleSaveOrder = async () => {
        if (!customerName.trim() || cart.length === 0) {
            alert('Nama pelanggan dan minimal 1 item harus diisi.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isDemoMode) {
                setTimeout(() => {
                    setSuccessMessage(`Order WA dari ${customerName} berhasil disimpan (Demo).`);
                    clearCart();
                    setCustomerName('');
                    setCustomerContact('');
                    setNotes('');
                    setIsSubmitting(false);
                    setTimeout(() => setSuccessMessage(null), 3000);
                }, 1000);
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('process_sale', {
                p_user_id: userData.user.id,
                p_sale_channel: 'whatsapp',
                p_payment_method: paymentMethod,
                p_customer_name: customerName,
                p_customer_contact: customerContact,
                p_discount: 0,
                p_notes: notes,
                p_sale_date: saleDate,
                p_sale_time: new Date().toTimeString().split(' ')[0], // Current time
                p_items: cart.map(item => ({
                    recipe_id: item.recipe_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    hpp_at_sale: item.hpp
                }))
            });

            if (error) throw error;

            setSuccessMessage(`Order WA dari ${customerName} berhasil disimpan.`);
            clearCart();
            setCustomerName('');
            setCustomerContact('');
            setNotes('');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save WA order:', error);
            alert('Gagal menyimpan order. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <LucideCheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-medium">{successMessage}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Detail Pemesanan (WA)</h3>
                            <p className="text-sm text-muted-foreground">Isi data pelanggan dan informasi order.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Nama Pelanggan *</label>
                                <div className="relative">
                                    <LucideUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="Misal: Budi Santoso"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">No. WhatsApp</label>
                                <div className="relative">
                                    <LucidePhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="tel"
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="081234567890"
                                        value={customerContact}
                                        onChange={(e) => setCustomerContact(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tanggal Pemesanan</label>
                                    <div className="relative">
                                        <LucideCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <input
                                            type="date"
                                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={saleDate}
                                            onChange={(e) => setSaleDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Status / Pembayaran</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cod">COD (Bayar Ditempat)</option>
                                        <option value="transfer">Transfer Bank / E-Wallet</option>
                                        <option value="qris">QRIS</option>
                                        <option value="cash">Tunai</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Catatan Khusus</label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
                                    placeholder="Misal: Jangan pakai bawang goreng, antar jam 12 siang."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cart Section Specific to WA Order */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Daftar Pesanan</h3>
                            <p className="text-sm text-muted-foreground">Silakan gunakan tab "Cari Menu" di atas untuk menambah pesanan jika kosong.</p>
                        </div>
                        <div className="p-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500 font-medium border-2 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                    Pesanan masih kosong.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.recipe_id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4 sm:gap-0 last:border-0 last:pb-0">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm w-full sm:w-auto truncate">{item.recipe_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="number"
                                                        className="h-8 w-24 px-2 rounded-md border text-sm text-right bg-zinc-50 dark:bg-zinc-900"
                                                        value={item.unit_price}
                                                        onChange={() => { }}
                                                        readOnly
                                                        title="Harga Jual per Item"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full">
                                                <div className="flex items-center border rounded-lg bg-white dark:bg-zinc-900 h-8">
                                                    <button
                                                        onClick={() => updateQuantity(item.recipe_id, item.quantity - 1)}
                                                        className="w-8 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"
                                                    >-</button>
                                                    <span className="w-8 text-center text-sm font-bold border-x">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.recipe_id, item.quantity + 1)}
                                                        className="w-8 flex items-center justify-center text-zinc-500 hover:text-emerald-500 transition-colors"
                                                    >+</button>
                                                </div>
                                                <div className="flex-1 sm:w-24 text-right">
                                                    <p className="text-sm font-bold tracking-tight">Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.recipe_id)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all shrink-0"
                                                >
                                                    <LucideTrash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500 font-medium">Subtotal</span>
                                            <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg font-black text-emerald-600">
                                            <span>Total Tagihan</span>
                                            <span>Rp {total.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleSaveOrder}
                                            disabled={isSubmitting || cart.length === 0}
                                            className="w-full flex items-center justify-center h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan WA'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
