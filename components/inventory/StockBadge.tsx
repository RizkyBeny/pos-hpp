import React from 'react';
import { StockStatus } from '@/types/pos';
import { cn } from '@/lib/utils'; // Assuming cn utility exists from v1.0 or shadcn-like setup

interface StockBadgeProps {
    quantity: number | null;
    minAlert: number | null;
    unit?: string;
    className?: string;
}

export function getStockStatus(qty: number | null, minAlert: number | null): StockStatus {
    if (qty === null) return 'not_set';
    if (qty < 0) return 'negative';
    if (qty === 0) return 'empty';
    if (minAlert !== null && qty <= minAlert) return 'low';
    return 'ok';
}

const StockBadge = ({ quantity, minAlert, unit = '', className }: StockBadgeProps) => {
    const status = getStockStatus(quantity, minAlert);

    const statusConfig = {
        not_set: {
            label: 'Belum Diset',
            styles: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
        },
        negative: {
            label: 'Negatif',
            styles: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
        },
        empty: {
            label: 'Habis',
            styles: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-500 border-red-100 dark:border-red-900'
        },
        low: {
            label: 'Hampir Habis',
            styles: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
        },
        ok: {
            label: 'Aman',
            styles: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        }
    };

    const config = statusConfig[status];
    const displayQty = (quantity !== null && !isNaN(quantity)) ? `${quantity.toLocaleString('id-ID')} ${unit}`.trim() : config.label;

    return (
        <div className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
            config.styles,
            className
        )}>
            {quantity !== null && (
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            )}
            {displayQty}
            {quantity !== null && status !== 'ok' && status !== 'not_set' && (
                <span className="ml-1 text-[10px] opacity-70">({config.label})</span>
            )}
        </div>
    );
};

export default StockBadge;
