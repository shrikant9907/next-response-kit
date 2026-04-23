# next-response-kit

> A drop-in replacement for `NextResponse` — same API you already know, with a consistent response shape on every route, automatically.

[![npm version](https://img.shields.io/npm/v/next-response-kit)](https://www.npmjs.com/package/next-response-kit)
[![license](https://img.shields.io/npm/l/next-response-kit)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

---

## The problem in every Next.js project

Every developer on the team returns responses differently:

```ts
// route A — raw data
return NextResponse.json({ user }, { status: 200 });

// route B — wrapped with success
return NextResponse.json({ success: true, data: user });

// route C — plain error string
return NextResponse.json({ error: "Not found" }, { status: 404 });

// route D — forgot the status code entirely
return NextResponse.json({ message: "Something broke" });
```

The frontend ends up doing `if (res.user || res.data?.user || res.error)` in every component. It's a mess that gets worse as the team grows.

**`next-response-kit` fixes this with zero learning curve** — it works exactly like `NextResponse` but every response, success or error, always returns the same consistent shape.

---

## Install

```bash
npm install next-response-kit
```

**Peer dependency:** `next >= 13.0.0` (App Router)

---

## Two ways to use it — pick one, or mix both

### Option 1 — Drop-in replacement (zero change to your mental model)

Just replace `next/server` with `next-response-kit` in your import. Everything works exactly the same — `.json()`, `.redirect()`, `.next()`, all of it. Plus you get new typed helpers on the same object.

```ts
// Before
import { NextResponse } from 'next/server';

// After — one character change, that's it
import NextResponse from 'next-response-kit';
```

Your existing code keeps working:

```ts
// This still works exactly as before
return NextResponse.json({ user }, { status: 200 });
return NextResponse.redirect(new URL('/login', req.url));
return NextResponse.next();
```

And now you also have typed helpers:

```ts
return NextResponse.ok({ data: user });
return NextResponse.notFound({ message: 'User not found' });
return NextResponse.serverError(error);
```

---

### Option 2 — Named imports (one line, tree-shakeable)

```ts
import { ok, created, notFound, unprocessable, serverError } from 'next-response-kit';
```

That's the only import line you'll ever need. Use whichever helpers apply:

```ts
export async function GET(_req, { params }) {
  const user = await findUser(params.id);
  if (!user) return notFound({ message: 'User not found' });
  return ok({ data: user });
}
```

---

## Every response returns the same shape

No matter which helper or style you use, the response is always:

```json
{
  "success": true,
  "message": "User fetched",
  "data": { "id": "u-001", "name": "Shrikant Yadav" },
  "errors": null,
  "meta": null,
  "timestamp": "2025-04-23T10:30:00.000Z"
}
```

On error:

```json
{
  "success": false,
  "message": "Validation Failed",
  "data": null,
  "errors": [
    { "field": "email", "message": "Must be a valid email" },
    { "field": "name",  "message": "Name is required" }
  ],
  "meta": null,
  "timestamp": "2025-04-23T10:30:01.000Z"
}
```

The frontend now always reads `res.data` for success and `res.errors` for failures. One pattern. Every route. Every developer.

---

## Complete API reference

### Success helpers

| Helper | Status | When to use |
|---|---|---|
| `ok({ data, message })` | 200 | Any successful GET or action |
| `created({ data, message })` | 201 | POST that creates a new resource |
| `noContent()` | 204 | DELETE with no body |
| `paginated({ data, total, page, limit })` | 200 | Lists with pagination |
| `respond({ success, data, status })` | any | Escape hatch — full control |

### Error helpers

| Helper | Status | When to use |
|---|---|---|
| `badRequest({ message, errors })` | 400 | Malformed input, missing fields |
| `unauthorized({ message })` | 401 | Not authenticated, token invalid |
| `forbidden({ message })` | 403 | Authenticated but no permission |
| `notFound({ message })` | 404 | Resource doesn't exist |
| `methodNotAllowed()` | 405 | Wrong HTTP method |
| `conflict({ message })` | 409 | Duplicate resource, state conflict |
| `unprocessable(errors)` | 422 | Validation errors (works with Zod) |
| `tooManyRequests({ message })` | 429 | Rate limit exceeded |
| `serverError(error)` | 500 | Unexpected server failures |

---

## Real route handler examples

### Basic CRUD

```ts
// app/api/users/[id]/route.ts
import { ok, notFound, noContent, unprocessable, serverError } from 'next-response-kit';
import { db } from '@/lib/db';
import { updateUserSchema } from '@/lib/schemas';

export async function GET(_req, { params }) {
  try {
    const user = await db.user.findUnique({ where: { id: params.id } });
    if (!user) return notFound({ message: 'User not found' });
    return ok({ data: user });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
      // Automatically maps Zod errors to:
      // { errors: [{ field: 'email', message: 'Invalid email' }] }
    }

    const user = await db.user.update({ where: { id: params.id }, data: parsed.data });
    return ok({ data: user, message: 'User updated' });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_req, { params }) {
  try {
    await db.user.delete({ where: { id: params.id } });
    return noContent(); // 204 — no body
  } catch (error) {
    return serverError(error);
  }
}
```

---

### Paginated list

```ts
// app/api/products/route.ts
import { paginated, serverError } from 'next-response-kit';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get('page')  ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    const [items, total] = await Promise.all([
      db.product.findMany({ skip: (page - 1) * limit, take: limit }),
      db.product.count(),
    ]);

    return paginated({ data: items, total, page, limit });
    // meta is auto-calculated: { page, limit, total, totalPages }
  } catch (error) {
    return serverError(error);
  }
}
```

---

### Zod validation — zero extra work

```ts
// app/api/products/route.ts
import { created, unprocessable, conflict, serverError } from 'next-response-kit';
import { z } from 'zod';

const schema = z.object({
  name:  z.string().min(2),
  price: z.number().positive(),
  sku:   z.string().regex(/^[A-Z0-9-]+$/),
});

export async function POST(req) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      // Pass zod's .flatten() directly — no extra mapping needed
      return unprocessable(parsed.error.flatten());
    }

    const existing = await db.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existing) return conflict({ message: `SKU "${parsed.data.sku}" already exists` });

    const product = await db.product.create({ data: parsed.data });
    return created({ data: product, message: 'Product created' });
  } catch (error) {
    return serverError(error);
  }
}
```

---

### Using the drop-in style (migration path)

If you have an existing project and want to adopt the package gradually — just change the import. Your old code keeps working, and you start using helpers on new routes.

```ts
// Old code in the same file — still works
import NextResponse from 'next-response-kit';

export async function GET() {
  // Old style — still works, unchanged
  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req) {
  // New style on new routes — consistent shape
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.unprocessable(parsed.error.flatten());
  const product = await createProduct(parsed.data);
  return NextResponse.created({ data: product });
}
```

---

### Reading the response on the client

```ts
// lib/api.ts
import type { ApiResponse } from 'next-response-kit';

export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}

// In your component or hook:
const result = await apiGet<User>('/api/users/u-001');

if (!result.success) {
  // result.errors is ApiError[] | null
  result.errors?.forEach(err => {
    if (err.field) form.setError(err.field, { message: err.message });
  });
  return;
}

// result.data is typed as User | null
console.log(result.data?.name);
```

---

### `serverError()` — smart in dev, safe in production

No config needed. In development it exposes the error for debugging. In production it hides it automatically.

```ts
try {
  const result = await riskyDatabaseCall();
  return ok({ data: result });
} catch (error) {
  return serverError(error);
  // Development → errors: [{ message: 'Connection refused', code: 'Error' }]
  // Production  → errors: null  (never leaks stack traces)
}
```

---

### `respond()` — full control when you need it

For non-standard status codes or special flows:

```ts
return respond({
  success: true,
  data: { jobId: 'batch-xyz' },
  message: 'Job queued for processing',
  status: 202,
  headers: { 'X-Job-Id': 'batch-xyz' },
});
```

---

## TypeScript

All types are exported. Use them to type your client-side fetch calls, wrapper functions, and hooks:

```ts
import type {
  ApiResponse,   // The full response envelope
  ApiError,      // One error item { field?, message, code? }
  ResponseMeta,  // Pagination meta
  HttpStatusCode // Union of valid HTTP codes
} from 'next-response-kit';
```

---

## `unprocessable()` accepts all error formats

You never need to transform errors before passing them in:

```ts
// Zod .flatten()
unprocessable(parsed.error.flatten())

// String array
unprocessable(['Email is required', 'Password too short'])

// ApiError array
unprocessable([{ field: 'email', message: 'Invalid', code: 'EMAIL_INVALID' }])

// Record<string, string[]>
unprocessable({ email: ['Invalid format'], age: ['Must be 18+'] })
```

---

## Migration from plain `NextResponse`

| Before | After |
|---|---|
| `NextResponse.json({ data }, { status: 200 })` | `ok({ data })` or unchanged |
| `NextResponse.json({ error }, { status: 400 })` | `badRequest({ message: error })` |
| `NextResponse.json({ error }, { status: 404 })` | `notFound({ message: error })` |
| `NextResponse.json({ error }, { status: 500 })` | `serverError(caughtError)` |
| `NextResponse.json(null, { status: 204 })` | `noContent()` |

Or just swap the import to the default export and keep your existing `.json()` calls working while adopting helpers gradually.

---

## Author

Built by **Shrikant Yadav**. MIT License.

If this saved you time, ⭐ the repo.

[npm](https://www.npmjs.com/package/next-response-kit) · [GitHub](https://github.com/shrikant9907/next-response-kit) · [Issues](https://github.com/shrikant9907/next-response-kit/issues)
