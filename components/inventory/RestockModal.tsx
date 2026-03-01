import React, { useState } from 'react';
import { LucideX, LucidePlusCircle, LucideAlertCircle } from 'lucide-react';
import { Ingredient } from '../ingredients/IngredientManager';
import { cn } from '@/lib/utils';

interface RestockModalProps {
    ingredient: Ingredient;
    onClose: () => void;
    onSave: (quantity: number, price: number, updateBasePrice: boolean) => Promise<void>;
}

const RestockModal = ({ ingredient, onClose, onSave }: RestockModalProps) => {
    const [quantity, setQuantity] = useState<number>(0);
    const [price, setPrice] = useState<number>(ingredient.buyPrice || 0);
    const [updateBasePrice, setUpdateBasePrice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (quantity <= 0) return;
        setIsSubmitting(true);
        try {
            await onSave(quantity, price, updateBasePrice);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Restock: {ingredient.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <LucideX className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Jumlah Tambahan ({ingredient.stock_unit || ingredient.buyUnit})</label>
                        <input
                            type="number"
                            className="w-full h-10 rounded-lg border bg-background px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
                            placeholder="0"
                            value={quantity || ''}
                            onChange={e => setQuantity(Number(e.target.value))}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Harga Beli Baru (Total {ingredient.buyQuantity} {ingredient.buyUnit})</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">Rp</span>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg border bg-background pl-9 pr-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="0"
                                value={price || ''}
                                onChange={e => setPrice(Number(e.target.value))}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Default: Harga beli tersimpan</p>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold">Update Harga Master</h4>
                            <p className="text-[10px] text-muted-foreground">Jadikan harga ini sebagai patokan HPP baru.</p>
                        </div>
                        <div className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-zinc-200 dark:bg-zinc-800">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={updateBasePrice}
                                onChange={e => setUpdateBasePrice(e.target.checked)}
                            />
                            <span className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                updateBasePrice ? "translate-x-4" : "translate-x-0"
                            )} />
                        </div>
                    </label>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 p-3 rounded-lg flex gap-3 items-start">
                        <LucideAlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal">
                            Penambahan stok akan dicatat dalam histori log dan saldo stok akan langsung bertambah.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting || quantity <= 0}
                        className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <LucidePlusCircle className="h-4 w-4" />
                        {isSubmitting ? 'Menyimpan...' : 'Tambah Stok'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestockModal;
