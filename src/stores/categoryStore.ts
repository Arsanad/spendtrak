/**
 * Category Store
 * Manages spending categories - both system defaults and custom user categories
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventBus } from '@/services/eventBus';

// Category interface
export interface Category {
  id: string;
  name: string;
  icon: string; // Icon component name (e.g., 'FoodIcon', 'TransportIcon')
  color: string; // Hex color
  isSystem: boolean; // true = default system category, can't delete
  order: number;
  createdAt?: string;
}

// System categories - these cannot be deleted or have their core properties changed
export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'FoodIcon', color: '#00ff88', isSystem: true, order: 0 },
  { id: 'transport', name: 'Transport', icon: 'TransportIcon', color: '#0088ff', isSystem: true, order: 1 },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingIcon', color: '#ff00ff', isSystem: true, order: 2 },
  { id: 'entertainment', name: 'Entertainment', icon: 'EntertainmentIcon', color: '#bf00ff', isSystem: true, order: 3 },
  { id: 'utilities', name: 'Utilities', icon: 'UtilitiesIcon', color: '#ff8800', isSystem: true, order: 4 },
  { id: 'health', name: 'Health', icon: 'HealthIcon', color: '#ff3366', isSystem: true, order: 5 },
  { id: 'education', name: 'Education', icon: 'EducationIcon', color: '#5f27cd', isSystem: true, order: 6 },
  { id: 'travel', name: 'Travel', icon: 'TravelIcon', color: '#00d2d3', isSystem: true, order: 7 },
  { id: 'groceries', name: 'Groceries', icon: 'GroceriesIcon', color: '#26de81', isSystem: true, order: 8 },
  { id: 'income', name: 'Income', icon: 'IncomeIcon', color: '#0088ff', isSystem: true, order: 9 },
  { id: 'other', name: 'Other', icon: 'OtherIcon', color: '#8a9aad', isSystem: true, order: 10 },
];

// Available icons for custom categories
export const AVAILABLE_ICONS = [
  'FoodIcon', 'CafeIcon', 'TransportIcon', 'ShoppingIcon',
  'EntertainmentIcon', 'HealthIcon', 'EducationIcon', 'TravelIcon',
  'HomeIcon', 'UtilitiesIcon', 'GiftIcon', 'PetIcon',
  'FitnessIcon', 'BeautyIcon', 'TechIcon', 'SubscriptionsIcon',
  'InvestmentIcon', 'SavingsIcon', 'DebtIcon', 'OtherIcon',
];

// Available colors for custom categories
export const AVAILABLE_COLORS = [
  '#00ff88', '#0088ff', '#ff3366', '#ffd93d',
  '#ff8800', '#ff4757', '#5f27cd', '#00d2d3',
  '#a55eea', '#26de81', '#fd9644', '#45aaf2',
  '#fc5c65', '#2bcbba', '#eb3b5a', '#20bf6b',
];

interface CategoryState {
  // State
  customCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // Computed - gets all categories (system + custom)
  getAllCategories: () => Category[];

  // Actions
  addCategory: (category: Omit<Category, 'id' | 'isSystem' | 'order' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      customCategories: [],
      isLoading: false,
      error: null,

      // Get all categories merged (system + custom), sorted by order
      getAllCategories: () => {
        const { customCategories } = get();
        const allCategories = [...SYSTEM_CATEGORIES, ...customCategories];
        return allCategories.sort((a, b) => a.order - b.order);
      },

      // Add a new custom category
      addCategory: (categoryData) => {
        const { customCategories } = get();

        // Generate unique ID
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Calculate order (after all existing categories)
        const maxOrder = Math.max(
          ...SYSTEM_CATEGORIES.map(c => c.order),
          ...customCategories.map(c => c.order),
          -1
        );

        const newCategory: Category = {
          ...categoryData,
          id,
          isSystem: false,
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };

        set({
          customCategories: [...customCategories, newCategory],
        });

        // Emit event for Quantum Alive Experience
        eventBus.emit('category:created', { name: categoryData.name });
      },

      // Update a category (only custom categories can change name/icon/color)
      updateCategory: (id, updates) => {
        const { customCategories } = get();

        // Check if it's a system category
        const isSystemCategory = SYSTEM_CATEGORIES.some(c => c.id === id);
        if (isSystemCategory) {
          set({ error: 'Cannot modify system categories' });
          return;
        }

        set({
          customCategories: customCategories.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        });

        // Emit event for Quantum Alive Experience
        const updated = customCategories.find(c => c.id === id);
        eventBus.emit('category:updated', { name: updates.name || updated?.name || 'Category' });
      },

      // Delete a custom category
      deleteCategory: (id) => {
        const { customCategories } = get();

        // Check if it's a system category
        const isSystemCategory = SYSTEM_CATEGORIES.some(c => c.id === id);
        if (isSystemCategory) {
          set({ error: 'Cannot delete system categories' });
          return;
        }

        set({
          customCategories: customCategories.filter(cat => cat.id !== id),
        });
      },

      // Reorder categories
      reorderCategories: (orderedIds) => {
        const { customCategories } = get();

        // Update order for custom categories
        const updatedCustom = customCategories.map(cat => {
          const newOrder = orderedIds.indexOf(cat.id);
          if (newOrder !== -1) {
            return { ...cat, order: newOrder };
          }
          return cat;
        });

        set({ customCategories: updatedCustom });
      },

      // Get category by ID
      getCategoryById: (id) => {
        const allCategories = get().getAllCategories();
        return allCategories.find(c => c.id === id);
      },

      // Get category by name (case-insensitive)
      getCategoryByName: (name) => {
        const allCategories = get().getAllCategories();
        return allCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'spendtrak-categories',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ customCategories: state.customCategories }),
    }
  )
);

// Hook for getting all categories (convenience)
export const useCategories = () => {
  const getAllCategories = useCategoryStore(state => state.getAllCategories);
  return getAllCategories();
};

export default useCategoryStore;
