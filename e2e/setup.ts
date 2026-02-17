/**
 * Detox E2E Test Setup
 * Configuration and global hooks for Detox tests
 */

import { device, element, by, expect as detoxExpect } from 'detox';

beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
});

afterAll(async () => {
  await device.terminateApp();
});

beforeEach(async () => {
  await device.reloadReactNative();
});

/**
 * Utility: Wait for an element to be visible with a custom timeout
 */
export async function waitForElement(
  testID: string,
  timeout: number = 5000
): Promise<void> {
  await detoxExpect(element(by.id(testID))).toBeVisible().withTimeout(timeout);
}

/**
 * Utility: Tap an element by testID
 */
export async function tapElement(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

/**
 * Utility: Type text into an input by testID
 */
export async function typeText(
  testID: string,
  text: string
): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

/**
 * Utility: Scroll down on a scrollable element
 */
export async function scrollDown(
  testID: string,
  distance: number = 300
): Promise<void> {
  await element(by.id(testID)).scroll(distance, 'down');
}

/**
 * Utility: Take a screenshot with a descriptive name
 */
export async function takeScreenshot(name: string): Promise<void> {
  await device.takeScreenshot(name);
}
