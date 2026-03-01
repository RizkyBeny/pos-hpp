"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Ingredient } from '@/components/ingredients/IngredientManager';
import IngredientManager from '@/components/ingredients/IngredientManager';
import { LucidePackage, LucideTrendingDown, LucideAlertTriangle, LucideHistory } from 'lucide-react';

interface InventoryPageProps {
    ingredients: Ingredient[];
    onIngredientsChange: (newIngs: Ingredient[]) => void;
    isDemoMode?: boolean;
}

export default function InventoryPage({ ingredients, onIngredientsChange, isDemoMode = false }: InventoryPageProps) {

    const lowStockCount = ingredients.filter(ing =>
        ing.stock_quantity !== null &&
        ing.min_stock_alert !== null &&
        ing.stock_quantity <= ing.min_stock_alert
    ).length;

    const uninitializedCount = ingredients.filter(ing => ing.stock_quantity === null).length;

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
                <p className="text-muted-foreground">Pantau ketersediaan bahan baku dan riwayat restock Anda.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <LucidePackage className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Bahan</p>
                        <p className="text-2xl font-bold">{ingredients.length}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <LucideTrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Hampir Habis</p>
                        <p className="text-2xl font-bold">{lowStockCount}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <LucideAlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Belum Set Stok</p>
                        <p className="text-2xl font-bold">{uninitializedCount}</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl border bg-card shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <LucideHistory className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Update Terakhir</p>
                        <p className="text-xs font-semibold mt-1">Hari Ini</p>
                    </div>
                </div>
            </div>

            {/* Real Ingredient Management */}
            <IngredientManager
                initialIngredients={ingredients}
                onIngredientsChange={onIngredientsChange}
                isDemoMode={isDemoMode}
            />
        </div>
    );
}
