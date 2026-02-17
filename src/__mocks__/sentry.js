module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((cb) => cb({ setExtra: jest.fn(), setTag: jest.fn() })),
  Severity: { Error: 'error', Warning: 'warning', Info: 'info' },
  ReactNavigationInstrumentation: jest.fn(),
  ReactNativeTracing: jest.fn(),
};
