/**
 * next-response-kit — test suite
 *
 * Tests for all response builders and error normalizers.
 * Each test verifies: HTTP status, response shape, data, errors, meta, timestamp.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeErrors } from '../src/utils';

// ─── Mock next/server ────────────────────────────────────────────────────────
// next/server is a peer dep; we mock NextResponse for the test environment.

vi.mock('next/server', () => {
  class MockNextResponse {
    public body: unknown;
    public status: number;
    public headers: Record<string, string>;

    constructor(body: BodyInit | null, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = {};
    }

    static json(data: unknown, init?: ResponseInit) {
      const res = new MockNextResponse(JSON.stringify(data), init);
      (res as any)._data = data;
      return res;
    }

    async json() {
      return (this as any)._data;
    }
  }

  return { NextResponse: MockNextResponse };
});

// Import AFTER mock is set up
const {
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
} = await import('../src/responses');

// ─── Helper ──────────────────────────────────────────────────────────────────

async function json(res: any) {
  return res.json();
}

// ─── Success Responses ───────────────────────────────────────────────────────

describe('ok()', () => {
  it('returns status 200 with default message', async () => {
    const res = ok();
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.message).toBe('OK');
    expect(body.data).toBeNull();
    expect(body.errors).toBeNull();
    expect(body.meta).toBeNull();
    expect(body.timestamp).toBeTruthy();
  });

  it('returns data and custom message', async () => {
    const res = ok({ data: { id: 1, name: 'Test' }, message: 'User fetched' });
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1, name: 'Test' });
    expect(body.message).toBe('User fetched');
  });

  it('returns meta when provided', async () => {
    const res = ok({ data: [], meta: { page: 1, total: 0 } });
    const body = await json(res);
    expect(body.meta).toEqual({ page: 1, total: 0 });
  });

  it('respects custom status code', async () => {
    const res = ok({ status: 202 });
    expect(res.status).toBe(202);
  });
});

describe('created()', () => {
  it('returns status 201', async () => {
    const res = created({ data: { id: 42 } });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 42 });
    expect(body.message).toBe('Created');
  });
});

describe('noContent()', () => {
  it('returns status 204 with null body', () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });
});

describe('paginated()', () => {
  it('returns correct meta with totalPages calculated', async () => {
    const res = paginated({ data: [1, 2, 3], total: 60, page: 2, limit: 20 });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([1, 2, 3]);
    expect(body.meta).toEqual({ page: 2, limit: 20, total: 60, totalPages: 3 });
  });

  it('calculates totalPages correctly with partial last page', async () => {
    const res = paginated({ data: [], total: 21, page: 1, limit: 10 });
    const body = await json(res);
    expect(body.meta?.totalPages).toBe(3);
  });
});

// ─── Error Responses ─────────────────────────────────────────────────────────

describe('badRequest()', () => {
  it('returns 400 with default message', async () => {
    const res = badRequest();
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Bad Request');
  });

  it('serializes string[] errors', async () => {
    const res = badRequest({ errors: ['name is required', 'email is invalid'] });
    const body = await json(res);
    expect(body.errors).toEqual([
      { message: 'name is required' },
      { message: 'email is invalid' },
    ]);
  });
});

describe('unauthorized()', () => {
  it('returns 401', async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Unauthorized');
  });
});

describe('forbidden()', () => {
  it('returns 403', async () => {
    const res = forbidden({ message: 'Admin only' });
    expect(res.status).toBe(403);
    const body = await json(res);
    expect(body.message).toBe('Admin only');
  });
});

describe('notFound()', () => {
  it('returns 404', async () => {
    const res = notFound({ message: 'User not found' });
    expect(res.status).toBe(404);
    const body = await json(res);
    expect(body.message).toBe('User not found');
    expect(body.success).toBe(false);
  });
});

describe('methodNotAllowed()', () => {
  it('returns 405', async () => {
    const res = methodNotAllowed();
    expect(res.status).toBe(405);
  });
});

describe('conflict()', () => {
  it('returns 409', async () => {
    const res = conflict({ message: 'Email already exists' });
    expect(res.status).toBe(409);
    const body = await json(res);
    expect(body.message).toBe('Email already exists');
  });
});

describe('unprocessable()', () => {
  it('returns 422 with Zod flattened errors', async () => {
    const zodErrors = {
      fieldErrors: {
        email: ['Invalid email format'],
        name: ['Name is too short', 'Name is required'],
      },
      formErrors: ['Form submission failed'],
    };

    const res = unprocessable(zodErrors);
    expect(res.status).toBe(422);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        { field: 'email', message: 'Invalid email format' },
        { field: 'name', message: 'Name is too short' },
        { field: 'name', message: 'Name is required' },
        { message: 'Form submission failed' },
      ]),
    );
  });

  it('returns 422 with Record<string, string[]>', async () => {
    const res = unprocessable({ price: ['Must be positive'], sku: ['Required'] });
    const body = await json(res);
    expect(body.errors).toEqual(
      expect.arrayContaining([
        { field: 'price', message: 'Must be positive' },
        { field: 'sku', message: 'Required' },
      ]),
    );
  });
});

describe('tooManyRequests()', () => {
  it('returns 429', async () => {
    const res = tooManyRequests({ message: 'Slow down' });
    expect(res.status).toBe(429);
    const body = await json(res);
    expect(body.message).toBe('Slow down');
  });
});

describe('serverError()', () => {
  it('returns 500 with no error detail in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    const res = serverError(new Error('DB connection failed'));
    expect(res.status).toBe(500);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.errors).toBeNull();

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('exposes error detail in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    const res = serverError(new Error('DB connection failed'));
    const body = await json(res);
    expect(body.errors).toEqual([
      { message: 'DB connection failed', code: 'Error' },
    ]);

    (process.env as any).NODE_ENV = originalEnv;
  });
});

describe('respond()', () => {
  it('builds fully custom response', async () => {
    const res = respond({ success: true, data: { jobId: 'abc' }, status: 202, message: 'Processing' });
    expect(res.status).toBe(202);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ jobId: 'abc' });
    expect(body.message).toBe('Processing');
  });
});

// ─── normalizeErrors() ───────────────────────────────────────────────────────

describe('normalizeErrors()', () => {
  it('returns [] for null/undefined', () => {
    expect(normalizeErrors(null)).toEqual([]);
    expect(normalizeErrors(undefined)).toEqual([]);
  });

  it('converts string[] to ApiError[]', () => {
    expect(normalizeErrors(['Bad input', 'Missing field'])).toEqual([
      { message: 'Bad input' },
      { message: 'Missing field' },
    ]);
  });

  it('passes through ApiError[] unchanged', () => {
    const input = [{ field: 'email', message: 'Invalid', code: 'EMAIL_INVALID' }];
    expect(normalizeErrors(input)).toEqual(input);
  });

  it('converts native Error', () => {
    const err = new TypeError('Value is not a number');
    expect(normalizeErrors(err)).toEqual([{ message: 'Value is not a number', code: 'TypeError' }]);
  });

  it('converts Record<string, string[]>', () => {
    expect(normalizeErrors({ name: ['Required'], age: ['Must be positive'] })).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'Required' },
        { field: 'age', message: 'Must be positive' },
      ]),
    );
  });

  it('converts Zod flattened error format', () => {
    const input = {
      fieldErrors: { email: ['Invalid email'] },
      formErrors: ['Something went wrong'],
    };
    expect(normalizeErrors(input)).toEqual(
      expect.arrayContaining([
        { field: 'email', message: 'Invalid email' },
        { message: 'Something went wrong' },
      ]),
    );
  });
});
