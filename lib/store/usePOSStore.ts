import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    CartItem,
    SaleChannel,
    PaymentMethod
} from '@/types/pos';

interface POSState {
    cart: CartItem[];
    saleChannel: SaleChannel;
    paymentMethod: PaymentMethod | null;
    discount: number;
    customerName: string;
    customerContact: string;
    notes: string;

    // Actions
    addToCart: (item: CartItem) => void;
    removeFromCart: (recipeId: string) => void;
    updateQuantity: (recipeId: string, quantity: number) => void;
    setSaleChannel: (channel: SaleChannel) => void;
    setPaymentMethod: (method: PaymentMethod | null) => void;
    setDiscount: (amount: number) => void;
    setCustomerInfo: (name: string, contact: string) => void;
    setNotes: (notes: string) => void;
    clearCart: () => void;
    resetStore: () => void;

    // Selectors
    getSubtotal: () => number;
    getTotal: () => number;
}

export const usePOSStore = create<POSState>()(
    persist(
        (set, get) => ({
            cart: [],
            saleChannel: 'walkin',
            paymentMethod: 'cash',
            discount: 0,
            customerName: '',
            customerContact: '',
            notes: '',

            addToCart: (item) => {
                const currentCart = get().cart;
                const existingItem = currentCart.find(i => i.recipe_id === item.recipe_id);

                if (existingItem) {
                    set({
                        cart: currentCart.map(i =>
                            i.recipe_id === item.recipe_id
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    });
                } else {
                    set({ cart: [...currentCart, item] });
                }
            },

            removeFromCart: (recipeId) => {
                set({ cart: get().cart.filter(i => i.recipe_id !== recipeId) });
            },

            updateQuantity: (recipeId, quantity) => {
                if (quantity <= 0) {
                    get().removeFromCart(recipeId);
                    return;
                }
                set({
                    cart: get().cart.map(i =>
                        i.recipe_id === recipeId ? { ...i, quantity } : i
                    )
                });
            },

            setSaleChannel: (saleChannel) => set({ saleChannel }),
            setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
            setDiscount: (discount) => set({ discount }),
            setCustomerInfo: (customerName, customerContact) => set({ customerName, customerContact }),
            setNotes: (notes) => set({ notes }),

            clearCart: () => set({ cart: [] }),

            resetStore: () => set({
                cart: [],
                saleChannel: 'walkin',
                paymentMethod: 'cash',
                discount: 0,
                customerName: '',
                customerContact: '',
                notes: ''
            }),

            getSubtotal: () => {
                return get().cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            },

            getTotal: () => {
                return get().getSubtotal() - get().discount;
            }
        }),
        {
            name: 'hargaku-pos-storage',
            partialize: (state) => ({
                cart: state.cart,
                saleChannel: state.saleChannel,
                paymentMethod: state.paymentMethod,
                discount: state.discount,
                customerName: state.customerName,
                customerContact: state.customerContact,
                notes: state.notes
            })
        }
    )
);
