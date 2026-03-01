"use client";

import React, { useState } from 'react';
import { usePOSStore } from '@/lib/store/usePOSStore';
import {
    LucideShoppingBag,
    LucideChevronUp,
    LucideChevronDown,
    LucideTrash2,
    LucideMinus,
    LucidePlus,
    LucideCreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartBarProps {
    isDemoMode?: boolean;
    onCheckout: () => void;
}

export default function CartBar({ isDemoMode = false, onCheckout }: CartBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        cart,
        updateQuantity,
        removeFromCart,
        getSubtotal,
        getTotal,
        clearCart
    } = usePOSStore();

    if (cart.length === 0) return null;

    const subtotal = getSubtotal();
    const total = getTotal();

    return (
        <>
            <div className={cn(
                "fixed left-4 right-4 lg:left-80 lg:right-8 z-40 transition-all duration-300",
                isExpanded ? "bottom-[84px] lg:bottom-4 lg:shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]" : "bottom-20 lg:bottom-4"
            )}>
                {/* Expanded Cart Detail */}
                {isExpanded && (
                    <div className="bg-white dark:bg-zinc-900 border rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 mb-0 pb-4">
                        <div className="p-4 border-b flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                            <h3 className="font-bold text-sm">Pesanan Sekarang ({cart.length})</h3>
                            <button
                                onClick={() => clearCart()}
                                className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                Kosongkan
                            </button>
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3">
                            {cart.map((item) => (
                                <div key={item.recipe_id} className="flex items-center justify-between gap-3 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.recipe_name}</p>
                                        <p className="text-[11px] text-zinc-400">@ Rp {item.unit_price.toLocaleString('id-ID')}</p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.recipe_id, item.quantity - 1)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <LucideMinus className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.recipe_id, item.quantity + 1)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <LucidePlus className="h-3 w-3" />
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <p className="text-sm font-black">Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}</p>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.recipe_id)}
                                        className="h-8 w-8 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <LucideTrash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Bar */}
                <div className={cn(
                    "flex items-center gap-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 p-3 md:p-4 shadow-xl transition-all duration-300",
                    isExpanded ? "rounded-b-2xl" : "rounded-2xl"
                )}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-3 flex-1 text-left"
                    >
                        <div className="relative">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                                <LucideShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black">
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none mb-1">Total Pembayaran</span>
                            <span className="text-lg md:text-xl font-black leading-none">Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                        {isExpanded ? <LucideChevronDown className="h-5 w-5 ml-2 opacity-50" /> : <LucideChevronUp className="h-5 w-5 ml-2 opacity-50" />}
                    </button>

                    <button
                        onClick={onCheckout}
                        className="h-10 md:h-12 px-6 md:px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Bayar <LucideCreditCard className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                </div>
            </div>
        </>
    );
}
