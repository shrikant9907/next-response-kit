/**
 * next-response-kit — test suite
 * Tests every helper + both import styles.
 */

import { describe, it, expect, vi } from 'vitest';
import { normalizeErrors } from './utils';

// ─── Mock next/server ─────────────────────────────────────────────────────────

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

    static redirect(url: string, status?: number) {
      return new MockNextResponse(null, { status: status ?? 302 });
    }

    static next() {
      return new MockNextResponse(null, { status: 200 });
    }

    async json() {
      return (this as any)._data;
    }
  }

  return { NextResponse: MockNextResponse };
});

// ─── Import AFTER mock ────────────────────────────────────────────────────────

const {
  ok, created, noContent, paginated,
  badRequest, unauthorized, forbidden, notFound,
  methodNotAllowed, conflict, unprocessable,
  tooManyRequests, serverError, respond,
} = await import('./responses');

const { default: NextResponse } = await import('./index');

async function json(res: any) { return res.json(); }

// ─── Drop-in: NextResponse.json() ────────────────────────────────────────────

describe('NextResponse (default export) — drop-in compatibility', () => {
  it('NextResponse.json() works exactly as before', async () => {
    const res = NextResponse.json({ user: { id: 1 } }, { status: 200 });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body).toEqual({ user: { id: 1 } });
  });

  it('NextResponse.ok() works as typed helper', async () => {
    const res = NextResponse.ok({ data: { id: 1 }, message: 'Got it' });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 1 });
  });

  it('NextResponse.notFound() works as typed helper', async () => {
    const res = NextResponse.notFound({ message: 'User not found' });
    expect(res.status).toBe(404);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.message).toBe('User not found');
  });

  it('NextResponse.serverError() works as typed helper', async () => {
    const res = NextResponse.serverError(new Error('DB down'));
    expect(res.status).toBe(500);
  });
});

// ─── Named exports ────────────────────────────────────────────────────────────

describe('ok()', () => {
  it('returns 200 with default message', async () => {
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
    const res = ok({ data: { id: 1 }, message: 'Fetched' });
    const body = await json(res);
    expect(body.data).toEqual({ id: 1 });
    expect(body.message).toBe('Fetched');
  });

  it('respects custom status', async () => {
    expect(ok({ status: 202 }).status).toBe(202);
  });
});

describe('created()', () => {
  it('returns 201', async () => {
    const res = created({ data: { id: 42 } });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: 42 });
  });
});

describe('noContent()', () => {
  it('returns 204 with null body', () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });
});

describe('paginated()', () => {
  it('calculates totalPages and returns meta', async () => {
    const res = paginated({ data: [1, 2], total: 60, page: 2, limit: 20 });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.meta).toEqual({ page: 2, limit: 20, total: 60, totalPages: 3 });
  });

  it('handles partial last page correctly', async () => {
    const res = paginated({ data: [], total: 21, page: 1, limit: 10 });
    expect((await json(res)).meta?.totalPages).toBe(3);
  });
});

describe('badRequest()', () => {
  it('returns 400', async () => {
    const res = badRequest({ errors: ['name required'] });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.success).toBe(false);
    expect(body.errors).toEqual([{ message: 'name required' }]);
  });
});

describe('unauthorized()', () => {
  it('returns 401', async () => {
    expect(unauthorized().status).toBe(401);
  });
});

describe('forbidden()', () => {
  it('returns 403', async () => {
    const res = forbidden({ message: 'Admins only' });
    expect(res.status).toBe(403);
    expect((await json(res)).message).toBe('Admins only');
  });
});

describe('notFound()', () => {
  it('returns 404', async () => {
    const res = notFound({ message: 'Not found' });
    expect(res.status).toBe(404);
    expect((await json(res)).success).toBe(false);
  });
});

describe('methodNotAllowed()', () => {
  it('returns 405', () => {
    expect(methodNotAllowed().status).toBe(405);
  });
});

describe('conflict()', () => {
  it('returns 409', async () => {
    const res = conflict({ message: 'Already exists' });
    expect(res.status).toBe(409);
  });
});

describe('unprocessable()', () => {
  it('handles Zod flattened errors', async () => {
    const zodErrors = {
      fieldErrors: { email: ['Invalid email'], name: ['Too short'] },
      formErrors: ['Form failed'],
    };
    const res = unprocessable(zodErrors);
    expect(res.status).toBe(422);
    const body = await json(res);
    expect(body.errors).toEqual(expect.arrayContaining([
      { field: 'email', message: 'Invalid email' },
      { field: 'name', message: 'Too short' },
      { message: 'Form failed' },
    ]));
  });

  it('handles Record<string, string[]>', async () => {
    const res = unprocessable({ price: ['Must be positive'], sku: ['Required'] });
    const body = await json(res);
    expect(body.errors).toEqual(expect.arrayContaining([
      { field: 'price', message: 'Must be positive' },
      { field: 'sku', message: 'Required' },
    ]));
  });
});

describe('tooManyRequests()', () => {
  it('returns 429', () => {
    expect(tooManyRequests().status).toBe(429);
  });
});

describe('serverError()', () => {
  it('hides error in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    const res = serverError(new Error('DB down'));
    expect(res.status).toBe(500);
    expect((await json(res)).errors).toBeNull();
    (process.env as any).NODE_ENV = 'test';
  });

  it('exposes error in development', async () => {
    (process.env as any).NODE_ENV = 'development';
    const res = serverError(new Error('DB down'));
    expect((await json(res)).errors).toEqual([{ message: 'DB down', code: 'Error' }]);
    (process.env as any).NODE_ENV = 'test';
  });
});

describe('respond()', () => {
  it('builds custom response with full control', async () => {
    const res = respond({ success: true, data: { jobId: 'x' }, status: 202, message: 'Queued' });
    expect(res.status).toBe(202);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ jobId: 'x' });
  });
});

// ─── normalizeErrors() ────────────────────────────────────────────────────────

describe('normalizeErrors()', () => {
  it('returns [] for null/undefined', () => {
    expect(normalizeErrors(null)).toEqual([]);
    expect(normalizeErrors(undefined)).toEqual([]);
  });

  it('converts string[] to ApiError[]', () => {
    expect(normalizeErrors(['Bad input'])).toEqual([{ message: 'Bad input' }]);
  });

  it('passes through ApiError[]', () => {
    const input = [{ field: 'email', message: 'Invalid', code: 'EMAIL_INVALID' }];
    expect(normalizeErrors(input)).toEqual(input);
  });

  it('converts native Error', () => {
    expect(normalizeErrors(new TypeError('Not a number'))).toEqual([
      { message: 'Not a number', code: 'TypeError' },
    ]);
  });

  it('converts Record<string, string[]>', () => {
    expect(normalizeErrors({ name: ['Required'], age: ['Positive'] })).toEqual(
      expect.arrayContaining([
        { field: 'name', message: 'Required' },
        { field: 'age', message: 'Positive' },
      ]),
    );
  });

  it('converts Zod flattened format', () => {
    expect(normalizeErrors({ fieldErrors: { email: ['Invalid'] }, formErrors: ['Failed'] })).toEqual(
      expect.arrayContaining([
        { field: 'email', message: 'Invalid' },
        { message: 'Failed' },
      ]),
    );
  });
});
