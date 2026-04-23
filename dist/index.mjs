// index.ts
import { NextResponse as _NextResponse } from "next/server";

// responses.ts
import { NextResponse } from "next/server";

// utils.ts
function buildEnvelope(success, message, data, errors, meta) {
  return {
    success,
    message,
    data,
    errors,
    meta,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function normalizeErrors(input) {
  if (!input) return [];
  if (input instanceof Error) {
    return [{ message: input.message, code: input.name }];
  }
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === "string") return { message: item };
      if (typeof item === "object" && item !== null && "message" in item) return item;
      return { message: String(item) };
    });
  }
  if (typeof input === "object" && input !== null) {
    const zodLike = input;
    if ("fieldErrors" in zodLike || "formErrors" in zodLike) {
      const result2 = [];
      if (zodLike.fieldErrors) {
        for (const [field, messages] of Object.entries(zodLike.fieldErrors)) {
          for (const message of messages != null ? messages : []) result2.push({ field, message });
        }
      }
      if (zodLike.formErrors) {
        for (const message of zodLike.formErrors) result2.push({ message });
      }
      return result2;
    }
    const record = input;
    const result = [];
    for (const [field, messages] of Object.entries(record)) {
      const list = Array.isArray(messages) ? messages : [messages];
      for (const message of list) result.push({ field, message });
    }
    return result;
  }
  return [{ message: String(input) }];
}

// responses.ts
function ok(options = {}) {
  const { data = null, message = "OK", meta = null, status = 200, headers } = options;
  return NextResponse.json(buildEnvelope(true, message, data, null, meta), { status, headers });
}
function created(options = {}) {
  const { data = null, message = "Created", meta = null, headers } = options;
  return NextResponse.json(buildEnvelope(true, message, data, null, meta), { status: 201, headers });
}
function noContent(headers) {
  return new NextResponse(null, { status: 204, headers });
}
function paginated(options) {
  const { data, total, page, limit, message = "OK", headers } = options;
  return NextResponse.json(
    buildEnvelope(true, message, data, null, { page, limit, total, totalPages: Math.ceil(total / limit) }),
    { status: 200, headers }
  );
}
function badRequest(options = {}) {
  const { message = "Bad Request", errors, status = 400, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status, headers });
}
function unauthorized(options = {}) {
  const { message = "Unauthorized", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 401, headers });
}
function forbidden(options = {}) {
  const { message = "Forbidden", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 403, headers });
}
function notFound(options = {}) {
  const { message = "Not Found", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 404, headers });
}
function methodNotAllowed(options = {}) {
  const { message = "Method Not Allowed", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 405, headers });
}
function conflict(options = {}) {
  const { message = "Conflict", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 409, headers });
}
function unprocessable(errors, options = {}) {
  const { message = "Validation Failed", headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 422, headers });
}
function tooManyRequests(options = {}) {
  const { message = "Too Many Requests", errors, headers } = options;
  return NextResponse.json(buildEnvelope(false, message, null, normalizeErrors(errors), null), { status: 429, headers });
}
function serverError(error, options = {}) {
  const { message = "Internal Server Error", headers } = options;
  const errors = process.env.NODE_ENV === "development" && error ? normalizeErrors(error) : null;
  return NextResponse.json(buildEnvelope(false, message, null, errors, null), { status: 500, headers });
}
function respond(options) {
  const { success, data = null, message = success ? "OK" : "Error", errors, meta = null, status, headers } = options;
  return NextResponse.json(
    buildEnvelope(success, message, data, normalizeErrors(errors), meta),
    { status, headers }
  );
}

// index.ts
var NextResponseKit = class extends _NextResponse {
};
// ── Typed helpers — same as named exports ────────────────────────────────
NextResponseKit.ok = ok;
NextResponseKit.created = created;
NextResponseKit.noContent = noContent;
NextResponseKit.paginated = paginated;
NextResponseKit.badRequest = badRequest;
NextResponseKit.unauthorized = unauthorized;
NextResponseKit.forbidden = forbidden;
NextResponseKit.notFound = notFound;
NextResponseKit.methodNotAllowed = methodNotAllowed;
NextResponseKit.conflict = conflict;
NextResponseKit.unprocessable = unprocessable;
NextResponseKit.tooManyRequests = tooManyRequests;
NextResponseKit.serverError = serverError;
NextResponseKit.respond = respond;
var index_default = NextResponseKit;
export {
  badRequest,
  conflict,
  created,
  index_default as default,
  forbidden,
  methodNotAllowed,
  noContent,
  notFound,
  ok,
  paginated,
  respond,
  serverError,
  tooManyRequests,
  unauthorized,
  unprocessable
};
//# sourceMappingURL=index.mjs.map