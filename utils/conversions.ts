export const convertQuantity = (
    quantity: number,
    fromUnit: string,
    toUnit: string
): number => {
    // Normalize units to lowercase
    const f = fromUnit.toLowerCase();
    const t = toUnit.toLowerCase();

    if (f === t) return quantity;

    // Mass units
    if (f === 'kg' && t === 'gr') return quantity * 1000;
    if (f === 'gr' && t === 'kg') return quantity / 1000;

    // Volume units
    if (f === 'l' && t === 'ml') return quantity * 1000;
    if (f === 'ml' && t === 'l') return quantity / 1000;

    // Count units
    if (f === 'lusin' && t === 'pcs') return quantity * 12;
    if (f === 'pcs' && t === 'lusin') return quantity / 12;

    // Default: no conversion known/possible
    return quantity;
};

export const calculateItemCost = (
    usedQuantity: number,
    usedUnit: string,
    buyPrice: number,
    buyQuantity: number,
    buyUnit: string,
    weightPerUnit: number = 0
): number => {
    if (!buyPrice || !buyQuantity) return 0;

    // Discrete units check
    const isDiscrete = ['pcs', 'pack', 'lusin'].includes(buyUnit.toLowerCase());
    const isTargetWeight = ['gr', 'kg'].includes(usedUnit.toLowerCase());
    const isTargetVolume = ['ml', 'l'].includes(usedUnit.toLowerCase());

    // Case: Bought in pieces/packs, used in weight/volume
    if (isDiscrete && (isTargetWeight || isTargetVolume) && weightPerUnit > 0) {
        // Convert buy quantity to base weight unit (gr/ml)
        let unitMultiplier = 1;
        if (buyUnit.toLowerCase() === 'lusin') unitMultiplier = 12;

        // Total grams/ml available = Buy Qty * Multiplier * weight per piece
        const totalGramsAvailable = buyQuantity * unitMultiplier * weightPerUnit;

        // Now convert used quantity to same base (gr/ml)
        let usedInBase = usedQuantity;
        if (usedUnit.toLowerCase() === 'kg' || usedUnit.toLowerCase() === 'l') {
            usedInBase = usedQuantity * 1000;
        }

        return (usedInBase / totalGramsAvailable) * buyPrice;
    }

    // STANDARD CONVERSIONS (Same category)
    let standardizedBuyQty = buyQuantity;
    if (usedUnit === 'gr' && buyUnit === 'kg') {
        standardizedBuyQty = buyQuantity * 1000;
    } else if (usedUnit === 'kg' && buyUnit === 'gr') {
        standardizedBuyQty = buyQuantity / 1000;
    } else if (usedUnit === 'ml' && buyUnit === 'L') {
        standardizedBuyQty = buyQuantity * 1000;
    } else if (usedUnit === 'L' && buyUnit === 'ml') {
        standardizedBuyQty = buyQuantity / 1000;
    } else if (usedUnit === 'pcs' && buyUnit === 'lusin') {
        standardizedBuyQty = buyQuantity * 12;
    } else if (usedUnit === 'lusin' && buyUnit === 'pcs') {
        standardizedBuyQty = buyQuantity / 12;
    }

    return (usedQuantity / standardizedBuyQty) * buyPrice;
};
