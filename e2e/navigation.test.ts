/**
 * Detox E2E Tests - Navigation Flow
 *
 * Tests:
 * - Bottom tab navigation
 * - Settings sub-screens
 * - Back navigation
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Sign in to reach the main app
    await element(by.id('get-started-button')).tap();
    await element(by.id('signin-email-input')).typeText('test@example.com');
    await element(by.id('signin-password-input')).typeText('TestPass123!');
    await element(by.id('signin-button')).tap();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Bottom Tabs', () => {
    it('should navigate to the transactions tab', async () => {
      await element(by.id('transactions-tab')).tap();
      await detoxExpect(element(by.id('transactions-screen'))).toBeVisible();
    });

    it('should navigate to the add tab', async () => {
      await element(by.id('add-tab')).tap();
      await detoxExpect(element(by.id('add-screen'))).toBeVisible();
    });

    it('should navigate to the stats tab', async () => {
      await element(by.id('stats-tab')).tap();
      await detoxExpect(element(by.id('stats-screen'))).toBeVisible();
    });

    it('should navigate to the settings tab', async () => {
      await element(by.id('settings-tab')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should navigate back to home tab', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('home-tab')).tap();
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Settings Sub-Screens', () => {
    beforeEach(async () => {
      await element(by.id('settings-tab')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should navigate to categories settings', async () => {
      await element(by.id('settings-categories')).tap();
      await detoxExpect(element(by.id('categories-screen'))).toBeVisible();
    });

    it('should navigate to budgets settings', async () => {
      await element(by.id('settings-budgets')).tap();
      await detoxExpect(element(by.id('budgets-screen'))).toBeVisible();
    });

    it('should navigate to currency settings', async () => {
      await element(by.id('settings-scroll')).scrollTo('bottom');
      await element(by.id('settings-currency')).tap();
      await detoxExpect(element(by.id('currency-screen'))).toBeVisible();
    });

    it('should navigate to language settings', async () => {
      await element(by.id('settings-scroll')).scrollTo('bottom');
      await element(by.id('settings-language')).tap();
      await detoxExpect(element(by.id('language-screen'))).toBeVisible();
    });
  });

  describe('Back Navigation', () => {
    it('should navigate back from categories to settings', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('settings-categories')).tap();
      await detoxExpect(element(by.id('categories-screen'))).toBeVisible();

      await element(by.id('back-button')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should navigate back from budgets to settings', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('settings-budgets')).tap();
      await detoxExpect(element(by.id('budgets-screen'))).toBeVisible();

      await element(by.id('back-button')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    });
  });
});
