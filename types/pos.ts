export type SaleChannel = 'walkin' | 'whatsapp' | 'manual';
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'cod';
export type TransactionStatus = 'completed' | 'voided' | 'pending_payment';
export type MovementType = 'sale' | 'restock' | 'adjustment' | 'void' | 'initial';
export type StockStatus = 'not_set' | 'negative' | 'empty' | 'low' | 'ok';

export interface Transaction {
    id: string;
    user_id: string;
    trx_number: string;
    sale_channel: SaleChannel;
    status: TransactionStatus;
    payment_method: PaymentMethod | null;
    customer_name: string | null;
    customer_contact: string | null;
    subtotal: number;
    discount: number;
    total: number;
    notes: string | null;
    sale_date: string; // ISO date
    sale_time: string | null;
    created_at: string;
    voided_at: string | null;
    voided_reason: string | null;
}

export interface TransactionItem {
    id: string;
    transaction_id: string;
    recipe_id: string | null;
    recipe_name: string; // Snapshot
    quantity: number;
    unit_price: number; // Snapshot
    hpp_at_sale: number | null; // Snapshot
    subtotal: number;
}

export interface IngredientWithStock {
    id: string;
    name: string;
    buy_price: number;
    buy_quantity: number;
    buy_unit: string;
    stock_quantity: number | null;
    stock_unit: string | null;
    min_stock_alert: number | null;
    last_restocked_at: string | null;
    stock_status: StockStatus;
}

export interface StockMovement {
    id: string;
    user_id: string;
    ingredient_id: string | null;
    ingredient_name: string;
    movement_type: MovementType;
    quantity_change: number;
    quantity_before: number | null;
    quantity_after: number | null;
    unit: string | null;
    reference_id: string | null;
    reference_type: string | null;
    notes: string | null;
    created_at: string;
}

export interface CartItem {
    recipe_id: string;
    recipe_name: string;
    unit_price: number;
    hpp: number | null;
    quantity: number;
}
