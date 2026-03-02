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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Kasir</h2>
                    <p className="text-sm text-zinc-500 font-medium">Pilih menu untuk mulai transaksi</p>
                </div>

                {/* Mode Selector - Shadcn style tabs */}
                {mode !== 'checkout' && (
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 w-fit">
                        <button
                            onClick={() => setMode('walk-in')}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                mode === 'walk-in'
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <LucideStore className="h-3.5 w-3.5 mr-2 opacity-70" />
                            Walk-in
                        </button>
                        <button
                            onClick={() => setMode('whatsapp')}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                mode === 'whatsapp'
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <LucideMessageCircle className="h-3.5 w-3.5 mr-2 opacity-70" />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                mode === 'manual'
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                            )}
                        >
                            <LucideFileEdit className="h-3.5 w-3.5 mr-2 opacity-70" />
                            Manual
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
