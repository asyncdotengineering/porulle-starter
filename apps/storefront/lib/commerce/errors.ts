export interface CommerceApiError {
  code: string;
  message: string;
}

/** Throws when an SDK call returned an error envelope; narrows `data` to non-null. */
export function assertOk<T>(
  result: { data?: T; error?: { error?: CommerceApiError } | unknown },
  operation: string,
): asserts result is { data: T } {
  if (result.error || result.data == null) {
    const err = result.error as { error?: CommerceApiError } | undefined;
    const message = err?.error?.message ?? `porulle request failed: ${operation}`;
    throw new Error(message);
  }
}

export async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}
