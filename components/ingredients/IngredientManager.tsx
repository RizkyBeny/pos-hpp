"use client";

import React, { useState } from 'react';
import { LucidePlus, LucideTrash2, LucideEdit2, LucideSave, LucideX, LucideSearch, LucideArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StockBadge from '../inventory/StockBadge';
import StockOnboardingBanner from '../inventory/StockOnboardingBanner';
import StockInitWizard from '../inventory/StockInitWizard';
import RestockModal from '../inventory/RestockModal';

export type Unit = 'kg' | 'gr' | 'L' | 'ml' | 'pcs' | 'pack' | 'lusin';

export interface Ingredient {
    id: string;
    name: string;
    buyPrice: number;
    buyUnit: Unit;
    buyQuantity: number;
    weightPerUnit?: number;
    stock_quantity: number | null;
    stock_unit: string | null;
    min_stock_alert: number | null;
}

export const UNIT_OPTIONS: Unit[] = ['kg', 'gr', 'L', 'ml', 'pcs', 'pack', 'lusin'];

interface IngredientManagerProps {
    initialIngredients?: Ingredient[];
    onIngredientsChange?: (ingredients: Ingredient[]) => void;
    isDemoMode?: boolean;
}

export default function IngredientManager({
    initialIngredients = [],
    onIngredientsChange,
    isDemoMode = false
}: IngredientManagerProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
        name: '',
        buyPrice: 0,
        buyUnit: 'kg',
        buyQuantity: 1,
        weightPerUnit: 0,
        stock_quantity: null,
        stock_unit: 'gr',
        min_stock_alert: null,
    });
    const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    const [restockIngredient, setRestockIngredient] = useState<Ingredient | null>(null);

    const handleAdd = async () => {
        setStatusMsg(null);
        if (!formData.name.trim()) {
            setStatusMsg({ type: 'error', text: 'Nama bahan tidak boleh kosong.' });
            return;
        }
        if (formData.buyPrice <= 0 || formData.buyQuantity <= 0) {
            setStatusMsg({ type: 'error', text: 'Harga beli dan Kuantitas harus lebih dari 0.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isDemoMode) {
                // In demo mode, just update local state
                const newIng: Ingredient = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...formData
                };
                const newIngredients = [...ingredients, newIng];
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setFormData({
                    name: '', buyPrice: 0, buyUnit: 'kg', buyQuantity: 1, weightPerUnit: 0,
                    stock_quantity: null, stock_unit: 'gr', min_stock_alert: null
                });
                setIsAdding(false);
                setStatusMsg({ type: 'success', text: 'Bahan baku berhasil ditambahkan (Demo).' });
                setTimeout(() => setStatusMsg(null), 3000);
                return;
            }

            // Try full insert first
            let insertResult = await supabase
                .from('ingredients')
                .insert([{
                    name: formData.name.trim(),
                    buy_price: formData.buyPrice,
                    buy_quantity: formData.buyQuantity,
                    buy_unit: formData.buyUnit,
                    weight_per_unit: formData.weightPerUnit,
                    stock_quantity: formData.stock_quantity,
                    stock_unit: formData.stock_unit,
                    min_stock_alert: formData.min_stock_alert
                }])
                .select();

            // If columns are missing (stale schema cache), retry with minimal required fields only
            if (insertResult.error && insertResult.error.code === 'PGRST204') {
                console.warn('Some columns missing from schema cache, retrying with minimal fields...');
                insertResult = await supabase
                    .from('ingredients')
                    .insert([{
                        name: formData.name.trim(),
                        buy_price: formData.buyPrice,
                        buy_quantity: formData.buyQuantity,
                        buy_unit: formData.buyUnit,
                    }])
                    .select();
            }

            const { data, error } = insertResult;
            if (error) throw error;

            if (data) {
                const newIng: Ingredient = {
                    id: data[0].id,
                    name: data[0].name,
                    buyPrice: Number(data[0].buy_price),
                    buyQuantity: Number(data[0].buy_quantity),
                    buyUnit: data[0].buy_unit,
                    weightPerUnit: Number(data[0].weight_per_unit || 0),
                    stock_quantity: data[0].stock_quantity !== undefined && data[0].stock_quantity !== null ? Number(data[0].stock_quantity) : null,
                    stock_unit: data[0].stock_unit || formData.stock_unit,
                    min_stock_alert: data[0].min_stock_alert !== undefined && data[0].min_stock_alert !== null ? Number(data[0].min_stock_alert) : null,
                };
                const newIngredients = [...ingredients, newIng];
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
            }
            setFormData({
                name: '', buyPrice: 0, buyUnit: 'kg', buyQuantity: 1, weightPerUnit: 0,
                stock_quantity: null, stock_unit: 'gr', min_stock_alert: null
            });
            setIsAdding(false);
            setStatusMsg({ type: 'success', text: 'Bahan baku berhasil ditambahkan.' });
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (error: any) {
            console.error('Add failed:', error);
            const msg = error?.message || error?.code || 'Unknown error';
            setStatusMsg({ type: 'error', text: `Gagal menyimpan: ${msg}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setStatusMsg(null);
        if (!formData.name.trim() || formData.buyPrice <= 0 || formData.buyQuantity <= 0) {
            setStatusMsg({ type: 'error', text: 'Data tidak valid. Periksa nama, harga, dan kuantitas.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isDemoMode) {
                const newIngredients = ingredients.map(ing => ing.id === editingId ? { ...formData, id: editingId } : ing);
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setEditingId(null);
                setFormData({
                    name: '', buyPrice: 0, buyUnit: 'kg', buyQuantity: 1, weightPerUnit: 0,
                    stock_quantity: null, stock_unit: 'gr', min_stock_alert: null
                });
                setStatusMsg({ type: 'success', text: 'Perubahan berhasil disimpan (Demo).' });
                setTimeout(() => setStatusMsg(null), 3000);
                return;
            }

            let updateResult = await supabase
                .from('ingredients')
                .update({
                    name: formData.name.trim(),
                    buy_price: formData.buyPrice,
                    buy_quantity: formData.buyQuantity,
                    buy_unit: formData.buyUnit,
                    weight_per_unit: formData.weightPerUnit,
                    stock_quantity: formData.stock_quantity,
                    stock_unit: formData.stock_unit,
                    min_stock_alert: formData.min_stock_alert
                })
                .eq('id', editingId);

            // Fallback: retry with only core fields if schema cache is stale
            if (updateResult.error && updateResult.error.code === 'PGRST204') {
                console.warn('Some columns missing from schema cache, retrying with minimal fields...');
                updateResult = await supabase
                    .from('ingredients')
                    .update({
                        name: formData.name.trim(),
                        buy_price: formData.buyPrice,
                        buy_quantity: formData.buyQuantity,
                        buy_unit: formData.buyUnit,
                    })
                    .eq('id', editingId);
            }

            if (updateResult.error) throw updateResult.error;

            const newIngredients = ingredients.map(ing => ing.id === editingId ? { ...formData, id: editingId } : ing);
            setIngredients(newIngredients);
            onIngredientsChange?.(newIngredients);
            setEditingId(null);
            setFormData({
                name: '', buyPrice: 0, buyUnit: 'kg', buyQuantity: 1, weightPerUnit: 0,
                stock_quantity: null, stock_unit: 'gr', min_stock_alert: null
            });
            setStatusMsg({ type: 'success', text: 'Perubahan berhasil disimpan.' });
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (error: any) {
            console.error('Update failed:', error);
            const msg = error?.message || error?.code || 'Unknown error';
            setStatusMsg({ type: 'error', text: `Gagal mengupdate: ${msg}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (ing: Ingredient) => {
        setEditingId(ing.id);
        setFormData({
            name: ing.name,
            buyPrice: ing.buyPrice,
            buyUnit: ing.buyUnit,
            buyQuantity: ing.buyQuantity,
            weightPerUnit: ing.weightPerUnit || 0,
            stock_quantity: ing.stock_quantity,
            stock_unit: ing.stock_unit || 'gr',
            min_stock_alert: ing.min_stock_alert,
        });
    };

    const handleDeleteConfirm = async (id: string, name: string) => {
        setDeleteConfirmId(null);
        setStatusMsg(null);

        try {
            if (isDemoMode) {
                const newIngredients = ingredients.filter(ing => ing.id !== id);
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setStatusMsg({ type: 'success', text: `Bahan "${name}" berhasil dihapus (Demo).` });
                setTimeout(() => setStatusMsg(null), 3000);
                return;
            }

            // Check if ingredient is used in any recipe
            const { data: usageData, error: usageError } = await supabase
                .from('recipe_ingredients')
                .select('id')
                .eq('ingredient_id', id)
                .limit(1);

            if (usageError) throw usageError;

            if (usageData && usageData.length > 0) {
                setStatusMsg({
                    type: 'error',
                    text: `Gagal: "${name}" sedang digunakan dalam sebuah resep. Hapus bahan ini dari resep terlebih dahulu.`
                });
                return;
            }

            const { error } = await supabase
                .from('ingredients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            const newIngredients = ingredients.filter(ing => ing.id !== id);
            setIngredients(newIngredients);
            onIngredientsChange?.(newIngredients);
            setStatusMsg({ type: 'success', text: `Bahan "${name}" berhasil dihapus.` });
            setTimeout(() => setStatusMsg(null), 3000);
        } catch (error) {
            console.error('Delete failed:', error);
            setStatusMsg({ type: 'error', text: 'Gagal menghapus bahan baku. Ada masalah jaringan.' });
        }
    };

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const uninitializedCount = ingredients.filter(ing => ing.stock_quantity === null).length;

    const handleBulkStockInit = async (updates: Partial<Ingredient>[]) => {
        setIsSubmitting(true);
        setStatusMsg(null);
        try {
            if (isDemoMode) {
                const newIngredients = ingredients.map(ing => {
                    const update = updates.find(u => u.id === ing.id);
                    return update ? { ...ing, ...update } : ing;
                });
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setStatusMsg({ type: 'success', text: 'Stok awal berhasil diatur (Demo).' });
            } else {
                // Sequential updates for simplicity if no bulk RPC
                for (const update of updates) {
                    const { error } = await supabase
                        .from('ingredients')
                        .update({
                            stock_quantity: update.stock_quantity,
                            stock_unit: update.stock_unit,
                            min_stock_alert: update.min_stock_alert
                        })
                        .eq('id', update.id);
                    if (error) throw error;
                }
                const newIngredients = ingredients.map(ing => {
                    const update = updates.find(u => u.id === ing.id);
                    return update ? { ...ing, ...update } : ing;
                });
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setStatusMsg({ type: 'success', text: 'Stok awal berhasil diaktifkan.' });
            }
        } catch (error) {
            console.error('Bulk init failed:', error);
            setStatusMsg({ type: 'error', text: 'Gagal mengatur stok awal.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRestock = async (qty: number, price: number, updateBase: boolean) => {
        if (!restockIngredient) return;
        setIsSubmitting(true);
        try {
            if (isDemoMode) {
                const newIngredients = ingredients.map(ing =>
                    ing.id === restockIngredient.id
                        ? {
                            ...ing,
                            stock_quantity: (ing.stock_quantity || 0) + qty,
                            buyPrice: updateBase ? price : ing.buyPrice
                        }
                        : ing
                );
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setStatusMsg({ type: 'success', text: `Stok ${restockIngredient.name} berhasil ditambah (Demo).` });
            } else {
                const { error } = await supabase.rpc('restock_ingredient', {
                    p_user_id: (await supabase.auth.getUser()).data.user?.id,
                    p_ingredient_id: restockIngredient.id,
                    p_quantity_added: qty,
                    p_unit: restockIngredient.stock_unit || restockIngredient.buyUnit,
                    p_purchase_price: price,
                    p_update_base_price: updateBase,
                    p_notes: 'Restock via Inventory Manager'
                });

                if (error) throw error;

                const newIngredients = ingredients.map(ing =>
                    ing.id === restockIngredient.id
                        ? {
                            ...ing,
                            stock_quantity: (ing.stock_quantity || 0) + qty,
                            buyPrice: updateBase ? price : ing.buyPrice
                        }
                        : ing
                );
                setIngredients(newIngredients);
                onIngredientsChange?.(newIngredients);
                setStatusMsg({ type: 'success', text: `Stok ${restockIngredient.name} berhasil diperbarui.` });
            }
        } catch (error) {
            console.error('Restock failed:', error);
            setStatusMsg({ type: 'error', text: 'Gagal menambah stok.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventaris</h2>
                    <p className="text-muted-foreground">Kelola stok dan harga beli bahan baku operasional Anda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <LucideSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search ingredients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                    {!isAdding && !editingId && (
                        <button
                            onClick={() => { setIsAdding(true); setStatusMsg(null); }}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 transition-opacity dark:bg-zinc-50 dark:text-zinc-900"
                        >
                            <LucidePlus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Tambah Bahan</span>
                            <span className="sm:hidden">Tambah</span>
                        </button>
                    )}
                </div>
            </div>

            <StockOnboardingBanner
                uninitializedCount={uninitializedCount}
                onStartOnboarding={() => setShowWizard(true)}
            />

            {statusMsg && (
                <div className={`p-4 rounded-md text-sm font-medium animate-in slide-in-from-top-2 ${statusMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900' : 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900'}`}>
                    {statusMsg.text}
                </div>
            )}

            {(isAdding || editingId) && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col space-y-1.5 p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold leading-none tracking-tight">
                                {editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baru'}
                            </h3>
                            <button
                                onClick={() => { setIsAdding(false); setEditingId(null); }}
                                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                            >
                                <LucideX className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nama Bahan</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Flour"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Harga Beli (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.buyPrice || ''}
                                    onChange={e => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Satuan Beli</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="1"
                                        className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.buyQuantity || ''}
                                        onChange={e => setFormData({ ...formData, buyQuantity: Number(e.target.value) })}
                                    />
                                    <select
                                        className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.buyUnit}
                                        onChange={e => setFormData({ ...formData, buyUnit: e.target.value as Unit })}
                                    >
                                        {UNIT_OPTIONS.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {['pcs', 'pack', 'lusin'].includes(formData.buyUnit) && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-900 dark:text-zinc-50">Berat/Vol Konversi (gr/ml)</label>
                                    <input
                                        type="number"
                                        placeholder="Optional"
                                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                                        value={formData.weightPerUnit || ''}
                                        onChange={e => setFormData({ ...formData, weightPerUnit: Number(e.target.value) })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Stok Awal (Opsional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={formData.stock_quantity === null ? '' : formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: e.target.value === '' ? null : Number(e.target.value) })}
                                    />
                                    <select
                                        className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={formData.stock_unit || 'gr'}
                                        onChange={e => setFormData({ ...formData, stock_unit: e.target.value })}
                                    >
                                        <option value="gr">gram (gr)</option>
                                        <option value="kg">kilogram (kg)</option>
                                        <option value="ml">mililiter (ml)</option>
                                        <option value="L">liter (L)</option>
                                        <option value="pcs">pieces (pcs)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Min. Alert</label>
                                <input
                                    type="number"
                                    placeholder="Alert limit"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={formData.min_stock_alert === null ? '' : formData.min_stock_alert}
                                    onChange={e => setFormData({ ...formData, min_stock_alert: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center p-6 pt-0 justify-end gap-2">
                        <button
                            onClick={() => {
                                setIsAdding(false); setEditingId(null); setFormData({
                                    name: '', buyPrice: 0, buyUnit: 'kg', buyQuantity: 1, weightPerUnit: 0,
                                    stock_quantity: null, stock_unit: 'gr', min_stock_alert: null
                                });
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={editingId ? handleSaveEdit : handleAdd}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 transition-opacity dark:bg-zinc-50 dark:text-zinc-900 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Ingredient')}
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Bahan</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Harga Satuan</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Beli</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Stok (Live)</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredIngredients.length === 0 ? (
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <td colSpan={4} className="p-4 align-middle text-center text-muted-foreground py-10 italic">
                                        No ingredients found.
                                    </td>
                                </tr>
                            ) : (
                                filteredIngredients.map((ing) => (
                                    <tr key={ing.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group">
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{ing.name}</span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    {ing.weightPerUnit ? `Conversion: ${ing.weightPerUnit}gr per ${ing.buyUnit === 'lusin' ? 'pcs' : ing.buyUnit}` : 'Standard Unit'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle font-medium">Rp {ing.buyPrice.toLocaleString('id-ID')}</td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 border">
                                                {ing.buyQuantity} {ing.buyUnit}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <StockBadge
                                                quantity={ing.stock_quantity}
                                                minAlert={ing.min_stock_alert}
                                                unit={ing.stock_unit || ''}
                                            />
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {deleteConfirmId === ing.id ? (
                                                <div className="flex justify-end items-center gap-2 animate-in fade-in zoom-in duration-200">
                                                    <span className="text-xs font-medium text-red-500 mr-2">Hapus?</span>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                                                    >
                                                        <LucideX className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteConfirm(ing.id, ing.name)}
                                                        className="h-8 px-2 flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                                    >
                                                        Ya
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    {ing.stock_quantity !== null && (
                                                        <button
                                                            onClick={() => setRestockIngredient(ing)}
                                                            title="Tambah Stok"
                                                            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition-colors border"
                                                        >
                                                            <LucideArrowRight className="h-4 w-4 -rotate-45" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => startEdit(ing)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors border"
                                                    >
                                                        <LucideEdit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(ing.id)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors border"
                                                    >
                                                        <LucideTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showWizard && (
                <StockInitWizard
                    ingredients={ingredients}
                    onClose={() => setShowWizard(false)}
                    onSave={handleBulkStockInit}
                />
            )}

            {restockIngredient && (
                <RestockModal
                    ingredient={restockIngredient}
                    onClose={() => setRestockIngredient(null)}
                    onSave={handleRestock}
                />
            )}
        </div>
    );
}
