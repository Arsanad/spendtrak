/**
 * Error Handling Utilities
 * Type-safe error extraction for catch blocks using `error: unknown`
 */

/**
 * Extract a human-readable message from an unknown caught value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Check whether the caught value looks like an Error (has `.name`).
 * Useful for inspecting `error.name === 'AbortError'` etc.
 */
export function isErrorWithName(error: unknown): error is Error {
  return error instanceof Error;
}
