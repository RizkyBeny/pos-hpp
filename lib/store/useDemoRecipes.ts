import { create } from 'zustand';

export interface DemoRecipe {
    id: string;
    name: string;
    category: 'Makanan' | 'Minuman';
    portions: number;
    margin_percentage: number;
    created_at: string;
    total_hpp: number;
    recipe_ingredients: any[];
    recipe_overheads: any[];
    is_menu_item: boolean;
    image?: string;
}

interface DemoRecipesState {
    recipes: DemoRecipe[];
    addRecipe: (recipe: DemoRecipe) => void;
    updateRecipe: (id: string, updates: Partial<DemoRecipe>) => void;
    deleteRecipe: (id: string) => void;
    setRecipes: (recipes: DemoRecipe[]) => void;
    clear: () => void;
}

export const useDemoRecipes = create<DemoRecipesState>((set) => ({
    recipes: [],
    addRecipe: (recipe) => set((state) => ({ recipes: [recipe, ...state.recipes] })),
    updateRecipe: (id, updates) => set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updates } : r))
    })),
    deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id)
    })),
    setRecipes: (recipes) => set({ recipes }),
    clear: () => set({ recipes: [] }),
}));
