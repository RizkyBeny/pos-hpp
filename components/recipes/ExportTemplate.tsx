"use client";

import React from 'react';
import { LucideChefHat, LucideUtensils, LucideCoffee, LucideZap, LucidePackage } from 'lucide-react';
import { Ingredient, Unit } from '../ingredients/IngredientManager';
import { calculateItemCost } from '@/utils/conversions';

interface ExportTemplateProps {
    recipeName: string;
    category: 'Makanan' | 'Minuman';
    portions: number;
    ingredients: {
        ingredientId: string;
        quantity: number;
        unit: Unit;
    }[];
    availableIngredients: Ingredient[];
    overheads: {
        name: string;
        cost: number;
        category: string;
    }[];
    margin: number;
    totalHPP: number;
    hppPerPortion: number;
    sellingPrice: number;
}

export default function ExportTemplate({
    recipeName,
    category,
    portions,
    ingredients,
    availableIngredients,
    overheads,
    margin,
    totalHPP,
    hppPerPortion,
    sellingPrice,
}: ExportTemplateProps) {
    const ingredientHPP = ingredients.reduce((sum, item) => {
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

    const totalOverhead = overheads.reduce((sum, o) => sum + (o.cost || 0), 0);
    const profitPerPortion = sellingPrice - hppPerPortion;

    return (
        <div id="export-container" className="bg-white p-10 w-[800px] text-slate-800 font-sans border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary-600 pb-8 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
                        <LucideChefHat size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary-600 leading-tight">HargaKu</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">HPP Calculation Report</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase">Tanggal Laporan</p>
                    <p className="text-lg font-black">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Produk Info */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Produk</p>
                    <h2 className="text-2xl font-black text-slate-800">{recipeName || 'Produk Tanpa Nama'}</h2>
                    <div className="flex items-center gap-2 mt-2 text-primary-600">
                        {category === 'Makanan' ? <LucideUtensils size={14} /> : <LucideCoffee size={14} />}
                        <span className="text-xs font-bold">{category}</span>
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Produksi</p>
                    <h2 className="text-2xl font-black text-slate-800">{portions} Porsi</h2>
                    <p className="text-xs text-slate-400 font-medium mt-2 italic">Dihitung per batch produksi</p>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 gap-8 mb-10">
                {/* Ingredients Table */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <LucidePackage size={16} className="text-primary-500" />
                        Breakdown Bahan Baku
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-500">Nama Bahan</th>
                                    <th className="px-4 py-3 font-bold text-slate-500 text-center">Jumlah</th>
                                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Biaya Est.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map((item, idx) => {
                                    const ing = availableIngredients.find(i => i.id === item.ingredientId);
                                    const cost = ing ? calculateItemCost(item.quantity, item.unit, ing.buyPrice, ing.buyQuantity, ing.buyUnit, ing.weightPerUnit) : 0;
                                    return (
                                        <tr key={idx} className="border-t border-slate-50">
                                            <td className="px-4 py-3 font-medium">{ing?.name || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-center">{item.quantity} {item.unit}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">Rp {cost.toLocaleString('id-ID')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-primary-50">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 font-black text-primary-700">Subtotal Bahan</td>
                                    <td className="px-4 py-3 text-right font-black text-primary-700 underline">Rp {ingredientHPP.toLocaleString('id-ID')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Overhead Table */}
                {overheads.length > 0 && (
                    <div>
                        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <LucideZap size={16} className="text-yellow-500" />
                            Biaya Operasional (Overhead)
                        </h3>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm border-collapse">
                                <tbody>
                                    {overheads.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0 border-slate-50">
                                            <td className="px-4 py-3 font-medium">{item.name}</td>
                                            <td className="px-4 py-3 text-slate-400 italic text-xs uppercase">{item.category}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">Rp {item.cost.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-yellow-50/50">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 font-black text-yellow-700">Subtotal Overhead</td>
                                        <td className="px-4 py-3 text-right font-black text-yellow-700 underline">Rp {totalOverhead.toLocaleString('id-ID')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* FINAL CALCULATION BOX */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl"></div>

                <div className="grid grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-6">
                        <div className="border-b border-white/10 pb-4">
                            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.2em] mb-1">HPP Total Produk</p>
                            <h4 className="text-3xl font-black">Rp {totalHPP.toLocaleString('id-ID')}</h4>
                            <p className="text-xs text-slate-400 mt-1 italic">Dihitung per batch untuk {portions} porsi</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Target Margin</p>
                                <p className="text-xl font-black text-primary-400">{margin}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">HPP / Porsi</p>
                                <p className="text-xl font-black text-white">Rp {hppPerPortion.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary-600 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-100 mb-2">REKOMENDASI HARGA JUAL</p>
                        <h5 className="text-4xl font-black">Rp {sellingPrice.toLocaleString('id-ID')}</h5>
                        <div className="w-full h-[1px] bg-white/20 my-4"></div>
                        <p className="text-xs font-bold">Potensi Laba: <span className="font-black">Rp {profitPerPortion.toLocaleString('id-ID')}</span> <span className="text-[10px] opacity-60">/ porsi</span></p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-500 italic">Dihasilkan secara otomatis oleh HargaKu — Solusi HPP Akurat UMKM Indonesia</p>
                </div>
            </div>
        </div>
    );
}
