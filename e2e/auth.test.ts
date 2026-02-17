/**
 * Detox E2E Tests - Authentication Flow
 *
 * Tests:
 * - Sign up with email
 * - Email verification prompt
 * - Sign in with email/password
 * - Sign out
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Welcome Screen', () => {
    it('should show the welcome screen on first launch', async () => {
      await detoxExpect(element(by.id('welcome-screen'))).toBeVisible();
    });

    it('should display Get Started button', async () => {
      await detoxExpect(element(by.id('get-started-button'))).toBeVisible();
    });

    it('should navigate to sign in when Get Started is tapped', async () => {
      await element(by.id('get-started-button')).tap();
      await detoxExpect(element(by.id('signin-screen'))).toBeVisible();
    });
  });

  describe('Sign Up', () => {
    beforeEach(async () => {
      // Navigate to sign up screen
      await element(by.id('get-started-button')).tap();
      await element(by.id('signup-link')).tap();
    });

    it('should show the sign up form', async () => {
      await detoxExpect(element(by.id('signup-screen'))).toBeVisible();
      await detoxExpect(element(by.id('signup-email-input'))).toBeVisible();
      await detoxExpect(element(by.id('signup-password-input'))).toBeVisible();
      await detoxExpect(element(by.id('signup-button'))).toBeVisible();
    });

    it('should show validation error for invalid email', async () => {
      await element(by.id('signup-email-input')).typeText('invalid-email');
      await element(by.id('signup-password-input')).typeText('Password123!');
      await element(by.id('signup-button')).tap();

      await detoxExpect(element(by.id('email-error'))).toBeVisible();
    });

    it('should show validation error for weak password', async () => {
      await element(by.id('signup-email-input')).typeText('test@example.com');
      await element(by.id('signup-password-input')).typeText('123');
      await element(by.id('signup-button')).tap();

      await detoxExpect(element(by.id('password-error'))).toBeVisible();
    });

    it('should show email verification prompt after successful sign up', async () => {
      await element(by.id('signup-email-input')).typeText('newuser@example.com');
      await element(by.id('signup-password-input')).typeText('SecurePass123!');
      await element(by.id('signup-confirm-password-input')).typeText('SecurePass123!');
      await element(by.id('signup-button')).tap();

      // Should show email verification prompt
      await detoxExpect(element(by.id('email-verification-prompt'))).toBeVisible();
    });
  });

  describe('Sign In', () => {
    beforeEach(async () => {
      // Navigate to sign in screen
      await element(by.id('get-started-button')).tap();
    });

    it('should show the sign in form', async () => {
      await detoxExpect(element(by.id('signin-screen'))).toBeVisible();
      await detoxExpect(element(by.id('signin-email-input'))).toBeVisible();
      await detoxExpect(element(by.id('signin-password-input'))).toBeVisible();
      await detoxExpect(element(by.id('signin-button'))).toBeVisible();
    });

    it('should show error for wrong credentials', async () => {
      await element(by.id('signin-email-input')).typeText('wrong@example.com');
      await element(by.id('signin-password-input')).typeText('wrongpassword');
      await element(by.id('signin-button')).tap();

      await detoxExpect(element(by.id('auth-error'))).toBeVisible();
    });

    it('should sign in successfully with valid credentials', async () => {
      await element(by.id('signin-email-input')).typeText('test@example.com');
      await element(by.id('signin-password-input')).typeText('TestPass123!');
      await element(by.id('signin-button')).tap();

      // Should navigate to the dashboard/home screen
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Sign Out', () => {
    beforeEach(async () => {
      // Sign in first
      await element(by.id('get-started-button')).tap();
      await element(by.id('signin-email-input')).typeText('test@example.com');
      await element(by.id('signin-password-input')).typeText('TestPass123!');
      await element(by.id('signin-button')).tap();
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should sign out from settings', async () => {
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();

      // Scroll to sign out button
      await element(by.id('settings-scroll')).scrollTo('bottom');

      // Tap sign out
      await element(by.id('signout-button')).tap();

      // Confirm sign out if there's a confirmation dialog
      try {
        await element(by.id('confirm-signout')).tap();
      } catch {
        // No confirmation dialog, continue
      }

      // Should return to welcome/sign-in screen
      await detoxExpect(element(by.id('welcome-screen'))).toBeVisible();
    });
  });
});
