# @authstack/backend-sdk

TypeScript SDK for the [Authstack](https://github.com/authstack-org/authstack) backend API.

## Install

```bash
npm install @authstack/backend-sdk
```

## Quick start

```ts
import { createAuthstackClient } from "@authstack/backend-sdk";

const client = createAuthstackClient({
  baseUrl: "http://localhost:8080",
  appId: process.env.AUTHSTACK_APP_ID,
  appSecret: process.env.AUTHSTACK_APP_SECRET,
});

const { data, error } = await client.api.auth.signup({
  body: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "secure-password",
  },
});

if (error) {
  throw error;
}

console.log(data);
```

### Organization invites

```ts
const { data: invite } = await client.api.invites.create({
  path: { org_id: "org_..." },
  body: {
    email: "colleague@example.com",
    role: "member",
  },
});

// Share invite.invite_url with the user
```

## Authentication

The SDK supports the Authstack security schemes exposed by the OpenAPI contract:

- **Application basic auth** (`appBasicAuth`) via `appId` + `appSecret`
- **Bearer JWT** (`bearerAuth`) via `accessToken`
- **Admin session cookie** (`adminCookie`) via `adminCookie` — value of the `admin_token` cookie after logging in at `/admin/login`

```ts
const client = createAuthstackClient({
  baseUrl: "https://api.example.com",
  accessToken: "eyJ...",
});

// Update credentials later
client.setAccessToken("eyJ...");
client.setAppCredentials("app-id", "app-secret");
client.setAdminCookie("admin_token_value");
```

## Regenerating the SDK

When the backend API changes, regenerate the client from the backend OpenAPI spec:

```bash
pnpm install
pnpm --filter @authstack/backend-sdk run generate
```

This runs `cargo run -- openapi` in the `authstack` repo and regenerates the TypeScript client.

## Development

```bash
pnpm install
pnpm --filter @authstack/backend-sdk run generate
pnpm --filter @authstack/backend-sdk run typecheck
pnpm --filter @authstack/backend-sdk run test
pnpm --filter @authstack/backend-sdk run build
```

## License

MIT
