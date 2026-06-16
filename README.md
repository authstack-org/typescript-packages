# TypeScript Packages

Monorepo for Authstack TypeScript packages published under the `@authstack` npm scope.

## Packages

| Package | Description |
| --- | --- |
| [`@authstack/backend-sdk`](./packages/backend-sdk) | TypeScript SDK for the Authstack backend API |

## Getting started

```bash
pnpm install
pnpm generate
pnpm build
```

## Regenerating SDKs after backend API changes

The backend OpenAPI spec is the source of truth. Regenerate SDK clients with:

```bash
pnpm generate
```

By default, generation runs `cargo run -- openapi` in a sibling `authstack` checkout at `../../authstack`. Override the backend path with:

```bash
AUTHSTACK_ROOT=/path/to/authstack pnpm generate
```

CI fails if generated output is stale relative to the backend OpenAPI contract.

## Publishing

Publishing is automated via GitHub Actions when a release tag is created. See `.github/workflows/publish.yml`.
