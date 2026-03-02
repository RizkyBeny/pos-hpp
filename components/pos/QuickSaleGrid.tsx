"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePOSStore } from '@/lib/store/usePOSStore';
import { useDemoRecipes } from '@/lib/store/useDemoRecipes';
import {
    LucideSearch,
    LucideUtensils,
    LucideCoffee,
    LucidePlus,
    LucideAlertCircle,
    LucideDownload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as htmlToImage from 'html-to-image';
import { calculateItemCost } from '@/utils/conversions';

interface Recipe {
    id: string;
    name: string;
    category: 'Makanan' | 'Minuman';
    portions: number;
    margin_percentage: number;
    total_hpp: number;
    is_menu_item: boolean;
    image?: string;
}

export default function QuickSaleGrid({ isDemoMode = false }: { isDemoMode?: boolean }) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'Makanan' | 'Minuman'>('All');

    const addToCart = usePOSStore(state => state.addToCart);
    const { recipes: demoRecipes } = useDemoRecipes();

    const fetchRecipes = async () => {
        if (isDemoMode) {
            setRecipes(demoRecipes.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                portions: item.portions,
                margin_percentage: item.margin_percentage,
                total_hpp: item.total_hpp,
                is_menu_item: item.is_menu_item,
                image: item.image
            })));
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                    id, 
                    name, 
                    category, 
                    portions, 
                    margin_percentage,
                    is_menu_item,
                    image,
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
                    recipe_overheads (cost)
                `);

            if (error) throw error;

            if (data) {
                const processed = data.map((recipe: any) => {
                    let ingredientsCost = 0;
                    recipe.recipe_ingredients?.forEach((ri: any) => {
                        if (ri.ingredients) {
                            const ing = ri.ingredients;
                            ingredientsCost += calculateItemCost(
                                ri.quantity,
                                ri.unit,
                                ing.buy_price,
                                ing.buy_quantity,
                                ing.buy_unit,
                                ing.weight_per_unit || 0
                            );
                        }
                    });

                    const overheadsCost = recipe.recipe_overheads?.reduce((sum: number, oh: any) => sum + Number(oh.cost), 0) || 0;

                    return {
                        id: recipe.id,
                        name: recipe.name,
                        category: recipe.category,
                        portions: recipe.portions,
                        margin_percentage: recipe.margin_percentage,
                        total_hpp: ingredientsCost + overheadsCost,
                        is_menu_item: recipe.is_menu_item || false,
                        image: recipe.image
                    };
                });
                setRecipes(processed);
            }
        } catch (err) {
            console.error("Failed to fetch recipes for POS:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [isDemoMode, demoRecipes]);

    const filteredRecipes = recipes.filter(r => {
        if (!r.is_menu_item) return false;
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === 'All' || r.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const handleAddToCart = (recipe: Recipe) => {
        const hppPerUnit = recipe.total_hpp / recipe.portions;
        const sellingPrice = Math.ceil(hppPerUnit * (1 + recipe.margin_percentage / 100) / 100) * 100;

        addToCart({
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            unit_price: sellingPrice,
            hpp: hppPerUnit,
            quantity: 1
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-3 space-y-3">
                        <div className="aspect-square w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        className="w-full bg-background border rounded-md h-10 pl-10 pr-4 text-sm focus-visible:ring-1 focus-visible:ring-ring transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-md w-fit">
                    {['All', 'Makanan', 'Minuman'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat as any)}
                            className={cn(
                                "px-3 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap",
                                selectedCategory === cat
                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Menu */}
            {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <LucideAlertCircle className="h-8 w-8 text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Menu tidak ditemukan</p>
                    <p className="text-xs text-zinc-400 mt-1">Coba kata kunci lain atau pilih kategori berbeda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredRecipes.map((recipe) => {
                        const hppPerUnit = recipe.total_hpp / recipe.portions;
                        const sellingPrice = Math.ceil(hppPerUnit * (1 + recipe.margin_percentage / 100) / 100) * 100;

                        return (
                            <div
                                key={recipe.id}
                                onClick={() => handleAddToCart(recipe)}
                                className="group relative bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="text-muted-foreground/30">
                                            {recipe.category === 'Makanan'
                                                ? <LucideUtensils className="h-10 w-10" />
                                                : <LucideCoffee className="h-10 w-10" />
                                            }
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>

                                    <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-center text-zinc-900 dark:text-zinc-50 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <LucidePlus className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="p-3 space-y-1.5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{recipe.category}</span>
                                        <h4 className="text-sm font-bold truncate leading-tight">{recipe.name}</h4>
                                    </div>
                                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                                        RP {sellingPrice.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
