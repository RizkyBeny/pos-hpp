import React, { useState } from 'react';
import { LucideX, LucideChevronLeft, LucideChevronRight, LucideCheck, LucidePackage } from 'lucide-react';
import { Ingredient } from '../ingredients/IngredientManager';
import { cn } from '@/lib/utils';

interface StockInitWizardProps {
    ingredients: Ingredient[];
    onClose: () => void;
    onSave: (updates: Partial<Ingredient>[]) => Promise<void>;
}

const StockInitWizard = ({ ingredients, onClose, onSave }: StockInitWizardProps) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [selections, setSelections] = useState<Record<string, { qty: number, unit: string, alert: number }>>(
        ingredients.reduce((acc, ing) => ({
            ...acc,
            [ing.id]: { qty: 0, unit: ing.stock_unit || 'gr', alert: 0 }
        }), {})
    );

    const uninitializedIngredients = ingredients.filter(ing => ing.stock_quantity === null);
    const totalSteps = 3;

    const handleUpdateSelection = (id: string, field: string, value: any) => {
        setSelections(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            const updates = uninitializedIngredients.map(ing => ({
                id: ing.id,
                stock_quantity: selections[ing.id].qty,
                stock_unit: selections[ing.id].unit,
                min_stock_alert: selections[ing.id].alert || null
            }));
            await onSave(updates);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/10">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Setup Stok Awal</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Langkah {step} dari {totalSteps}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors">
                        <LucideX className="h-5 w-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <LucidePackage className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Konfirmasi Bahan Baku</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Kami menemukan {uninitializedIngredients.length} bahan yang belum ada data stoknya. Anda akan mengatur stok untuk bahan-bahan ini.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                                {uninitializedIngredients.map(ing => (
                                    <div key={ing.id} className="p-3 rounded-lg border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white dark:bg-zinc-900 border dark:border-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                            {ing.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium truncate">{ing.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold mb-4">Input Jumlah Stok Live</h3>
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {uninitializedIngredients.map(ing => (
                                    <div key={ing.id} className="p-4 rounded-xl border dark:border-zinc-800 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-sm">{ing.name}</span>
                                            <span className="text-xs text-muted-foreground">Satuan: {ing.stock_unit || 'gr'}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Jumlah Stok</label>
                                                <input
                                                    type="number"
                                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                    placeholder="0"
                                                    value={selections[ing.id].qty || ''}
                                                    onChange={e => handleUpdateSelection(ing.id, 'qty', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Satuan Stok</label>
                                                <select
                                                    className="w-full h-9 rounded-md border bg-background px-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                    value={selections[ing.id].unit}
                                                    onChange={e => handleUpdateSelection(ing.id, 'unit', e.target.value)}
                                                >
                                                    <option value="gr">gram (gr)</option>
                                                    <option value="kg">kg</option>
                                                    <option value="ml">ml</option>
                                                    <option value="L">L</option>
                                                    <option value="pcs">pcs</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-semibold mb-4">Set Batas Alert (Opsional)</h3>
                            <p className="text-xs text-muted-foreground mb-4">Dapatkan peringatan jika stok bahan Anda berada di bawah angka ini.</p>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {uninitializedIngredients.map(ing => (
                                    <div key={ing.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-zinc-800">
                                        <span className="text-sm font-medium">{ing.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-24 h-9 rounded-md border bg-background px-3 text-sm text-right focus:ring-1 focus:ring-emerald-500 outline-none"
                                                placeholder="0"
                                                value={selections[ing.id].alert || ''}
                                                onChange={e => handleUpdateSelection(ing.id, 'alert', Number(e.target.value))}
                                            />
                                            <span className="text-xs text-muted-foreground w-8">{selections[ing.id].unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Nav */}
                <div className="px-6 py-4 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                    >
                        <LucideChevronLeft className="h-4 w-4" />
                        {step === 1 ? 'Batal' : 'Kembali'}
                    </button>

                    {step < totalSteps ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
                        >
                            Lanjut
                            <LucideChevronRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 h-10 px-8 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Selesai & Aktifkan'}
                            <LucideCheck className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockInitWizard;
