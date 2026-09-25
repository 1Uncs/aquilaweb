export function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message) return error.message;
    return 'An unexpected error occurred.';
  }
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}
