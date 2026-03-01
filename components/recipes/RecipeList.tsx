"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    LucideTrash2,
    LucideUtensils,
    LucideCoffee,
    LucideExternalLink,
    LucideArrowRight,
    LucideChevronRight,
    LucideX,
} from 'lucide-react';

interface SavedRecipe {
    id: string;
    name: string;
    category: 'Makanan' | 'Minuman';
    portions: number;
    margin_percentage: number;
    created_at: string;
    total_hpp?: number;
}

interface RecipeListProps {
    onViewRecipe?: (recipeId: string) => void;
    isDemoMode?: boolean;
}

export default function RecipeList({ onViewRecipe, isDemoMode = false }: RecipeListProps) {
    const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const fetchRecipes = async () => {
        if (isDemoMode) {
            setRecipes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                    *,
                    recipe_ingredients (
                        quantity,
                        unit,
                        ingredients (
                            buy_price,
                            buy_quantity,
                            buy_unit,
                            weight_per_unit
                        )
                    ),
                    recipe_overheads (
                        cost
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const processedRecipes = data.map((recipe: any) => {
                    let ingredientsCost = 0;
                    recipe.recipe_ingredients?.forEach((ri: any) => {
                        if (ri.ingredients) {
                            const ing = ri.ingredients;
                            let pricePerBaseUnit = 0;
                            if (['kg', 'L', 'pack', 'pcs', 'lusin'].includes(ing.buy_unit)) {
                                pricePerBaseUnit = ing.buy_price / ing.buy_quantity;
                                if (ing.buy_unit === 'kg' && ri.unit === 'gr') ingredientsCost += ri.quantity * (pricePerBaseUnit / 1000);
                                else if (ing.buy_unit === 'L' && ri.unit === 'ml') ingredientsCost += ri.quantity * (pricePerBaseUnit / 1000);
                                else if (ing.buy_unit === ri.unit) ingredientsCost += ri.quantity * pricePerBaseUnit;
                                else ingredientsCost += ri.quantity * (pricePerBaseUnit);
                            }
                        }
                    });

                    const overheadsCost = recipe.recipe_overheads?.reduce((sum: number, oh: any) => sum + Number(oh.cost), 0) || 0;

                    return {
                        ...recipe,
                        total_hpp: ingredientsCost + overheadsCost
                    };
                });

                setRecipes(processedRecipes);
            }
        } catch (error) {
            console.error('Fetch recipes failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const handleDeleteConfirm = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(null);
        try {
            const { error } = await supabase.from('recipes').delete().eq('id', id);
            if (error) throw error;
            setRecipes(recipes.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-zinc-300 animate-ping mb-2"></div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Loading...</p>
            </div>
        );
    }

    if (recipes.length === 0) {
        return (
            <div className="py-10 text-center border border-dashed rounded-lg mx-4 md:mx-0">
                <p className="text-sm text-muted-foreground">Belum ada resep tersimpan.</p>
                <p className="text-xs text-muted-foreground mt-1">Buat kalkulasi pertama Anda untuk melihatnya di sini.</p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y">
                {recipes.map((recipe) => {
                    const hppPerUnit = (recipe.total_hpp || 0) / recipe.portions;
                    const sellingPrice = Math.ceil(hppPerUnit * (1 + recipe.margin_percentage / 100) / 100) * 100;

                    return (
                        <div
                            key={recipe.id}
                            onClick={() => onViewRecipe?.(recipe.id)}
                            className="flex items-center gap-3 px-5 py-4 active:bg-muted/50 transition-colors cursor-pointer"
                        >
                            <div className="h-11 w-11 rounded-full border bg-muted flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                                {recipe.category === 'Makanan'
                                    ? <LucideUtensils className="h-5 w-5" />
                                    : <LucideCoffee className="h-5 w-5" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{recipe.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">{recipe.portions} Porsi</span>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="inline-flex items-center rounded bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                                        {recipe.margin_percentage}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <p className="text-sm font-bold">Rp {sellingPrice.toLocaleString('id-ID')}</p>
                                <p className="text-[11px] text-muted-foreground">HPP {hppPerUnit.toLocaleString('id-ID')}</p>
                            </div>

                            {deleteConfirmId === recipe.id ? (
                                <div className="flex flex-col gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => handleDeleteConfirm(recipe.id, e)}
                                        className="text-[10px] bg-red-600 px-2 py-1 text-white rounded font-medium"
                                    >Hapus?</button>
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="text-[10px] bg-zinc-200 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded font-medium"
                                    >Batal</button>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(recipe.id); }}
                                    className="ml-1 p-2 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-500 text-zinc-400"
                                >
                                    <LucideTrash2 className="h-4 w-4 shrink-0" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b bg-muted/50">
                        <tr className="border-b transition-colors">
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Produk</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Kategori</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Porsi</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">HPP / Unit</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Harga Jual</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Margin</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {recipes.map((recipe) => {
                            const hppPerUnit = (recipe.total_hpp || 0) / recipe.portions;
                            const sellingPrice = Math.ceil(hppPerUnit * (1 + recipe.margin_percentage / 100) / 100) * 100;

                            return (
                                <tr
                                    key={recipe.id}
                                    onClick={() => onViewRecipe?.(recipe.id)}
                                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer group"
                                >
                                    <td className="p-4 align-middle">
                                        <span className="font-semibold">{recipe.name}</span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold border">
                                            {recipe.category === 'Makanan'
                                                ? <LucideUtensils className="h-3 w-3" />
                                                : <LucideCoffee className="h-3 w-3" />
                                            }
                                            {recipe.category}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right font-medium">{recipe.portions}</td>
                                    <td className="p-4 align-middle text-right font-medium">Rp {hppPerUnit.toLocaleString('id-ID')}</td>
                                    <td className="p-4 align-middle text-right font-bold">Rp {sellingPrice.toLocaleString('id-ID')}</td>
                                    <td className="p-4 align-middle text-right">
                                        <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-950/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                            {recipe.margin_percentage}%
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        {deleteConfirmId === recipe.id ? (
                                            <div className="flex justify-end items-center gap-2 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-xs font-medium text-red-500 mr-1">Hapus?</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                                                >
                                                    <LucideX className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteConfirm(recipe.id, e)}
                                                    className="h-8 px-2 flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                                >
                                                    Ya
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onViewRecipe?.(recipe.id); }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors border"
                                                    title="Lihat Detail"
                                                >
                                                    <LucideExternalLink className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(recipe.id); }}
                                                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 transition-colors border"
                                                    title="Hapus"
                                                >
                                                    <LucideTrash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
