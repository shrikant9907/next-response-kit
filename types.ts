/**
 * next-response-kit — Types
 * Author: Shrikant Yadav
 */

// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export type HttpStatusCode =
  | 200 | 201 | 202 | 204
  | 301 | 302 | 304
  | 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 410 | 413 | 415 | 422 | 429
  | 500 | 501 | 502 | 503 | 504;

// ─── Core Response Shape ──────────────────────────────────────────────────────

/**
 * Every response — success or error — returns this exact shape.
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

/** One error item — field-level for validation, general for everything else. */
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

/** Optional metadata — automatically populated by paginated(). */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

// ─── Options ──────────────────────────────────────────────────────────────────

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

/** Shape returned by Zod's .flatten() — accepted natively by unprocessable(). */
export interface ZodFlattenedError {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
}
