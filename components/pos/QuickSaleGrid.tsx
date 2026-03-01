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
            <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                <div className="h-4 w-4 rounded-full bg-emerald-500 animate-ping mb-4"></div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Memuat Menu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header POS */}
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari menu..."
                        className="w-full bg-white dark:bg-zinc-900 border rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {['All', 'Makanan', 'Minuman'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat as any)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border",
                                selectedCategory === cat
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white dark:bg-zinc-900 text-zinc-500 border-transparent hover:border-zinc-200"
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredRecipes.map((recipe) => {
                        const hppPerUnit = recipe.total_hpp / recipe.portions;
                        const sellingPrice = Math.ceil(hppPerUnit * (1 + recipe.margin_percentage / 100) / 100) * 100;

                        return (
                            <div
                                key={recipe.id}
                                onClick={() => handleAddToCart(recipe)}
                                className="group relative bg-white dark:bg-zinc-900 border rounded-xl p-3 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        recipe.category === 'Makanan'
                                            ? <LucideUtensils className="h-8 w-8 text-zinc-300 group-hover:scale-110 transition-transform" />
                                            : <LucideCoffee className="h-8 w-8 text-zinc-300 group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/5 transition-colors"></div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold truncate group-hover:text-emerald-600 transition-colors">{recipe.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-zinc-400">{recipe.category}</p>
                                        <div className="h-6 w-6 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                            <LucidePlus className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                        Rp {sellingPrice.toLocaleString('id-ID')}
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
