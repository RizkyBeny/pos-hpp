"use client";

import React, { useState } from 'react';
import QuickSaleGrid from './QuickSaleGrid';
import CartBar from './CartBar';
import WAOrderForm from './WAOrderForm';
import ManualEntryForm from './ManualEntryForm';
import CheckoutSheet from './CheckoutSheet';
import { usePOSStore } from '@/lib/store/usePOSStore';
import { LucideLayoutGrid, LucideReceipt, LucideMessageCircle, LucideFileEdit, LucideStore } from 'lucide-react';
import { cn } from '@/lib/utils';

interface POSPageProps {
    isDemoMode?: boolean;
}

type POSMode = 'walk-in' | 'whatsapp' | 'manual' | 'checkout';

export default function POSPage({ isDemoMode = false }: POSPageProps) {
    const { cart } = usePOSStore();
    const [mode, setMode] = useState<POSMode>('walk-in');

    return (
        <div className={cn(
            "flex flex-col h-full space-y-6 animate-in fade-in duration-500",
            mode === 'walk-in' ? "pb-32" : "pb-12"
        )}>
            {/* POS Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Kasir (POS)</h2>
                    <p className="text-sm text-muted-foreground font-medium">Klik menu untuk menambah pesanan</p>
                </div>

                {/* Mode Selector Tabs */}
                {mode !== 'checkout' && (
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setMode('walk-in')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                mode === 'walk-in'
                                    ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <LucideStore className="h-4 w-4" />
                            Walk-in
                        </button>
                        <button
                            onClick={() => setMode('whatsapp')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                mode === 'whatsapp'
                                    ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <LucideMessageCircle className="h-4 w-4" />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                mode === 'manual'
                                    ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <LucideFileEdit className="h-4 w-4" />
                            Entry Manual
                        </button>
                    </div>
                )}
            </div>

            {/* QuickSaleGrid is shared across non-checkout modes to add items */}
            {mode !== 'checkout' && (
                <div className="grid grid-cols-1 gap-6">
                    <QuickSaleGrid isDemoMode={isDemoMode} />
                </div>
            )}

            <div className="pt-4 border-t">
                {mode === 'whatsapp' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <WAOrderForm isDemoMode={isDemoMode} />
                    </div>
                )}

                {mode === 'manual' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <ManualEntryForm isDemoMode={isDemoMode} />
                    </div>
                )}

                {mode === 'checkout' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <CheckoutSheet
                            onClose={() => setMode('walk-in')}
                            isDemoMode={isDemoMode}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Floating Cart Bar is ONLY for Walk-in Mode */}
            {mode === 'walk-in' && <CartBar isDemoMode={isDemoMode} onCheckout={() => setMode('checkout')} />}
        </div>
    );
}
