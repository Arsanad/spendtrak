/**
 * Category Store Tests
 */

import { act } from '@testing-library/react-native';
import { useCategoryStore, SYSTEM_CATEGORIES } from '../categoryStore';

describe('Category Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCategoryStore.setState({
      customCategories: [],
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useCategoryStore.getState();

      expect(state.customCategories).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have system categories available', () => {
      expect(SYSTEM_CATEGORIES.length).toBeGreaterThan(0);
      expect(SYSTEM_CATEGORIES.find(c => c.id === 'food')).toBeDefined();
      expect(SYSTEM_CATEGORIES.find(c => c.id === 'transport')).toBeDefined();
    });
  });

  describe('getAllCategories', () => {
    it('should return all system categories when no custom categories exist', () => {
      const categories = useCategoryStore.getState().getAllCategories();

      expect(categories.length).toBe(SYSTEM_CATEGORIES.length);
      expect(categories.every(c => c.isSystem)).toBe(true);
    });

    it('should return merged system and custom categories', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_1', name: 'Custom', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100 },
        ],
      });

      const categories = useCategoryStore.getState().getAllCategories();

      expect(categories.length).toBe(SYSTEM_CATEGORIES.length + 1);
      expect(categories.find(c => c.id === 'custom_1')).toBeDefined();
    });

    it('should sort categories by order', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_a', name: 'A', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 0 },
          { id: 'custom_z', name: 'Z', icon: 'OtherIcon', color: '#0000ff', isSystem: false, order: 100 },
        ],
      });

      const categories = useCategoryStore.getState().getAllCategories();
      const firstCustom = categories.find(c => c.id === 'custom_a');
      const lastCustom = categories.find(c => c.id === 'custom_z');

      // custom_a with order 0 should come before custom_z with order 100
      expect(categories.indexOf(firstCustom!)).toBeLessThan(categories.indexOf(lastCustom!));
    });
  });

  describe('addCategory', () => {
    it('should add a new custom category', () => {
      act(() => {
        useCategoryStore.getState().addCategory({
          name: 'Pets',
          icon: 'PetIcon',
          color: '#ff8800',
        });
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories.length).toBe(1);
      expect(state.customCategories[0].name).toBe('Pets');
      expect(state.customCategories[0].isSystem).toBe(false);
    });

    it('should generate unique ID for new category', () => {
      act(() => {
        useCategoryStore.getState().addCategory({
          name: 'Category 1',
          icon: 'OtherIcon',
          color: '#ff0000',
        });
        useCategoryStore.getState().addCategory({
          name: 'Category 2',
          icon: 'OtherIcon',
          color: '#0000ff',
        });
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories[0].id).not.toBe(state.customCategories[1].id);
      expect(state.customCategories[0].id).toMatch(/^custom_/);
      expect(state.customCategories[1].id).toMatch(/^custom_/);
    });

    it('should assign order after existing categories', () => {
      act(() => {
        useCategoryStore.getState().addCategory({
          name: 'First Custom',
          icon: 'OtherIcon',
          color: '#ff0000',
        });
      });

      const state = useCategoryStore.getState();
      const maxSystemOrder = Math.max(...SYSTEM_CATEGORIES.map(c => c.order));
      expect(state.customCategories[0].order).toBeGreaterThan(maxSystemOrder);
    });

    it('should set createdAt timestamp', () => {
      const before = new Date().toISOString();

      act(() => {
        useCategoryStore.getState().addCategory({
          name: 'Timestamped',
          icon: 'OtherIcon',
          color: '#ff0000',
        });
      });

      const after = new Date().toISOString();
      const state = useCategoryStore.getState();

      expect(state.customCategories[0].createdAt).toBeDefined();
      expect(state.customCategories[0].createdAt! >= before).toBe(true);
      expect(state.customCategories[0].createdAt! <= after).toBe(true);
    });
  });

  describe('updateCategory', () => {
    it('should update custom category', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_1', name: 'Original', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100 },
        ],
      });

      act(() => {
        useCategoryStore.getState().updateCategory('custom_1', {
          name: 'Updated',
          color: '#00ff00',
        });
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories[0].name).toBe('Updated');
      expect(state.customCategories[0].color).toBe('#00ff00');
    });

    it('should not modify system categories', () => {
      act(() => {
        useCategoryStore.getState().updateCategory('food', {
          name: 'Hacked Food',
        });
      });

      const state = useCategoryStore.getState();
      expect(state.error).toBe('Cannot modify system categories');

      const foodCategory = SYSTEM_CATEGORIES.find(c => c.id === 'food');
      expect(foodCategory!.name).toBe('Food & Dining');
    });

    it('should preserve other properties when updating', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_1', name: 'Original', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100, createdAt: '2024-01-01' },
        ],
      });

      act(() => {
        useCategoryStore.getState().updateCategory('custom_1', {
          name: 'Updated',
        });
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories[0].icon).toBe('OtherIcon');
      expect(state.customCategories[0].color).toBe('#ff0000');
      expect(state.customCategories[0].order).toBe(100);
    });
  });

  describe('deleteCategory', () => {
    it('should delete custom category', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_1', name: 'ToDelete', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100 },
          { id: 'custom_2', name: 'ToKeep', icon: 'OtherIcon', color: '#0000ff', isSystem: false, order: 101 },
        ],
      });

      act(() => {
        useCategoryStore.getState().deleteCategory('custom_1');
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories.length).toBe(1);
      expect(state.customCategories[0].id).toBe('custom_2');
    });

    it('should not delete system categories', () => {
      act(() => {
        useCategoryStore.getState().deleteCategory('food');
      });

      const state = useCategoryStore.getState();
      expect(state.error).toBe('Cannot delete system categories');

      const allCategories = state.getAllCategories();
      expect(allCategories.find(c => c.id === 'food')).toBeDefined();
    });

    it('should handle deleting non-existent category', () => {
      act(() => {
        useCategoryStore.getState().deleteCategory('non_existent');
      });

      const state = useCategoryStore.getState();
      expect(state.customCategories.length).toBe(0);
    });
  });

  describe('reorderCategories', () => {
    it('should reorder custom categories', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_a', name: 'A', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100 },
          { id: 'custom_b', name: 'B', icon: 'OtherIcon', color: '#00ff00', isSystem: false, order: 101 },
          { id: 'custom_c', name: 'C', icon: 'OtherIcon', color: '#0000ff', isSystem: false, order: 102 },
        ],
      });

      act(() => {
        useCategoryStore.getState().reorderCategories(['custom_c', 'custom_a', 'custom_b']);
      });

      const state = useCategoryStore.getState();
      const catC = state.customCategories.find(c => c.id === 'custom_c');
      const catA = state.customCategories.find(c => c.id === 'custom_a');
      const catB = state.customCategories.find(c => c.id === 'custom_b');

      expect(catC!.order).toBe(0);
      expect(catA!.order).toBe(1);
      expect(catB!.order).toBe(2);
    });
  });

  describe('getCategoryById', () => {
    it('should find system category by ID', () => {
      const category = useCategoryStore.getState().getCategoryById('food');

      expect(category).toBeDefined();
      expect(category!.name).toBe('Food & Dining');
    });

    it('should find custom category by ID', () => {
      useCategoryStore.setState({
        customCategories: [
          { id: 'custom_1', name: 'Custom', icon: 'OtherIcon', color: '#ff0000', isSystem: false, order: 100 },
        ],
      });

      const category = useCategoryStore.getState().getCategoryById('custom_1');

      expect(category).toBeDefined();
      expect(category!.name).toBe('Custom');
    });

    it('should return undefined for non-existent category', () => {
      const category = useCategoryStore.getState().getCategoryById('non_existent');

      expect(category).toBeUndefined();
    });
  });

  describe('getCategoryByName', () => {
    it('should find category by exact name', () => {
      const category = useCategoryStore.getState().getCategoryByName('Food & Dining');

      expect(category).toBeDefined();
      expect(category!.id).toBe('food');
    });

    it('should find category by name case-insensitively', () => {
      const category = useCategoryStore.getState().getCategoryByName('FOOD & DINING');

      expect(category).toBeDefined();
      expect(category!.id).toBe('food');
    });

    it('should return undefined for non-existent name', () => {
      const category = useCategoryStore.getState().getCategoryByName('Non Existent');

      expect(category).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useCategoryStore.setState({ error: 'Some error' });

      act(() => {
        useCategoryStore.getState().clearError();
      });

      expect(useCategoryStore.getState().error).toBeNull();
    });
  });
});
