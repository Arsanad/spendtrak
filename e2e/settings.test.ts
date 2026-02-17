/**
 * Settings Screen E2E Tests
 * Tests for navigating and interacting with settings options
 */

import { device, element, by, expect as detoxExpect } from 'detox';
import { waitForElement, tapElement, scrollDown, takeScreenshot } from './setup';

describe('Settings Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Sign in first
    await waitForElement('welcome-screen');
    await tapElement('signin-button');
    await waitForElement('email-input');

    const testEmail = process.env.TEST_EMAIL || 'test@spendtrak.app';
    const testPassword = process.env.TEST_PASSWORD || 'TestPass123!';

    await element(by.id('email-input')).typeText(testEmail);
    await element(by.id('password-input')).typeText(testPassword);
    await tapElement('submit-button');

    // Wait for dashboard to load
    await waitForElement('dashboard-screen', 15000);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitForElement('dashboard-screen', 10000);
  });

  it('should navigate to Settings tab', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');
    await takeScreenshot('settings-screen');

    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('should verify settings screen loads with user profile section', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await detoxExpect(element(by.id('profile-section'))).toBeVisible();
    await takeScreenshot('settings-profile-section');
  });

  it('should tap Notifications and verify preferences screen opens', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 200);
    await tapElement('notifications-setting');
    await waitForElement('notifications-screen');

    await detoxExpect(element(by.id('notifications-screen'))).toBeVisible();
    await takeScreenshot('notifications-screen');
  });

  it('should tap Currency and verify currency selector appears', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 200);
    await tapElement('currency-setting');
    await waitForElement('currency-screen');

    await detoxExpect(element(by.id('currency-screen'))).toBeVisible();
    await takeScreenshot('currency-screen');
  });

  it('should navigate back to Settings from Currency', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 200);
    await tapElement('currency-setting');
    await waitForElement('currency-screen');

    await tapElement('back-button');
    await waitForElement('settings-screen');

    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    await takeScreenshot('settings-back-from-currency');
  });

  it('should tap Connect Email and verify email provider list appears', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 400);
    await tapElement('connect-email-setting');
    await waitForElement('connect-email-screen');

    await detoxExpect(element(by.id('connect-email-screen'))).toBeVisible();
    await takeScreenshot('connect-email-screen');
  });

  it('should navigate back to Settings from Connect Email', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 400);
    await tapElement('connect-email-setting');
    await waitForElement('connect-email-screen');

    await tapElement('back-button');
    await waitForElement('settings-screen');

    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    await takeScreenshot('settings-back-from-email');
  });

  it('should verify Sign Out button is visible', async () => {
    await tapElement('settings-tab');
    await waitForElement('settings-screen');

    await scrollDown('settings-scroll', 800);

    await detoxExpect(element(by.id('signout-button'))).toBeVisible();
    await takeScreenshot('settings-signout-visible');
  });
});
