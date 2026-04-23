import { NextResponse } from 'next/server';

/**
 * next-response-kit — Types
 * Author: Shrikant Yadav
 */
type HttpStatusCode = 200 | 201 | 202 | 204 | 301 | 302 | 304 | 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 410 | 413 | 415 | 422 | 429 | 500 | 501 | 502 | 503 | 504;
/**
 * Every response — success or error — returns this exact shape.
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
/** One error item — field-level for validation, general for everything else. */
interface ApiError {
    field?: string;
    message: string;
    code?: string;
}
/** Optional metadata — automatically populated by paginated(). */
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
/** Shape returned by Zod's .flatten() — accepted natively by unprocessable(). */
interface ZodFlattenedError {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
}

/** 200 OK */
declare function ok<T = null>(options?: SuccessOptions<T>): NextResponse<ApiResponse<T>>;
/** 201 Created */
declare function created<T = null>(options?: SuccessOptions<T>): NextResponse<ApiResponse<T>>;
/** 204 No Content — empty body, ideal for DELETE */
declare function noContent(headers?: Record<string, string>): NextResponse;
/** 200 OK — paginated list, auto-calculates totalPages */
declare function paginated<T>(options: PaginatedOptions<T>): NextResponse<ApiResponse<T[]>>;
/** 400 Bad Request */
declare function badRequest(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/** 401 Unauthorized */
declare function unauthorized(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/** 403 Forbidden */
declare function forbidden(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/** 404 Not Found */
declare function notFound(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/** 405 Method Not Allowed */
declare function methodNotAllowed(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/** 409 Conflict */
declare function conflict(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 422 Unprocessable Entity — accepts Zod .flatten(), string[], ApiError[], Record<string,string[]>
 * @example
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) return unprocessable(parsed.error.flatten());
 */
declare function unprocessable(errors: ErrorOptions['errors'], options?: Omit<ErrorOptions, 'errors' | 'status'>): NextResponse<ApiResponse<null>>;
/** 429 Too Many Requests */
declare function tooManyRequests(options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * 500 Internal Server Error
 * — hides error detail in production, exposes it in development automatically
 */
declare function serverError(error?: unknown, options?: ErrorOptions): NextResponse<ApiResponse<null>>;
/**
 * Escape hatch — full control over status, shape, and headers.
 * @example
 * return respond({ success: true, data: job, status: 202, message: 'Queued' });
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

/**
 * next-response-kit
 *
 * Two ways to use — pick whichever feels natural to you:
 *
 * ① Drop-in replacement (same mental model as Next.js):
 *    import NextResponse from 'next-response-kit';
 *    return NextResponse.json({ user }, { status: 200 });          // still works
 *    return NextResponse.ok({ data: user });                        // typed helper
 *    return NextResponse.notFound({ message: 'User not found' });   // typed helper
 *
 * ② Named imports (explicit, one import line):
 *    import { ok, notFound, serverError } from 'next-response-kit';
 *    return ok({ data: user });
 *
 * Both produce the same consistent ApiResponse shape.
 * Author: Shrikant Yadav
 */

declare class NextResponseKit extends NextResponse {
    static ok: typeof ok;
    static created: typeof created;
    static noContent: typeof noContent;
    static paginated: typeof paginated;
    static badRequest: typeof badRequest;
    static unauthorized: typeof unauthorized;
    static forbidden: typeof forbidden;
    static notFound: typeof notFound;
    static methodNotAllowed: typeof methodNotAllowed;
    static conflict: typeof conflict;
    static unprocessable: typeof unprocessable;
    static tooManyRequests: typeof tooManyRequests;
    static serverError: typeof serverError;
    static respond: typeof respond;
}

export { type ApiError, type ApiResponse, type ErrorOptions, type HttpStatusCode, type PaginatedOptions, type ResponseMeta, type SuccessOptions, type ZodFlattenedError, badRequest, conflict, created, NextResponseKit as default, forbidden, methodNotAllowed, noContent, notFound, ok, paginated, respond, serverError, tooManyRequests, unauthorized, unprocessable };
