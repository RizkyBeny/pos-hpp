import React from 'react';
import { LucideAlertCircle, LucideChevronRight } from 'lucide-react';

interface StockOnboardingBannerProps {
    uninitializedCount: number;
    onStartOnboarding: () => void;
}

const StockOnboardingBanner = ({ uninitializedCount, onStartOnboarding }: StockOnboardingBannerProps) => {
    if (uninitializedCount === 0) return null;

    return (
        <div className="relative overflow-hidden rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-4 transition-all hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30">
            <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-emerald-100 dark:bg-emerald-900 p-2 text-emerald-600 dark:text-emerald-400">
                    <LucideAlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                        Aktifkan Manajemen Stok
                    </h3>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 max-w-2xl">
                        Ada {uninitializedCount} bahan yang belum memiliki data stok. Aktifkan manajemen stok untuk melacak penggunaan bahan baku secara otomatis saat penjualan dilakukan.
                    </p>
                    <div className="pt-2">
                        <button
                            onClick={onStartOnboarding}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors group"
                        >
                            Mulai Set Stok Sekarang
                            <LucideChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/20 dark:bg-emerald-800/10 blur-3xl pointer-events-none" />
        </div>
    );
};

export default StockOnboardingBanner;
