# next-response-kit

Typed, consistent API response helpers for **Next.js App Router**.

Provides a standard response envelope for API routes with minimal setup
and predictable structure across your backend.

------------------------------------------------------------------------

## Why this exists

In many Next.js projects, API responses become inconsistent across
routes and contributors:

``` ts
return NextResponse.json({ user }, { status: 200 });
return NextResponse.json({ success: true, data: user });
return NextResponse.json({ error: "Not found" }, { status: 404 });
```

This leads to fragmented client logic and repeated response handling
patterns.

This package provides a shared response format to reduce that
inconsistency.

------------------------------------------------------------------------

## Core idea

All responses follow a single envelope:

``` ts
{
  success: boolean;
  message: string;
  data: any | null;
  errors: ApiError[] | null;
  meta: Record<string, any> | null;
  timestamp: string;
}
```

------------------------------------------------------------------------

## Installation

``` bash
npm install next-response-kit
```

### Peer dependency

-   next \>= 13

------------------------------------------------------------------------

## Basic usage

``` ts
import { ok, created, badRequest, serverError } from "next-response-kit";
```

------------------------------------------------------------------------

## Example route

``` ts
export async function GET() {
  try {
    const users = await getUsers();
    return ok({ data: users });
  } catch (error) {
    return serverError(error);
  }
}
```

------------------------------------------------------------------------

## Response helpers

### ok()

``` ts
return ok({ data });
```

### created()

``` ts
return created({ data: newUser });
```

### noContent()

``` ts
return noContent();
```

------------------------------------------------------------------------

### paginated()

``` ts
return paginated({
  data: items,
  total: 100,
  page: 1,
  limit: 20
});
```

------------------------------------------------------------------------

## Error helpers

### badRequest()

``` ts
return badRequest({ message: "Invalid request" });
```

### unauthorized()

``` ts
return unauthorized();
```

### forbidden()

``` ts
return forbidden();
```

### notFound()

``` ts
return notFound();
```

### conflict()

``` ts
return conflict();
```

### unprocessable()

``` ts
return unprocessable(["Validation error"]);
```

### tooManyRequests()

``` ts
return tooManyRequests();
```

### serverError()

``` ts
return serverError(error);
```

------------------------------------------------------------------------

## Escape hatch

### respond()

``` ts
return respond({
  success: true,
  status: 202,
  message: "Queued",
  data: { jobId: "abc" }
});
```

------------------------------------------------------------------------

## Type safety

``` ts
import type {
  ApiResponse,
  ApiError,
  ResponseMeta
} from "next-response-kit";
```

------------------------------------------------------------------------

## Client usage

``` ts
const res = await fetch("/api/users");
const json: ApiResponse<User[]> = await res.json();

if (json.success) {
  console.log(json.data);
}
```

------------------------------------------------------------------------

## Limitations

-   Server-only (Next.js App Router)
-   JSON APIs only
-   Not for GraphQL or tRPC
-   No streaming helpers

------------------------------------------------------------------------

## License

MIT
