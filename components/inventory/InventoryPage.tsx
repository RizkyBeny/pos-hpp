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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Bahan</h3>
                        <LucidePackage className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{ingredients.length}</div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Hampir Habis</h3>
                        <LucideTrendingDown className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Belum Set Stok</h3>
                        <LucideAlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold text-red-600">{uninitializedCount}</div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Update Terakhir</h3>
                        <LucideHistory className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-lg font-bold">Hari Ini</div>
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
