/**
 * next-response-kit
 * Centralized, typed API response helper for Next.js App Router
 * Author: Shrikant Yadav
 */

// ─── HTTP Status Codes ───────────────────────────────────────────────────────

export type HttpStatusCode =
  | 200 | 201 | 202 | 204
  | 301 | 302 | 304
  | 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 410 | 413 | 415 | 422 | 429
  | 500 | 501 | 502 | 503 | 504;

// ─── Standard Response Shape ─────────────────────────────────────────────────

/**
 * The consistent API response shape returned by every helper.
 * `data` is null on errors. `errors` is null on success.
 */
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiError[] | null;
  meta: ResponseMeta | null;
  timestamp: string;
}

/**
 * Structured error object — one per validation field or per error event.
 */
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Optional metadata for paginated or enriched responses.
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

// ─── Builder Option Types ────────────────────────────────────────────────────

export interface SuccessOptions<T> {
  data?: T;
  message?: string;
  meta?: ResponseMeta;
  status?: HttpStatusCode;
  headers?: Record<string, string>;
}

export interface ErrorOptions {
  message?: string;
  errors?: ApiError[] | string[] | Record<string, string[]>;
  status?: HttpStatusCode;
  headers?: Record<string, string>;
}

export interface PaginatedOptions<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  headers?: Record<string, string>;
}

// ─── Zod / Validation Error Shape ───────────────────────────────────────────

/**
 * Shape returned by zod's `.flatten()` — used for auto-serializing zod errors.
 */
export interface ZodFlattenedError {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
}
