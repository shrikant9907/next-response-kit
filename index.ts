/**
 * next-response-kit
 *
 * Centralized, typed API response helpers for Next.js App Router.
 * Zero config. Zero dependencies beyond next/server.
 *
 * @author Shrikant Yadav
 * @license MIT
 */

// Response builders
export {
  ok,
  created,
  noContent,
  paginated,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  conflict,
  unprocessable,
  tooManyRequests,
  serverError,
  respond,
} from './responses';

// Types — so consumers can type their own wrappers
export type {
  ApiResponse,
  ApiError,
  ResponseMeta,
  HttpStatusCode,
  SuccessOptions,
  ErrorOptions,
  PaginatedOptions,
  ZodFlattenedError,
} from './types';
