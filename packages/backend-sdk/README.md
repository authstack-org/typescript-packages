# @authstack/backend-sdk

TypeScript SDK for the [Authstack](https://github.com/authstack-org/authstack) HTTP API.

## Install

```bash
npm install @authstack/backend-sdk
```

## Quick start

Create a client with your application credentials (from the Authstack admin panel):

```ts
import { createAuthstackClient } from "@authstack/backend-sdk";

const authstack = createAuthstackClient({
  baseUrl: process.env.AUTHSTACK_URL!,
  appId: process.env.AUTHSTACK_APP_ID!,
  appSecret: process.env.AUTHSTACK_APP_SECRET!,
});

const user = await authstack.signUp.email({
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "secure-password",
});
```

Ergonomic methods throw `AuthstackApiError` on failure by default. Pass `throwOnError: false` on the client or per request to receive `{ data, error }` instead.

## Authentication model

Authstack is a **remote auth service**. Your application is responsible for storing tokens in cookies or your own session store — the SDK helps you **call the API** and **attach credentials** to requests.

| Credential | Used for |
| --- | --- |
| `appId` + `appSecret` | Server-side app calls (signup, org management, invites) |
| `accessToken` | User-scoped bearer calls (`/me`, `switchOrg`) |
| `adminCookie` | Platform operator admin API (optional) |

### Sign in and session helpers

```ts
// Tokens are stored on the client for subsequent bearer calls (autoUseSession: true by default)
const tokens = await authstack.signIn.email({
  email: "ada@example.com",
  password: "secure-password",
});

// Or restore a session you stored in your own cookie/session store
authstack.useSession({
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  tokenType: "Bearer",
});

const orgs = await authstack.me.organizations();

// Rotate tokens
const refreshed = await authstack.session.refresh({
  refreshToken: authstack.getSession()!.refreshToken,
});

// Revoke refresh token on sign-out
await authstack.signOut({ refreshToken: authstack.getSession()!.refreshToken });
authstack.clearSession();
```

In a typical web app you would persist `getSession()` to an **httpOnly cookie** in your own backend route, then call `useSession()` on the next request. A dedicated session/cookie helper package may be added later.

### Switch auth mode

```ts
authstack.asApp(); // basic auth only (clears bearer token)
authstack.asUser(accessToken); // bearer token for user calls
```

## Organizations

Org-scoped resources are grouped under `organization`:

```ts
const org = await authstack.organization.create({
  name: "Acme Corp",
  slug: "acme",
});

await authstack.permissions.create({
  key: "org:invite",
  name: "Invite members",
});

const roles = await authstack.organization.roles.list(org.id);

await authstack.organization.invites.create(org.id, {
  email: "colleague@example.com",
  roleSlug: "member",
});

await authstack.organization.members.add(org.id, {
  userId: "usr_...",
  roleSlug: "member",
});
```

## App permissions

```ts
const permissions = await authstack.permissions.list();

await authstack.permissions.create({
  key: "invoice:write",
  name: "Write invoices",
});
```

## Low-level API

The `api` namespace exposes the generated OpenAPI client. Use it when you need the raw `{ path, body }` shape or `{ data, error }` responses:

```ts
const { data, error } = await authstack.api.auth.login({
  body: { email, password },
});
```

## Errors

```ts
import { AuthstackApiError, isAuthstackApiError } from "@authstack/backend-sdk";

try {
  await authstack.signIn.email({ email, password });
} catch (error) {
  if (isAuthstackApiError(error)) {
    console.error(error.status, error.message);
  }
}
```

## Documentation

- Package README in the [`typescript-packages`](https://github.com/authstack-org/typescript-packages) repo
- [TypeScript SDK guide](/docs/typescript-sdk) on the Authstack docs site (session pattern, API surface, errors)
- [REST API reference](/docs/api)

## Regenerating the SDK

When the backend API changes:

```bash
pnpm install
pnpm --filter @authstack/backend-sdk run generate
```

## Development

```bash
pnpm install
pnpm --filter @authstack/backend-sdk run typecheck
pnpm --filter @authstack/backend-sdk run test
pnpm --filter @authstack/backend-sdk run build
```

## License

MIT
