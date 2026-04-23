import { NextResponse } from 'next/server';
import type {
  ApiResponse,
  ErrorOptions,
  HttpStatusCode,
  PaginatedOptions,
  SuccessOptions,
} from './types';
import { buildEnvelope, normalizeErrors } from './utils';

// ─── Success Responses ───────────────────────────────────────────────────────

/**
 * 200 OK — generic success with optional data payload.
 *
 * @example
 * return ok({ data: user, message: 'User fetched' });
 */
export function ok<T = null>(options: SuccessOptions<T> = {}): NextResponse<ApiResponse<T>> {
  const { data = null, message = 'OK', meta = null, status = 200, headers } = options;
  return NextResponse.json(
    buildEnvelope<T>(true, message, data as T | null, null, meta),
    { status, headers },
  );
}

/**
 * 201 Created — resource successfully created.
 *
 * @example
 * return created({ data: newProduct, message: 'Product created' });
 */
export function created<T = null>(options: SuccessOptions<T> = {}): NextResponse<ApiResponse<T>> {
  const { data = null, message = 'Created', meta = null, headers } = options;
  return NextResponse.json(
    buildEnvelope<T>(true, message, data as T | null, null, meta),
    { status: 201, headers },
  );
}

/**
 * 204 No Content — success with no response body.
 * Useful for DELETE operations.
 *
 * @example
 * return noContent();
 */
export function noContent(headers?: Record<string, string>): NextResponse {
  return new NextResponse(null, { status: 204, headers });
}

/**
 * 200 OK — paginated list response with automatic meta calculation.
 *
 * @example
 * return paginated({ data: products, total: 120, page: 1, limit: 20 });
 */
export function paginated<T>(options: PaginatedOptions<T>): NextResponse<ApiResponse<T[]>> {
  const { data, total, page, limit, message = 'OK', headers } = options;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    buildEnvelope<T[]>(true, message, data, null, { page, limit, total, totalPages }),
    { status: 200, headers },
  );
}

// ─── Error Responses ─────────────────────────────────────────────────────────

/**
 * 400 Bad Request — malformed input or missing required fields.
 *
 * @example
 * return badRequest({ message: 'Invalid input', errors: ['name is required'] });
 */
export function badRequest(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Bad Request', errors, status = 400, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status, headers },
  );
}

/**
 * 401 Unauthorized — authentication required or token invalid.
 *
 * @example
 * return unauthorized();
 * return unauthorized({ message: 'Token expired' });
 */
export function unauthorized(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Unauthorized', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 401, headers },
  );
}

/**
 * 403 Forbidden — authenticated but insufficient permissions.
 *
 * @example
 * return forbidden({ message: 'Admin access required' });
 */
export function forbidden(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Forbidden', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 403, headers },
  );
}

/**
 * 404 Not Found — resource does not exist.
 *
 * @example
 * return notFound({ message: 'Product not found' });
 */
export function notFound(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Not Found', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 404, headers },
  );
}

/**
 * 405 Method Not Allowed.
 *
 * @example
 * return methodNotAllowed();
 */
export function methodNotAllowed(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Method Not Allowed', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 405, headers },
  );
}

/**
 * 409 Conflict — resource already exists or state conflict.
 *
 * @example
 * return conflict({ message: 'Email already registered' });
 */
export function conflict(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Conflict', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 409, headers },
  );
}

/**
 * 422 Unprocessable Entity — validation errors (most common for form/Zod errors).
 * Accepts Zod `.flatten()` output, string[], ApiError[], or Record<string, string[]>.
 *
 * @example
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) return unprocessable(parsed.error.flatten());
 */
export function unprocessable(
  errors: ErrorOptions['errors'],
  options: Omit<ErrorOptions, 'errors' | 'status'> = {},
): NextResponse<ApiResponse<null>> {
  const { message = 'Validation Failed', headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 422, headers },
  );
}

/**
 * 429 Too Many Requests — rate limit exceeded.
 *
 * @example
 * return tooManyRequests({ message: 'Slow down, too many requests' });
 */
export function tooManyRequests(options: ErrorOptions = {}): NextResponse<ApiResponse<null>> {
  const { message = 'Too Many Requests', errors, headers } = options;
  return NextResponse.json(
    buildEnvelope(false, message, null, normalizeErrors(errors), null),
    { status: 429, headers },
  );
}

/**
 * 500 Internal Server Error — unexpected server failures.
 * In production, hides raw error details. In development, exposes them.
 *
 * @example
 * return serverError(error);
 * return serverError(error, { message: 'Failed to send email' });
 */
export function serverError(
  error?: unknown,
  options: ErrorOptions = {},
): NextResponse<ApiResponse<null>> {
  const { message = 'Internal Server Error', headers } = options;

  const isDev = process.env.NODE_ENV === 'development';

  const errors = isDev && error
    ? normalizeErrors(error)
    : null;

  return NextResponse.json(
    buildEnvelope(false, message, null, errors, null),
    { status: 500, headers },
  );
}

// ─── Generic Builder ─────────────────────────────────────────────────────────

/**
 * Escape hatch — build any custom response with full control.
 * Useful for non-standard status codes or special flows.
 *
 * @example
 * return respond({ success: true, data: result, status: 202, message: 'Processing' });
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
  const {
    success,
    data = null,
    message = success ? 'OK' : 'Error',
    errors,
    meta = null,
    status,
    headers,
  } = options;

  return NextResponse.json(
    buildEnvelope<T>(success, message, data as T | null, normalizeErrors(errors), meta),
    { status, headers },
  );
}
