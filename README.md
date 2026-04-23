# next-response-kit

> Centralized, typed API response helpers for Next.js App Router.  
> One import. Consistent shape. Zero config. Full TypeScript.

[![npm version](https://img.shields.io/npm/v/next-response-kit)](https://www.npmjs.com/package/next-response-kit)
[![license](https://img.shields.io/npm/l/next-response-kit)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](https://nextjs.org/)

---

## The Problem

Every Next.js project ends up with the same problem: every developer on the team returns API responses differently.

```ts
// Developer A
return NextResponse.json({ user }, { status: 200 });

// Developer B
return NextResponse.json({ success: true, data: user, message: 'ok' });

// Developer C
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// Developer D (during a 2am incident)
return NextResponse.json(error.message, { status: 500 });
```

The frontend ends up with `if (res.user || res.data?.user || res.error)` scattered everywhere. It's chaos.

**`next-response-kit` solves this.** One consistent response shape. Every route. Every developer. Every project.

---

## What We Solve

| Pain Point | What This Package Does |
|---|---|
| Inconsistent response shapes | Every helper returns `{ success, message, data, errors, meta, timestamp }` |
| Zod validation errors are painful to serialize | `unprocessable(parsed.error.flatten())` — done |
| Production vs development error exposure | `serverError()` hides details in production automatically |
| No typed HTTP status codes | All status codes are typed via `HttpStatusCode` |
| Paginated responses need manual meta calculation | `paginated()` calculates `totalPages` automatically |
| Raw error objects leaking to clients | `normalizeErrors()` serializes any error format safely |

---

## Competitors & Why next-response-kit is Better

| Package | Problem |
|---|---|
| `next-better-api` | Abandoned. Last release 2022. Not App Router compatible. |
| `next-rest` | Requires `io-ts`. Pages Router only. Too opinionated. |
| `next-connect` | Router, not a response helper. Different concern entirely. |
| Roll your own | Every team invents it differently. Impossible to maintain at scale. |

**`next-response-kit` is:**
- ✅ App Router native (Next.js 13+)
- ✅ Zero runtime dependencies (only `next/server` as peer)
- ✅ Dual ESM + CJS — works everywhere
- ✅ Actively maintained
- ✅ Built for teams, not demos

---

## Installation

```bash
npm install next-response-kit
# or
yarn add next-response-kit
# or
pnpm add next-response-kit
```

**Peer dependency:** `next >= 13.0.0`

---

## Quick Start

```ts
// app/api/products/route.ts
import { ok, created, unprocessable, serverError } from 'next-response-kit';
import { productSchema } from '@/features/products/productSchema';
import { createProduct } from '@/features/products/productApi';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const product = await createProduct(parsed.data);
    return created({ data: product, message: 'Product created successfully' });
  } catch (error) {
    return serverError(error);
  }
}

export async function GET() {
  try {
    const products = await getProducts();
    return ok({ data: products });
  } catch (error) {
    return serverError(error);
  }
}
```

Every response — success or failure — returns this consistent shape:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { "id": "abc", "name": "Widget" },
  "errors": null,
  "meta": null,
  "timestamp": "2025-04-23T10:30:00.000Z"
}
```

---

## Response Shape

```ts
interface ApiResponse<T = null> {
  success: boolean;           // true on success, false on error
  message: string;            // human-readable message
  data: T | null;             // response payload (null on error)
  errors: ApiError[] | null;  // error list (null on success)
  meta: ResponseMeta | null;  // pagination and extra metadata
  timestamp: string;          // ISO 8601 — when the response was built
}

interface ApiError {
  field?: string;   // field name (for validation errors)
  message: string;  // error description
  code?: string;    // optional machine-readable code
}

interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown; // extend freely
}
```

---

## API Reference

### ✅ Success Helpers

#### `ok(options?)`
**200 OK** — generic success.

```ts
// Bare response
return ok();

// With data
return ok({ data: user });

// With message and meta
return ok({ data: users, message: 'Users fetched', meta: { count: 5 } });

// Custom status
return ok({ data: result, status: 202 });
```

---

#### `created(options?)`
**201 Created** — resource successfully created.

```ts
return created({ data: newProduct, message: 'Product created' });
```

---

#### `noContent(headers?)`
**204 No Content** — success with no body. Ideal for DELETE.

```ts
return noContent();
```

---

#### `paginated(options)`
**200 OK** — list response with automatic pagination meta.

```ts
return paginated({
  data: products,   // T[]
  total: 120,       // total records in DB
  page: 2,          // current page (1-indexed)
  limit: 20,        // records per page
  message: 'Products fetched',
});
```

Response `meta`:
```json
{ "page": 2, "limit": 20, "total": 120, "totalPages": 6 }
```

---

### ❌ Error Helpers

#### `badRequest(options?)`
**400** — malformed input or missing required fields.

```ts
return badRequest({ message: 'Missing required fields' });
return badRequest({ errors: ['name is required', 'price must be positive'] });
```

---

#### `unauthorized(options?)`
**401** — not authenticated or token invalid/expired.

```ts
return unauthorized();
return unauthorized({ message: 'Token expired. Please sign in again.' });
```

---

#### `forbidden(options?)`
**403** — authenticated but insufficient permissions.

```ts
return forbidden({ message: 'Admin access required' });
```

---

#### `notFound(options?)`
**404** — resource does not exist.

```ts
return notFound({ message: 'Product not found' });
```

---

#### `methodNotAllowed(options?)`
**405** — HTTP method not supported.

```ts
return methodNotAllowed();
```

---

#### `conflict(options?)`
**409** — resource already exists or state conflict.

```ts
return conflict({ message: 'A user with this email already exists' });
```

---

#### `unprocessable(errors, options?)`
**422** — validation errors. Accepts Zod, string arrays, or custom error maps.

```ts
// With Zod
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return unprocessable(parsed.error.flatten());
}

// With string[]
return unprocessable(['email is invalid', 'name is required']);

// With Record<string, string[]>
return unprocessable({
  email: ['Must be a valid email'],
  age: ['Must be at least 18'],
});

// With ApiError[]
return unprocessable([
  { field: 'sku', message: 'SKU already taken', code: 'SKU_CONFLICT' }
]);
```

---

#### `tooManyRequests(options?)`
**429** — rate limit exceeded.

```ts
return tooManyRequests({ message: 'Too many requests. Try again in 60 seconds.' });
```

---

#### `serverError(error?, options?)`
**500** — unexpected server failures.

- In **production**: hides error details. Returns only the message.  
- In **development**: exposes the full error object in `errors[]`.

```ts
try {
  const result = await riskyOperation();
  return ok({ data: result });
} catch (error) {
  return serverError(error, { message: 'Failed to process order' });
}
```

---

#### `respond(options)` — Escape Hatch
Build any custom response with full control over status, shape, and headers.

```ts
return respond({
  success: true,
  data: { jobId: 'xyz-123' },
  message: 'Job queued for processing',
  status: 202,
  headers: { 'X-Job-Id': 'xyz-123' },
});
```

---

## Real-World Usage Patterns

### Pattern 1 — CRUD Route Handler

```ts
// app/api/users/[id]/route.ts
import { ok, notFound, unprocessable, serverError, noContent } from 'next-response-kit';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await findUser(params.id);
    if (!user) return notFound({ message: 'User not found' });
    return ok({ data: user });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return unprocessable(parsed.error.flatten());

    const user = await updateUser(params.id, parsed.data);
    if (!user) return notFound({ message: 'User not found' });
    return ok({ data: user, message: 'User updated' });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteUser(params.id);
    return noContent();
  } catch (error) {
    return serverError(error);
  }
}
```

---

### Pattern 2 — Paginated List

```ts
// app/api/products/route.ts
import { paginated, serverError } from 'next-response-kit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    const { items, total } = await getProducts({ page, limit });

    return paginated({ data: items, total, page, limit });
  } catch (error) {
    return serverError(error);
  }
}
```

---

### Pattern 3 — Using Types on the Client (React Query)

```ts
// features/products/productApi.ts
import type { ApiResponse } from 'next-response-kit';

interface Product { id: string; name: string; price: number; }

export async function fetchProduct(id: string): Promise<ApiResponse<Product>> {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

// In your component / hook:
const { data } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchProduct(id),
});

// data.data is typed as Product | null — no guessing
console.log(data?.data?.name);
```

---

### Pattern 4 — Typed Error Handling on the Client

```ts
import type { ApiResponse, ApiError } from 'next-response-kit';

async function submitForm(values: FormValues) {
  const res = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(values),
  });

  const json: ApiResponse = await res.json();

  if (!json.success) {
    // json.errors is typed as ApiError[] | null
    json.errors?.forEach((err: ApiError) => {
      if (err.field) {
        form.setError(err.field, { message: err.message });
      }
    });
    return;
  }

  router.push('/products');
}
```

---

### Pattern 5 — Custom Headers (CORS, Rate Limit Info)

```ts
return ok({
  data: result,
  headers: {
    'X-RateLimit-Remaining': '42',
    'Cache-Control': 'no-store',
  },
});
```

---

## TypeScript Types Reference

All types are exported and available for use in your own wrappers and clients.

```ts
import type {
  ApiResponse,      // The full response envelope
  ApiError,         // Individual error item
  ResponseMeta,     // Pagination / extra metadata
  HttpStatusCode,   // Union of valid HTTP status codes
  SuccessOptions,   // Options for ok(), created()
  ErrorOptions,     // Options for badRequest(), notFound() etc.
  PaginatedOptions, // Options for paginated()
  ZodFlattenedError // Shape expected from zod's .flatten()
} from 'next-response-kit';
```

---

## Building Your Own `withAuth` Wrapper

```ts
// lib/withAuth.ts
import type { NextRequest } from 'next/server';
import { unauthorized } from 'next-response-kit';
import { verifyToken } from './auth';

type RouteHandler = (req: NextRequest, context: any) => Promise<Response>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const token = req.cookies.get('auth-token')?.value;
    const user = token ? await verifyToken(token) : null;

    if (!user) return unauthorized({ message: 'Please sign in to continue' });

    return handler(req, context);
  };
}

// Usage in route.ts
export const GET = withAuth(async (req) => {
  const data = await getProtectedData();
  return ok({ data });
});
```

---

## Project Structure Recommendation

```
/lib
  apiClient.ts          ← Axios / fetch instance
/app
  /api
    /products
      route.ts          ← import from next-response-kit here
    /users
      route.ts
```

Keep all `next-response-kit` imports at the route handler layer only. Business logic and data access layers should never know about HTTP response shapes.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a branch: `feat/your-feature`
3. Run tests: `npm test`
4. Submit a PR

---

## Author

Built by **Shrikant Yadav**.

If this saved you time, star the repo ⭐

---

## License

[MIT](./LICENSE) © 2025 Shrikant Yadav
#   n e x t - r e s p o n s e - k i t  
 