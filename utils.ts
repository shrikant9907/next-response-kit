import type {
  ApiError,
  ApiResponse,
  ZodFlattenedError,
} from './types';

/**
 * Builds the consistent ApiResponse envelope.
 * Internal — not exported from the package root.
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
 * Normalizes any form of error input into a consistent ApiError[].
 *
 * Accepts:
 * - string[]                         → [{ message }]
 * - ApiError[]                       → passed through
 * - Record<string, string[]>         → [{ field, message }]
 * - ZodFlattenedError                → field errors + form errors
 * - Error (native)                   → [{ message: err.message }]
 */
export function normalizeErrors(
  input: unknown,
): ApiError[] {
  if (!input) return [];

  // Native Error object
  if (input instanceof Error) {
    return [{ message: input.message, code: input.name }];
  }

  // string[]
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') return { message: item };
      // Already ApiError shape
      if (typeof item === 'object' && item !== null && 'message' in item) {
        return item as ApiError;
      }
      return { message: String(item) };
    });
  }

  // ZodFlattenedError  { formErrors, fieldErrors }
  if (typeof input === 'object' && input !== null) {
    const zodLike = input as ZodFlattenedError;
    if ('fieldErrors' in zodLike || 'formErrors' in zodLike) {
      const result: ApiError[] = [];

      if (zodLike.fieldErrors) {
        for (const [field, messages] of Object.entries(zodLike.fieldErrors)) {
          for (const message of messages ?? []) {
            result.push({ field, message });
          }
        }
      }

      if (zodLike.formErrors) {
        for (const message of zodLike.formErrors) {
          result.push({ message });
        }
      }

      return result;
    }

    // Record<string, string[]>  — custom field error map
    const record = input as Record<string, string[] | string>;
    const result: ApiError[] = [];
    for (const [field, messages] of Object.entries(record)) {
      const list = Array.isArray(messages) ? messages : [messages];
      for (const message of list) {
        result.push({ field, message });
      }
    }
    return result;
  }

  // Fallback: stringify whatever was passed
  return [{ message: String(input) }];
}
