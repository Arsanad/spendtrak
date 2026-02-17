// SPENDTRAK CINEMATIC EDITION - Budget Categories Constants
// Shared across Add Budget, Add Transaction, Stats, Analytics
// Location: src/constants/categories.ts

import { Colors } from '../design/cinematic';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string; // Ionicons name
}

// Full list of 25 budget categories
export const BUDGET_CATEGORIES: BudgetCategory[] = [
  // Food & Dining
  { id: 'food', name: 'Food', icon: 'fast-food-outline' },
  { id: 'groceries', name: 'Groceries', icon: 'cart-outline' },
  { id: 'restaurants', name: 'Dining', icon: 'restaurant-outline' },
  { id: 'coffee', name: 'Coffee', icon: 'cafe-outline' },

  // Transportation & Travel
  { id: 'transport', name: 'Transport', icon: 'car-outline' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline' },

  // Shopping & Retail
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt-outline' },
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline' },

  // Entertainment & Lifestyle
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline' },
  { id: 'fitness', name: 'Fitness', icon: 'barbell-outline' },

  // Health & Personal
  { id: 'health', name: 'Health', icon: 'heart-outline' },
  { id: 'personal', name: 'Personal Care', icon: 'body-outline' },

  // Home & Living
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
  { id: 'bills', name: 'Bills', icon: 'document-text-outline' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'refresh-outline' },
  { id: 'rent', name: 'Rent/Housing', icon: 'home-outline' },
  { id: 'home', name: 'Home', icon: 'bed-outline' },

  // Education & Finance
  { id: 'education', name: 'Education', icon: 'school-outline' },
  { id: 'investments', name: 'Investments', icon: 'trending-up-outline' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-checkmark-outline' },

  // Family & Gifts
  { id: 'gifts', name: 'Gifts', icon: 'gift-outline' },
  { id: 'pets', name: 'Pets', icon: 'paw-outline' },
  { id: 'family', name: 'Family', icon: 'people-outline' },

  // Other
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// Get category by ID
export function getCategoryById(id: string): BudgetCategory | undefined {
  return BUDGET_CATEGORIES.find((cat) => cat.id === id);
}

// Get category name by ID
export function getCategoryName(id: string): string {
  const category = getCategoryById(id);
  return category?.name || 'Other';
}

// Get category icon by ID
export function getCategoryIconName(id: string): string {
  const category = getCategoryById(id);
  return category?.icon || 'ellipsis-horizontal-outline';
}

export default BUDGET_CATEGORIES;
