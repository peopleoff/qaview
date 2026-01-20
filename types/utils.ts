/**
 * Utility functions for type-safe error handling.
 */

/**
 * Safely extracts an error message from an unknown error type.
 * This replaces the anti-pattern of `catch (error: any)`.
 *
 * @param error - The caught error of unknown type
 * @returns A string error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
