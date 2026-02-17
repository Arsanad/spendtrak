/**
 * Error Monitoring Service Tests
 * Tests for Sentry integration
 */

import {
  initErrorMonitoring,
  setMonitoringUser,
  clearMonitoringUser,
  captureError,
  addBreadcrumb,
} from '../errorMonitoring';
import * as Sentry from '@sentry/react-native';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  wrap: jest.fn((component) => component),
}));

describe('errorMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initErrorMonitoring', () => {
    it('should initialize Sentry with correct config', () => {
      initErrorMonitoring();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: expect.any(String),
          tracesSampleRate: 1.0,
        })
      );
    });

    it('should include beforeSend filter', () => {
      initErrorMonitoring();

      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(initCall.beforeSend).toBeDefined();
    });
  });

  describe('setMonitoringUser', () => {
    it('should set user context with id and email', () => {
      setMonitoringUser({ id: 'user-123', email: 'test@example.com' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should set user context with only id', () => {
      setMonitoringUser({ id: 'user-456' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-456',
        email: undefined,
      });
    });
  });

  describe('clearMonitoringUser', () => {
    it('should clear user context', () => {
      clearMonitoringUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureError', () => {
    it('should capture exception without context', () => {
      const error = new Error('Test error');

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: undefined,
        extra: undefined,
      });
    });

    it('should capture exception with tags', () => {
      const error = new Error('Test error');

      captureError(error, { tags: { feature: 'receipts', severity: 'high' } });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { feature: 'receipts', severity: 'high' },
        extra: undefined,
      });
    });

    it('should capture exception with extra data', () => {
      const error = new Error('Test error');

      captureError(error, {
        extra: { transactionId: '123', amount: 50.00 },
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: undefined,
        extra: { transactionId: '123', amount: 50.00 },
      });
    });

    it('should capture exception with both tags and extra', () => {
      const error = new Error('Test error');

      captureError(error, {
        tags: { component: 'scanner' },
        extra: { imageSize: 1024 },
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { component: 'scanner' },
        extra: { imageSize: 1024 },
      });
    });

    it('should capture non-Error objects', () => {
      const errorObject = { message: 'Something went wrong', code: 500 };

      captureError(errorObject);

      expect(Sentry.captureException).toHaveBeenCalledWith(errorObject, {
        tags: undefined,
        extra: undefined,
      });
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with required params', () => {
      addBreadcrumb('navigation', 'User navigated to dashboard');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'User navigated to dashboard',
        data: undefined,
        level: 'info',
      });
    });

    it('should add breadcrumb with data', () => {
      addBreadcrumb('transaction', 'Transaction created', { amount: 50, category: 'food' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'transaction',
        message: 'Transaction created',
        data: { amount: 50, category: 'food' },
        level: 'info',
      });
    });

    it('should add breadcrumb with custom level', () => {
      addBreadcrumb('error', 'API call failed', { endpoint: '/api/test' }, 'error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'error',
        message: 'API call failed',
        data: { endpoint: '/api/test' },
        level: 'error',
      });
    });

    it('should support different severity levels', () => {
      const levels: Sentry.SeverityLevel[] = ['fatal', 'error', 'warning', 'info', 'debug'];

      levels.forEach((level) => {
        addBreadcrumb('test', 'Test message', undefined, level);
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(levels.length);
    });
  });
});
