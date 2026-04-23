import { NextResponse } from 'next/server';
import type { ApiResponse, ErrorOptions, HttpStatusCode, PaginatedOptions, SuccessOptions } from './types';
import { buildEnvelope, normalizeErrors } from './utils';

// ─── Success ──────────────────────────────────────────────────────────────────

/** 200 OK */
export function ok<T = null>(options: SuccessOptions<T> = {}): NextResponse<ApiResponse<T>> {
  const { data = null, message = 'OK', meta = null, status = 200, headers } = options;
  return NextResponse.json(buildEnvelope<T>(true, message, data as T | null, null, meta), { status, headers });
}

/** 201 Created */
export function created<T = null>(options: SuccessOptions<T> = {}): NextResponse<ApiResponse<T>> {
  const { data = null, message = 'Created', meta = null, headers } = options;
  return NextResponse.json(buildEnvelope<T>(true, message, data as T | null, null, meta), { status: 201, headers });
}

/** 204 No Content — empty body, ideal for DELETE */
export function noContent(headers?: Record<string, string>): NextResponse {
  return new NextResponse(null, { status: 204, headers });
}

/** 200 OK — paginated list, auto-calculates totalPages */
export function paginated<T>(options: PaginatedOptions<T>): NextResponse<ApiResponse<T[]>> {
  const { data, total, page, limit, message = 'OK', headers } = options;
  return NextResponse.json(
    buildEnvelope<T[]>(true, message, data, null, { page, limit, total, totalPages: Math.ceil(total / limit) }),
    { status: 200, headers },
  );
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/** 400 Bad Request */
export function badRequest(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Bad Request', errors, status = 400, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status, headers });
}

/** 401 Unauthorized */
export function unauthorized(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Unauthorized', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 401, headers });
}

/** 403 Forbidden */
export function forbidden(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Forbidden', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 403, headers });
}

/** 404 Not Found */
export function notFound(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Not Found', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 404, headers });
}

/** 405 Method Not Allowed */
export function methodNotAllowed(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Method Not Allowed', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 405, headers });
}

/** 409 Conflict */
export function conflict(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Conflict', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 409, headers });
}

/**
 * 422 Unprocessable Entity — accepts Zod .flatten(), string[], ApiError[], Record<string,string[]>
 * @example
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) return unprocessable(parsed.error.flatten());
 */
export function unprocessable(
  errors: ErrorOptions['errors'],
  options: Omit<ErrorOptions, 'errors' | 'status'> = {},
): NextResponse<ApiResponse<null>> {
  const { message = 'Validation Failed', headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 422, headers });
}

/** 429 Too Many Requests */
export function tooManyRequests(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Too Many Requests', errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 429, headers });
}

/**
 * 500 Internal Server Error
 * — hides error detail in production, exposes it in development automatically
 */
export function serverError(error?: unknown, options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Internal Server Error', headers } = options;
  const errors = process.env.NODE_ENV === 'development' && error ? normalizeErrors(error) : null;
  return NextResponse.json(buildEnvelope(false, message, null, errors, null), { status: 500, headers });
}

/**
 * Escape hatch — full control over status, shape, and headers.
 * @example
 * return respond({ success: true, data: job, status: 202, message: 'Queued' });
 */
export function respond<T = null>(options: {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ErrorOptions['errors'];
  meta?: ApiResponse['meta'];
  status: HttpStatusCode;
  headers?: Record<string, string>;
}): NextResponse<ApiResponse<T>> {
  const { success, data = null, message = success ? 'OK' : 'Error', errors, meta = null, status, headers } = options;
  return NextResponse.json(
    buildEnvelope<T>(success, message, data as T | null, normalizeErrors(errors), meta),
    { status, headers },
  );
}
