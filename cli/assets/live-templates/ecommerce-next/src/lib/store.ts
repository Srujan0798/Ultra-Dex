import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: { id: string; name: string; price: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product) => {
                set((state) => {
                    const existing = state.items.find(i => i.id === product.id);
                    if (existing) {
                        return {
                            items: state.items.map(i =>
                                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                            )
                        };
                    }
                    return {
                        items: [...state.items, { ...product, quantity: 1 }]
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter(i => i.id !== id)
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: state.items.map(i =>
                        i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
                    ).filter(i => i.quantity > 0)
                }));
            },

            clearCart: () => set({ items: [] }),

            total: () => {
                return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            }
        }),
        { name: 'cart-storage' }
    )
);
