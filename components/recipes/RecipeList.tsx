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
    LucideImage
} from 'lucide-react';
import { calculateItemCost } from '@/utils/conversions';
import { useDemoRecipes } from '@/lib/store/useDemoRecipes';
import { Ingredient } from '@/components/ingredients/IngredientManager';

interface SavedRecipe {
    id: string;
    name: string;
    category: 'Makanan' | 'Minuman';
    portions: number;
    margin_percentage: number;
    created_at: string;
    total_hpp?: number;
    is_menu_item?: boolean;
    image?: string;
}

interface RecipeListProps {
    onViewRecipe?: (recipeId: string) => void;
    availableIngredients: Ingredient[];
    isDemoMode?: boolean;
}

export default function RecipeList({ onViewRecipe, availableIngredients, isDemoMode = false }: RecipeListProps) {
    const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { recipes: demoRecipes, deleteRecipe } = useDemoRecipes();

    const fetchRecipes = async () => {
        if (isDemoMode) {
            setRecipes(demoRecipes);
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
                        const ing = isDemoMode
                            ? availableIngredients.find(ai => ai.id === ri.ingredient_id)
                            : ri.ingredients;

                        if (ing) {
                            ingredientsCost += calculateItemCost(
                                ri.quantity,
                                ri.unit,
                                isDemoMode ? ing.buyPrice : ing.buy_price,
                                isDemoMode ? ing.buyQuantity : ing.buy_quantity,
                                isDemoMode ? ing.buyUnit : ing.buy_unit,
                                (isDemoMode ? ing.weightPerUnit : ing.weight_per_unit) || 0
                            );
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
    }, [isDemoMode, demoRecipes]);

    const handleDeleteConfirm = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(null);
        if (isDemoMode) {
            deleteRecipe(id);
            return;
        }
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
                            <div className="h-16 w-12 rounded-lg border bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                                {recipe.image ? (
                                    <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
                                ) : (
                                    recipe.category === 'Makanan'
                                        ? <LucideUtensils className="h-5 w-5 text-zinc-300" />
                                        : <LucideCoffee className="h-5 w-5 text-zinc-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold truncate">{recipe.name}</p>
                                    {recipe.is_menu_item && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 text-[8px] font-bold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            POS
                                        </span>
                                    )}
                                </div>
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
                        <tr className="border-b transition-colors text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                            <th className="h-10 px-4 text-left align-middle w-16">Foto</th>
                            <th className="h-10 px-4 text-left align-middle">Produk</th>
                            <th className="h-10 px-4 text-left align-middle">Kategori</th>
                            <th className="h-10 px-4 text-right align-middle">Batch</th>
                            <th className="h-10 px-4 text-right align-middle">HPP / Unit</th>
                            <th className="h-10 px-4 text-right align-middle">Harga Jual</th>
                            <th className="h-10 px-4 text-right align-middle">Margin</th>
                            <th className="h-10 px-4 text-right align-middle">Aksi</th>
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
                                        <div className="h-12 w-9 rounded-md border bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                            {recipe.image ? (
                                                <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
                                            ) : (
                                                recipe.category === 'Makanan'
                                                    ? <LucideUtensils className="h-3 w-3 text-zinc-300" />
                                                    : <LucideCoffee className="h-3 w-3 text-zinc-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{recipe.name}</span>
                                            {recipe.is_menu_item && (
                                                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 text-[8px] font-black text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                    POS
                                                </span>
                                            )}
                                        </div>
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
