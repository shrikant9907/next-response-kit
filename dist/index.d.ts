import { NextResponse } from 'next/server';

/**
 * next-response-kit
 * Centralized, typed API response helper for Next.js App Router
 * Author: Shrikant Yadav
 */
type HttpStatusCode = 200 | 201 | 202 | 204 | 301 | 302 | 304 | 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 410 | 413 | 415 | 422 | 429 | 500 | 501 | 502 | 503 | 504;
/**
 * The consistent API response shape returned by every helper.
 * `data` is null on errors. `errors` is null on success.
 */
interface ApiResponse<T = null> {
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
interface ApiError {
    field?: string;
    message: string;
    code?: string;
}
/**
 * Optional metadata for paginated or enriched responses.
 */
interface ResponseMeta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
}
interface SuccessOptions<T> {
    data?: T;
    message?: string;
    meta?: ResponseMeta;
    status?: HttpStatusCode;
    headers?: Record<string, string>;
}
interface ErrorOptions {
    message?: string;
    errors?: ApiError[] | string[] | Record<string, string[]>;
    status?: HttpStatusCode;
    headers?: Record<string, string>;
}
interface PaginatedOptions<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    message?: string;
    headers?: Record<string, string>;
}
/**
 * Shape returned by zod's `.flatten()` — used for auto-serializing zod errors.
 */
interface ZodFlattenedError {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
}

/**
 * 200 OK — generic success with optional data payload.
 *
 * @example
 * return ok({ data: user, message: 'User fetched' });
 */
declare function ok<T = null>(options?: SuccessOptions<T>): NextResponse<ApiResponse<T>>;
/**
 * 201 Created — resource successfully created.
 *
 * @example
 * return created({ data: newProduct, message: 'Product created' });
 */
declare function created<T = null>(options?: SuccessOptions<T>): NextResponse<ApiResponse<T>>;
/**
 * 204 No Content — success with no response body.
 * Useful for DELETE operations.
 *
 * @example
 * return noContent();
 */
declare function noContent(headers?: Record<string, string>): NextResponse;
/**
 * 200 OK — paginated list response with automatic meta calculation.
 *
 * @example
 * return paginated({ data: products, total: 120, page: 1, limit: 20 });
 */
declare function paginated<T>(options: PaginatedOptions<T>): NextResponse<ApiResponse<T[]>>;
/**
 * 400 Bad Request — malformed input or missing required fields.
 *
 * @example
 * return badRequest({ message: 'Invalid input', errors: ['name is required'] });
 */
declare function badRequest(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 401 Unauthorized — authentication required or token invalid.
 *
 * @example
 * return unauthorized();
 * return unauthorized({ message: 'Token expired' });
 */
declare function unauthorized(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 403 Forbidden — authenticated but insufficient permissions.
 *
 * @example
 * return forbidden({ message: 'Admin access required' });
 */
declare function forbidden(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 404 Not Found — resource does not exist.
 *
 * @example
 * return notFound({ message: 'Product not found' });
 */
declare function notFound(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 405 Method Not Allowed.
 *
 * @example
 * return methodNotAllowed();
 */
declare function methodNotAllowed(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 409 Conflict — resource already exists or state conflict.
 *
 * @example
 * return conflict({ message: 'Email already registered' });
 */
declare function conflict(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 422 Unprocessable Entity — validation errors (most common for form/Zod errors).
 * Accepts Zod `.flatten()` output, string[], ApiError[], or Record<string, string[]>.
 *
 * @example
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) return unprocessable(parsed.error.flatten());
 */
declare function unprocessable(errors: ErrorOptions['errors'], options?: Omit<ErrorOptions, 'errors' | 'status'>): NextResponse<ApiResponse<null>>;
/**
 * 429 Too Many Requests — rate limit exceeded.
 *
 * @example
 * return tooManyRequests({ message: 'Slow down, too many requests' });
 */
declare function tooManyRequests(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 500 Internal Server Error — unexpected server failures.
 * In production, hides raw error details. In development, exposes them.
 *
 * @example
 * return serverError(error);
 * return serverError(error, { message: 'Failed to send email' });
 */
declare function serverError(error?: unknown, options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * Escape hatch — build any custom response with full control.
 * Useful for non-standard status codes or special flows.
 *
 * @example
 * return respond({ success: true, data: result, status: 202, message: 'Processing' });
 */
declare function respond<T = null>(options: {
    success: boolean;
    data?: T;
    message?: string;
    errors?: ErrorOptions['errors'];
    meta?: ApiResponse['meta'];
    status: HttpStatusCode;
    headers?: Record<string, string>;
}): NextResponse<ApiResponse<T>>;

export { type ApiError, type ApiResponse, type ErrorOptions, type HttpStatusCode, type PaginatedOptions, type ResponseMeta, type SuccessOptions, type ZodFlattenedError, badRequest, conflict, created, forbidden, methodNotAllowed, noContent, notFound, ok, paginated, respond, serverError, tooManyRequests, unauthorized, unprocessable };
