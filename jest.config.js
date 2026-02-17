/**
 * Jest Configuration for SpendTrak
 * Unit, Component, and Integration Testing
 */

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock expo modules
    '^expo-font$': '<rootDir>/src/__mocks__/expo-font.js',
    '^expo-splash-screen$': '<rootDir>/src/__mocks__/expo-splash-screen.js',
    '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.js',
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.js',
    '^expo-router$': '<rootDir>/src/__mocks__/expo-router.js',
    '^expo-camera$': '<rootDir>/src/__mocks__/expo-camera.js',
    '^expo-image-picker$': '<rootDir>/src/__mocks__/expo-image-picker.js',
    '^expo-notifications$': '<rootDir>/src/__mocks__/expo-notifications.js',
    '^expo-linear-gradient$': '<rootDir>/src/__mocks__/expo-linear-gradient.js',
    '^expo-constants$': '<rootDir>/src/__mocks__/expo-constants.js',
    '^expo-file-system$': '<rootDir>/src/__mocks__/expo-file-system.js',
    '^expo-sharing$': '<rootDir>/src/__mocks__/expo-sharing.js',
    '^expo$': '<rootDir>/src/__mocks__/expo.js',
    '^expo/(.*)$': '<rootDir>/src/__mocks__/expo.js',
    '^@sentry/react-native$': '<rootDir>/src/__mocks__/sentry.js',
  },
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    // Services directory should have higher coverage
    './src/services/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Critical paths should have even higher coverage
    './src/services/transactions.ts': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/auth.ts': {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/purchases.ts': {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/receiptScanner.ts': {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
