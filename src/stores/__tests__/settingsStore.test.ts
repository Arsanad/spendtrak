/**
 * Settings Store Tests
 */

import { useSettingsStore } from '../settingsStore';

describe('Settings Store', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const state = useSettingsStore.getState();

      expect(state.theme).toBe('system');
      expect(state.language).toBe('en');
      expect(state.currency).toBe('AED');
      expect(state.currencySymbol).toBe('AED'); // English symbol when language is 'en'
      expect(state.pushNotifications).toBe(true);
      expect(state.emailDigest).toBe(false);
      expect(state.alertUnusualSpending).toBe(true);
      expect(state.alertSubscriptions).toBe(true);
      expect(state.alertBudget).toBe(true);
      expect(state.alertBills).toBe(true);
      expect(state.quietHoursEnabled).toBe(false);
      expect(state.quietHoursStart).toBe('22:00');
      expect(state.quietHoursEnd).toBe('08:00');
      expect(state.showCents).toBe(true);
      expect(state.weekStartsOn).toBe('sunday');
      expect(state.dateFormat).toBe('DD/MM/YYYY');
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      useSettingsStore.getState().setTheme('dark');
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('should set theme to light', () => {
      useSettingsStore.getState().setTheme('light');
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('should set theme to system', () => {
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setTheme('system');
      expect(useSettingsStore.getState().theme).toBe('system');
    });
  });

  describe('setLanguage', () => {
    it('should set language', () => {
      useSettingsStore.getState().setLanguage('ar');
      expect(useSettingsStore.getState().language).toBe('ar');
    });

    it('should set different languages', () => {
      useSettingsStore.getState().setLanguage('es');
      expect(useSettingsStore.getState().language).toBe('es');
    });

    it('should update currency symbol when language changes to Arabic', () => {
      // Start with English (default)
      expect(useSettingsStore.getState().currencySymbol).toBe('AED');

      // Change to Arabic
      useSettingsStore.getState().setLanguage('ar');

      // Currency symbol should now be Arabic
      expect(useSettingsStore.getState().currencySymbol).toBe('د.إ');
    });

    it('should update currency symbol when language changes back to English', () => {
      // Change to Arabic first
      useSettingsStore.getState().setLanguage('ar');
      expect(useSettingsStore.getState().currencySymbol).toBe('د.إ');

      // Change back to English
      useSettingsStore.getState().setLanguage('en');

      // Currency symbol should now be English
      expect(useSettingsStore.getState().currencySymbol).toBe('AED');
    });
  });

  describe('setCurrency', () => {
    it('should set currency and symbol', () => {
      useSettingsStore.getState().setCurrency('USD', '$');

      const state = useSettingsStore.getState();
      expect(state.currency).toBe('USD');
      expect(state.currencySymbol).toBe('$');
    });

    it('should set EUR currency', () => {
      useSettingsStore.getState().setCurrency('EUR', '€');

      const state = useSettingsStore.getState();
      expect(state.currency).toBe('EUR');
      expect(state.currencySymbol).toBe('€');
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update push notifications', () => {
      useSettingsStore.getState().updateNotificationSettings({
        pushNotifications: false,
      });

      expect(useSettingsStore.getState().pushNotifications).toBe(false);
    });

    it('should update multiple notification settings', () => {
      useSettingsStore.getState().updateNotificationSettings({
        emailDigest: true,
        alertUnusualSpending: false,
        quietHoursEnabled: true,
      });

      const state = useSettingsStore.getState();
      expect(state.emailDigest).toBe(true);
      expect(state.alertUnusualSpending).toBe(false);
      expect(state.quietHoursEnabled).toBe(true);
    });

    it('should update quiet hours times', () => {
      useSettingsStore.getState().updateNotificationSettings({
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
      });

      const state = useSettingsStore.getState();
      expect(state.quietHoursStart).toBe('23:00');
      expect(state.quietHoursEnd).toBe('07:00');
    });
  });

  describe('updateDisplaySettings', () => {
    it('should update showCents', () => {
      useSettingsStore.getState().updateDisplaySettings({
        showCents: false,
      });

      expect(useSettingsStore.getState().showCents).toBe(false);
    });

    it('should update weekStartsOn', () => {
      useSettingsStore.getState().updateDisplaySettings({
        weekStartsOn: 'monday',
      });

      expect(useSettingsStore.getState().weekStartsOn).toBe('monday');
    });

    it('should update dateFormat', () => {
      useSettingsStore.getState().updateDisplaySettings({
        dateFormat: 'YYYY-MM-DD',
      });

      expect(useSettingsStore.getState().dateFormat).toBe('YYYY-MM-DD');
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      // Change several settings
      useSettingsStore.getState().setTheme('dark');
      useSettingsStore.getState().setLanguage('ar');
      useSettingsStore.getState().setCurrency('EUR', '€');
      useSettingsStore.getState().updateNotificationSettings({
        pushNotifications: false,
        emailDigest: true,
      });
      useSettingsStore.getState().updateDisplaySettings({
        showCents: false,
        weekStartsOn: 'monday',
      });

      // Verify changes took effect
      expect(useSettingsStore.getState().theme).toBe('dark');
      expect(useSettingsStore.getState().language).toBe('ar');

      // Reset
      useSettingsStore.getState().resetSettings();

      // Verify reset
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('system');
      expect(state.language).toBe('en');
      expect(state.currency).toBe('AED');
      expect(state.pushNotifications).toBe(true);
      expect(state.emailDigest).toBe(false);
      expect(state.showCents).toBe(true);
      expect(state.weekStartsOn).toBe('sunday');
    });
  });
});
