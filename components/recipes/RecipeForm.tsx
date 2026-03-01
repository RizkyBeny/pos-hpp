"use client";

import React, { useState, useMemo } from 'react';
import {
    LucidePlus,
    LucideTrash2,
    LucideChefHat,
    LucideUtensils,
    LucideCoffee,
    LucideInfo,
    LucideZap,
    LucidePackage,
    LucideTrendingUp,
    LucideArrowRight,
    LucideDownload,
    LucideSave,
    LucideChevronRight,
    LucideCamera,
    LucideImage as LucideImageIcon
} from 'lucide-react';
import { Ingredient, Unit } from '../ingredients/IngredientManager';
import { calculateItemCost } from '@/utils/conversions';
import ExportTemplate from './ExportTemplate';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import { useDemoRecipes } from '@/lib/store/useDemoRecipes';

export type RecipeCategory = 'Makanan' | 'Minuman';

interface RecipeIngredient {
    ingredientId: string;
    quantity: number;
    unit: Unit;
}

export type OverheadCategory = 'Energi' | 'Kemasan' | 'Tenaga Kerja' | 'Lainnya';

interface OverheadItem {
    id: string;
    name: string;
    cost: number;
    category: OverheadCategory;
}

interface RecipeFormProps {
    availableIngredients: Ingredient[];
    isDemoMode?: boolean;
}

export default function RecipeForm({ availableIngredients, isDemoMode = false }: RecipeFormProps) {
    const [recipeName, setRecipeName] = useState('');
    const [category, setCategory] = useState<RecipeCategory>('Makanan');
    const [portions, setPortions] = useState(1);
    const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);
    const [overheads, setOverheads] = useState<OverheadItem[]>([]);
    const [margin, setMargin] = useState(50);
    const [isMenuItem, setIsMenuItem] = useState(true);
    const [recipeImage, setRecipeImage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
    const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

    const exportRef = React.useRef<HTMLDivElement>(null);

    const handleSaveRecipe = async () => {
        if (!recipeName) {
            setSaveErrorMsg('Nama produk harus diisi.');
            setTimeout(() => setSaveErrorMsg(null), 3000);
            return;
        }

        if (isDemoMode) {
            const addDemoRecipe = useDemoRecipes.getState().addRecipe;
            addDemoRecipe({
                id: Math.random().toString(36).substr(2, 9),
                name: recipeName,
                category: category,
                portions: portions,
                margin_percentage: margin,
                is_menu_item: isMenuItem,
                image: recipeImage || undefined,
                created_at: new Date().toISOString(),
                total_hpp: totalHPP,
                recipe_ingredients: selectedIngredients.filter(i => i.ingredientId && i.quantity > 0).map(i => ({
                    quantity: i.quantity,
                    unit: i.unit,
                    ingredients: availableIngredients.find(ai => ai.id === i.ingredientId)
                })),
                recipe_overheads: overheads.filter(o => o.name && o.cost > 0)
            });
            setSaveSuccessMsg('Mode Demo: Kalkulasi berhasil disimpan sementara!');
            setTimeout(() => setSaveSuccessMsg(null), 3000);
            setRecipeName('');
            setRecipeImage(null);
            setSelectedIngredients([]);
            setOverheads([]);
            return;
        }

        setIsSubmitting(true);

        try {
            // Try inserting with all fields first (including optional is_menu_item, image)
            let recipeResult = await supabase
                .from('recipes')
                .insert([{
                    name: recipeName,
                    category: category,
                    portions: portions,
                    margin_percentage: margin,
                    is_menu_item: isMenuItem,
                    image: recipeImage
                }])
                .select();

            // If optional columns are missing (stale schema cache), retry with core fields only
            if (recipeResult.error && recipeResult.error.code === 'PGRST204') {
                console.warn('Optional columns not in schema, retrying with core fields...');
                recipeResult = await supabase
                    .from('recipes')
                    .insert([{
                        name: recipeName,
                        category: category,
                        portions: portions,
                        margin_percentage: margin,
                    }])
                    .select();
            }

            if (recipeResult.error) throw recipeResult.error;
            const recipeId = recipeResult.data[0].id;

            const validIngredients = selectedIngredients.filter(item => item.ingredientId && item.quantity > 0);

            if (validIngredients.length > 0) {
                const recipeIngs = validIngredients.map(item => ({
                    recipe_id: recipeId,
                    ingredient_id: item.ingredientId,
                    quantity: item.quantity,
                    unit: item.unit
                }));

                const { error: ingError } = await supabase
                    .from('recipe_ingredients')
                    .insert(recipeIngs);

                if (ingError) throw ingError;
            }

            const recipeOverheads = overheads.map(item => ({
                recipe_id: recipeId,
                name: item.name,
                cost: item.cost,
                category: item.category
            }));

            if (recipeOverheads.length > 0) {
                const { error: ohError } = await supabase
                    .from('recipe_overheads')
                    .insert(recipeOverheads);
                if (ohError) throw ohError;
            }

            setSaveSuccessMsg('Resep dan kalkulasi berhasil disimpan!');
            setTimeout(() => setSaveSuccessMsg(null), 4000);
            setRecipeName('');
            setRecipeImage(null);
            setSelectedIngredients([]);
            setOverheads([]);
        } catch (error: any) {
            console.error('Save failed:', error);
            setSaveErrorMsg(`Gagal menyimpan: ${error?.message || error?.code || 'Unknown error'}`);
            setTimeout(() => setSaveErrorMsg(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async (format: 'png' | 'pdf') => {
        if (!exportRef.current) return;
        setIsExporting(true);

        try {
            if (format === 'png') {
                const dataUrl = await htmlToImage.toPng(exportRef.current, {
                    quality: 0.95,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2
                });
                const link = document.createElement('a');
                link.download = `HPP-${recipeName || 'Produk'}-${new Date().getTime()}.png`;
                link.href = dataUrl;
                link.click();
            } else {
                const dataUrl = await htmlToImage.toPng(exportRef.current, {
                    quality: 0.95,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2
                });
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, 0);
                pdf.save(`HPP-${recipeName || 'Produk'}-${new Date().getTime()}.pdf`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Gagal mengunduh laporan.');
        } finally {
            setIsExporting(false);
        }
    };

    const addIngredientSlot = () => {
        setSelectedIngredients([...selectedIngredients, { ingredientId: '', quantity: 0, unit: 'gr' }]);
    };

    const removeIngredientSlot = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredientSlot = (index: number, data: Partial<RecipeIngredient>) => {
        setSelectedIngredients(selectedIngredients.map((item, i) => i === index ? { ...item, ...data } : item));
    };

    const addOverhead = () => {
        setOverheads([...overheads, { id: Math.random().toString(36).substr(2, 9), name: '', cost: 0, category: 'Lainnya' }]);
    };

    const removeOverhead = (id: string) => {
        setOverheads(overheads.filter(o => o.id !== id));
    };

    const updateOverhead = (id: string, data: Partial<OverheadItem>) => {
        setOverheads(overheads.map(o => o.id === id ? { ...o, ...data } : o));
    };

    const ingredientHPP = useMemo(() => {
        return selectedIngredients.reduce((sum, item) => {
            const ingredient = availableIngredients.find(ing => ing.id === item.ingredientId);
            if (!ingredient) return sum;
            return sum + calculateItemCost(
                item.quantity,
                item.unit,
                ingredient.buyPrice,
                ingredient.buyQuantity,
                ingredient.buyUnit,
                ingredient.weightPerUnit
            );
        }, 0);
    }, [selectedIngredients, availableIngredients]);

    const totalOverhead = useMemo(() => {
        return overheads.reduce((sum, o) => sum + (o.cost || 0), 0);
    }, [overheads]);

    const totalHPP = ingredientHPP + totalOverhead;
    const hppPerPortion = portions > 0 ? totalHPP / portions : 0;

    const sellingPrice = hppPerPortion * (1 + margin / 100);
    const profitPerPortion = sellingPrice - hppPerPortion;

    return (
        <div className="space-y-6">
            {/* Toast Notifications */}
            {saveSuccessMsg && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-5 duration-300">
                    <LucideSave className="h-4 w-4" />
                    <span className="text-sm font-semibold">{saveSuccessMsg}</span>
                </div>
            )}
            {saveErrorMsg && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-5 duration-300">
                    <span className="text-sm font-semibold">{saveErrorMsg}</span>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kalkulasi Baru</h2>
                    <p className="text-muted-foreground">Hitung HPP produk dengan detail bahan dan biaya operasional.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSaveRecipe}
                        disabled={isSubmitting}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-900 transition-opacity disabled:opacity-50"
                    >
                        <LucideSave className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Resep'}
                    </button>
                    <button
                        onClick={() => handleExport('png')}
                        disabled={isExporting}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                    >
                        <LucideDownload className="h-4 w-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col space-y-1.5 p-6 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Informasi Dasar</h3>
                            <p className="text-sm text-muted-foreground">Detail nama produk dan target porsi.</p>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left Column - Image Portrait */}
                                <div className="w-full max-w-[240px] mx-auto md:max-w-none md:w-1/3 space-y-2 shrink-0">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Foto Menu</label>
                                    <div className="relative group cursor-pointer">
                                        <div className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-all group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 group-hover:border-zinc-300 dark:group-hover:border-zinc-700">
                                            {recipeImage ? (
                                                <div className="relative h-full w-full">
                                                    <img src={recipeImage} alt="Preview" className="h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <LucideCamera className="h-6 w-6 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                    <LucideCamera className="h-8 w-8" />
                                                    <span className="text-[10px] font-medium text-center px-4">Upload Foto (Portrait 3:4)</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) return alert('Ukuran foto terlalu besar (maks 2MB)');
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setRecipeImage(reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center">Max 2MB, Portrait recommended</p>
                                </div>

                                {/* Right Column - Fields */}
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Nama Produk</label>
                                        <input
                                            type="text"
                                            placeholder="Nasi Goreng Spesial"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={recipeName}
                                            onChange={e => setRecipeName(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-widest text-[10px]">Kategori</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setCategory('Makanan')}
                                                    className={`flex-1 h-10 rounded-md text-xs font-bold transition-all ${category === 'Makanan' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-md' : 'border hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                                                >
                                                    Makanan
                                                </button>
                                                <button
                                                    onClick={() => setCategory('Minuman')}
                                                    className={`flex-1 h-10 rounded-md text-xs font-bold transition-all ${category === 'Minuman' ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-md' : 'border hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                                                >
                                                    Minuman
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none text-muted-foreground uppercase tracking-widest text-[10px]">Porsi per Batch</label>
                                            <input
                                                type="number"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-bold"
                                                value={portions || ''}
                                                onChange={e => setPortions(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-dashed">
                                        <label className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Tampilkan di Menu Kasir</p>
                                                <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/50">Menu ini akan muncul secara otomatis di halaman POS</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                                                checked={isMenuItem}
                                                onChange={e => setIsMenuItem(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients Card */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b">
                            <div className="space-y-1.5">
                                <h3 className="font-semibold leading-none tracking-tight">Komposisi Bahan</h3>
                                <p className="text-sm text-muted-foreground">List bahan baku yang digunakan.</p>
                            </div>
                            <button
                                onClick={addIngredientSlot}
                                className="inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white shadow hover:opacity-90 transition-opacity dark:bg-zinc-50 dark:text-zinc-900"
                            >
                                <LucidePlus className="h-3 w-3 mr-1" />
                                Add
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {selectedIngredients.length === 0 ? (
                                <div className="py-10 text-center border-2 border-dashed rounded-lg text-muted-foreground text-sm flex flex-col items-center">
                                    <LucidePlus className="h-6 w-6 mb-2 opacity-20" />
                                    Click Add to start adding ingredients
                                </div>
                            ) : (
                                selectedIngredients.map((item, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-3 p-4 rounded-lg bg-muted/30 border">
                                        <div className="flex-1">
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={item.ingredientId}
                                                onChange={e => updateIngredientSlot(index, { ingredientId: e.target.value })}
                                            >
                                                <option value="">Select ingredient...</option>
                                                {availableIngredients.map(ing => (
                                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="flex h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                placeholder="Qty"
                                                value={item.quantity || ''}
                                                onChange={e => updateIngredientSlot(index, { quantity: Number(e.target.value) })}
                                            />
                                            <select
                                                className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={item.unit}
                                                onChange={e => updateIngredientSlot(index, { unit: e.target.value as Unit })}
                                            >
                                                <option value="gr">gram</option>
                                                <option value="kg">kg</option>
                                                <option value="ml">ml</option>
                                                <option value="L">l</option>
                                                <option value="pcs">pcs</option>
                                            </select>
                                            <button
                                                onClick={() => removeIngredientSlot(index)}
                                                className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all border"
                                            >
                                                <LucideTrash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 border-t flex justify-between items-baseline">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subtotal Ingredients</span>
                                <span className="text-lg font-bold">Rp {ingredientHPP.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Overhead Card */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b">
                            <div className="space-y-1.5">
                                <h3 className="font-semibold leading-none tracking-tight">Biaya Overhead</h3>
                                <p className="text-sm text-muted-foreground">Biaya operasional per resep (Gas, Packaging, etc).</p>
                            </div>
                            <button
                                onClick={addOverhead}
                                className="inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white shadow hover:opacity-90 transition-opacity dark:bg-zinc-50 dark:text-zinc-900"
                            >
                                <LucidePlus className="h-3 w-3 mr-1" />
                                Add
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {overheads.length === 0 ? (
                                <div className="py-10 text-center border-2 border-dashed rounded-lg text-muted-foreground text-sm flex flex-col items-center">
                                    <LucideZap className="h-6 w-6 mb-2 opacity-20" />
                                    No overhead costs added
                                </div>
                            ) : (
                                overheads.map((o) => (
                                    <div key={o.id} className="flex flex-col md:flex-row gap-3 p-4 rounded-lg bg-muted/30 border">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                placeholder="Expense Name"
                                                value={o.name}
                                                onChange={e => updateOverhead(o.id, { name: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={o.category}
                                                onChange={e => updateOverhead(o.id, { category: e.target.value as OverheadCategory })}
                                            >
                                                <option value="Energi">Energy</option>
                                                <option value="Kemasan">Packaging</option>
                                                <option value="Tenaga Kerja">Labor</option>
                                                <option value="Lainnya">Other</option>
                                            </select>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">Rp</span>
                                                <input
                                                    type="number"
                                                    className="flex h-9 w-32 rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    placeholder="Cost"
                                                    value={o.cost || ''}
                                                    onChange={e => updateOverhead(o.id, { cost: Number(e.target.value) })}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeOverhead(o.id)}
                                                className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all border"
                                            >
                                                <LucideTrash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 border-t flex justify-between items-baseline">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subtotal Overhead</span>
                                <span className="text-lg font-bold">Rp {totalOverhead.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="sticky top-20 space-y-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="flex flex-col space-y-1.5 p-6 border-b">
                                <h3 className="font-semibold leading-none tracking-tight">Kalkulasi Akhir</h3>
                                <p className="text-sm text-muted-foreground">HPP per porsi & rekomendasi harga.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline border-b pb-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">Total HPP Batch</span>
                                        <span className="text-lg font-semibold">Rp {totalHPP.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-b pb-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase">HPP / Unit</span>
                                        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Rp {hppPerPortion.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Profit Margin</span>
                                        <span className="text-lg font-bold">{margin}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="300"
                                        step="5"
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-50"
                                        value={margin}
                                        onChange={e => setMargin(Number(e.target.value))}
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                        <span>20%</span>
                                        <span>50%</span>
                                        <span>100%+</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t space-y-4">
                                    <div className="p-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-lg text-center">
                                        <p className="text-[10px] font-medium uppercase tracking-widest opacity-70 mb-1">Recommended Price</p>
                                        <h4 className="text-3xl font-bold">Rp {sellingPrice.toLocaleString('id-ID')}</h4>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Estimated Profit / Unit</span>
                                        <span className="font-bold">Rp {profitPerPortion.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-4">
                                    <button
                                        onClick={handleSaveRecipe}
                                        disabled={isSubmitting}
                                        className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-900 dark:bg-zinc-50 dark:border-zinc-50 text-white dark:text-zinc-900 text-sm font-medium shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <LucideSave className="h-4 w-4" /> Simpan Resep
                                    </button>
                                    <button
                                        onClick={() => handleExport('png')}
                                        disabled={isExporting}
                                        className="w-full h-10 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <LucideDownload className="h-4 w-4" /> Download Laporan
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-muted/50 border-dashed text-center">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Don't forget to sync your inventory items to keep costs accurate.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Export Template */}
            <div className="fixed -left-[9999px] top-0 overflow-hidden">
                <div ref={exportRef}>
                    <ExportTemplate
                        recipeName={recipeName}
                        category={category}
                        portions={portions}
                        ingredients={selectedIngredients}
                        availableIngredients={availableIngredients}
                        overheads={overheads}
                        margin={margin}
                        totalHPP={totalHPP}
                        hppPerPortion={hppPerPortion}
                        sellingPrice={sellingPrice}
                    />
                </div>
            </div>
        </div>
    );
}
