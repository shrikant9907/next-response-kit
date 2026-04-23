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

import { NextResponse as _NextResponse } from 'next/server';
import {
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
import { buildEnvelope } from './utils';
import type { ApiResponse, ErrorOptions, HttpStatusCode } from './types';

// ─── NextResponse drop-in ─────────────────────────────────────────────────────
//
// We extend the real NextResponse class so:
//   - NextResponse.json() still works exactly as before (zero breaking change)
//   - NextResponse.redirect(), NextResponse.rewrite(), NextResponse.next() all work
//   - We add typed helpers directly on the class: .ok(), .notFound(), etc.
//

class NextResponseKit extends _NextResponse {
  // ── Typed helpers — same as named exports ────────────────────────────────

  static ok    = ok;
  static created      = created;
  static noContent    = noContent;
  static paginated    = paginated;
  static badRequest   = badRequest;
  static unauthorized = unauthorized;
  static forbidden    = forbidden;
  static notFound     = notFound;
  static methodNotAllowed = methodNotAllowed;
  static conflict     = conflict;
  static unprocessable = unprocessable;
  static tooManyRequests = tooManyRequests;
  static serverError  = serverError;
  static respond      = respond;
}

// ─── Default export — the drop-in NextResponse replacement ────────────────────
export default NextResponseKit;

// ─── Named exports — for developers who prefer explicit imports ───────────────
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
};

// ─── Type exports ─────────────────────────────────────────────────────────────
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
