/**
 * Detox E2E Tests - Transaction Management
 *
 * Tests:
 * - Create a new transaction (expense)
 * - View transaction list
 * - View transaction details
 * - Filter transactions
 * - Search transactions
 * - Delete a transaction
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Transactions', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Sign in to get to the main app
    await element(by.id('get-started-button')).tap();
    await element(by.id('signin-email-input')).typeText('test@example.com');
    await element(by.id('signin-password-input')).typeText('TestPass123!');
    await element(by.id('signin-button')).tap();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  describe('Create Transaction', () => {
    it('should open the add expense modal', async () => {
      await element(by.id('add-tab')).tap();
      await detoxExpect(element(by.id('add-expense-modal'))).toBeVisible();
    });

    it('should show required fields in add expense form', async () => {
      await detoxExpect(element(by.id('amount-input'))).toBeVisible();
      await detoxExpect(element(by.id('category-selector'))).toBeVisible();
    });

    it('should create a new expense', async () => {
      // Enter amount
      await element(by.id('amount-input')).typeText('25.50');

      // Select category
      await element(by.id('category-selector')).tap();
      await element(by.id('category-food')).tap();

      // Add a note
      await element(by.id('note-input')).typeText('Lunch at restaurant');

      // Save
      await element(by.id('save-transaction-button')).tap();

      // Should navigate back to home or transactions
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should show validation error when amount is empty', async () => {
      await element(by.id('add-tab')).tap();

      // Try to save without entering amount
      await element(by.id('save-transaction-button')).tap();

      // Should show validation error
      await detoxExpect(element(by.id('amount-error'))).toBeVisible();
    });
  });

  describe('Transaction List', () => {
    beforeEach(async () => {
      // Navigate to transactions tab
      await element(by.id('transactions-tab')).tap();
    });

    it('should show the transactions screen', async () => {
      await detoxExpect(element(by.id('transactions-screen'))).toBeVisible();
    });

    it('should display transaction items', async () => {
      await detoxExpect(element(by.id('transaction-list'))).toBeVisible();
    });

    it('should navigate to transaction detail on tap', async () => {
      // Tap first transaction in the list
      await element(by.id('transaction-item-0')).tap();

      // Should show transaction detail screen
      await detoxExpect(element(by.id('transaction-detail-screen'))).toBeVisible();
    });
  });

  describe('Transaction Detail', () => {
    beforeEach(async () => {
      await element(by.id('transactions-tab')).tap();
      await element(by.id('transaction-item-0')).tap();
    });

    it('should display transaction details', async () => {
      await detoxExpect(element(by.id('transaction-detail-screen'))).toBeVisible();
      await detoxExpect(element(by.id('transaction-amount'))).toBeVisible();
      await detoxExpect(element(by.id('transaction-category'))).toBeVisible();
      await detoxExpect(element(by.id('transaction-date'))).toBeVisible();
    });

    it('should allow going back to transaction list', async () => {
      await element(by.id('back-button')).tap();
      await detoxExpect(element(by.id('transactions-screen'))).toBeVisible();
    });
  });

  describe('Filter Transactions', () => {
    beforeEach(async () => {
      await element(by.id('transactions-tab')).tap();
    });

    it('should open filter options', async () => {
      await element(by.id('filter-button')).tap();
      await detoxExpect(element(by.id('filter-modal'))).toBeVisible();
    });

    it('should filter by category', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.id('filter-category-food')).tap();
      await element(by.id('apply-filter-button')).tap();

      // Transactions list should be filtered
      await detoxExpect(element(by.id('transaction-list'))).toBeVisible();
    });

    it('should filter by receipt type', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.id('filter-receipt')).tap();
      await element(by.id('apply-filter-button')).tap();

      await detoxExpect(element(by.id('transaction-list'))).toBeVisible();
    });

    it('should filter by manual entry', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.id('filter-manual')).tap();
      await element(by.id('apply-filter-button')).tap();

      await detoxExpect(element(by.id('transaction-list'))).toBeVisible();
    });
  });

  describe('Search Transactions', () => {
    beforeEach(async () => {
      await element(by.id('transactions-tab')).tap();
    });

    it('should open search', async () => {
      await element(by.id('search-button')).tap();
      await detoxExpect(element(by.id('search-input'))).toBeVisible();
    });

    it('should filter transactions by search term', async () => {
      await element(by.id('search-button')).tap();
      await element(by.id('search-input')).typeText('Lunch');

      // Should show filtered results
      await detoxExpect(element(by.id('transaction-list'))).toBeVisible();
    });

    it('should show empty state when no results match', async () => {
      await element(by.id('search-button')).tap();
      await element(by.id('search-input')).typeText('xyznonexistent123');

      await detoxExpect(element(by.id('empty-search-results'))).toBeVisible();
    });
  });

  describe('Delete Transaction', () => {
    beforeEach(async () => {
      await element(by.id('transactions-tab')).tap();
      await element(by.id('transaction-item-0')).tap();
    });

    it('should show delete option in transaction detail', async () => {
      await detoxExpect(element(by.id('delete-transaction-button'))).toBeVisible();
    });

    it('should show confirmation before deleting', async () => {
      await element(by.id('delete-transaction-button')).tap();
      await detoxExpect(element(by.id('delete-confirmation'))).toBeVisible();
    });

    it('should delete transaction on confirmation', async () => {
      await element(by.id('delete-transaction-button')).tap();
      await element(by.id('confirm-delete-button')).tap();

      // Should navigate back to transactions list
      await detoxExpect(element(by.id('transactions-screen'))).toBeVisible();
    });
  });
});
