import type { ApiError, ApiResponse, ZodFlattenedError } from './types';

/**
 * Builds the consistent ApiResponse envelope.
 * Internal — not exported from package root.
 */
export function buildEnvelope<T>(
  success: boolean,
  message: string,
  data: T | null,
  errors: ApiError[] | null,
  meta: ApiResponse['meta'],
): ApiResponse<T> {
  return {
    success,
    message,
    data,
    errors,
    meta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Normalizes any error input into ApiError[].
 *
 * Accepts:
 *   string[]                  → [{ message }]
 *   ApiError[]                → passed through
 *   Record<string, string[]>  → [{ field, message }]
 *   ZodFlattenedError         → field + form errors
 *   Error (native)            → [{ message, code }]
 */
export function normalizeErrors(input: unknown): ApiError[] {
  if (!input) return [];

  if (input instanceof Error) {
    return [{ message: input.message, code: input.name }];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') return { message: item };
      if (typeof item === 'object' && item !== null && 'message' in item) return item as ApiError;
      return { message: String(item) };
    });
  }

  if (typeof input === 'object' && input !== null) {
    const zodLike = input as ZodFlattenedError;
    if ('fieldErrors' in zodLike || 'formErrors' in zodLike) {
      const result: ApiError[] = [];
      if (zodLike.fieldErrors) {
        for (const [field, messages] of Object.entries(zodLike.fieldErrors)) {
          for (const message of messages ?? []) result.push({ field, message });
        }
      }
      if (zodLike.formErrors) {
        for (const message of zodLike.formErrors) result.push({ message });
      }
      return result;
    }

    const record = input as Record<string, string[] | string>;
    const result: ApiError[] = [];
    for (const [field, messages] of Object.entries(record)) {
      const list = Array.isArray(messages) ? messages : [messages];
      for (const message of list) result.push({ field, message });
    }
    return result;
  }

  return [{ message: String(input) }];
}
