import { describe, expect, it } from "vitest";

import {
  createAuthResolver,
  encodeBasicAuth,
  formatBasicAuthCredentials,
} from "../src/auth.js";
import { createAuthstackClient } from "../src/client.js";
import { AuthstackApiError } from "../src/errors.js";

function getRequestHeader(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  name: string,
): string | null {
  if (input instanceof Request) {
    return input.headers.get(name);
  }

  return new Headers(init?.headers).get(name);
}

describe("encodeBasicAuth", () => {
  it("returns the base64-encoded app_id:client_secret pair", () => {
    expect(encodeBasicAuth("app-id", "app-secret")).toBe("YXBwLWlkOmFwcC1zZWNyZXQ=");
  });
});

describe("formatBasicAuthCredentials", () => {
  it("returns the raw username:password pair for hey-api basic auth", () => {
    expect(formatBasicAuthCredentials("app-id", "app-secret")).toBe("app-id:app-secret");
  });
});

describe("createAuthResolver", () => {
  it("returns raw credentials for app basic auth", () => {
    const auth = createAuthResolver({
      appId: "app-id",
      appSecret: "app-secret",
    });

    expect(
      auth({
        type: "http",
        scheme: "basic",
      }),
    ).toBe("app-id:app-secret");
  });

  it("returns bearer token for bearer auth", () => {
    const auth = createAuthResolver({
      accessToken: "jwt-token",
    });

    expect(
      auth({
        type: "http",
        scheme: "bearer",
      }),
    ).toBe("jwt-token");
  });

  it("returns admin session cookie for admin cookie auth", () => {
    const auth = createAuthResolver({
      adminCookie: "secret-admin-token",
    });

    expect(
      auth({
        type: "apiKey",
        name: "admin_token",
        in: "cookie",
      }),
    ).toBe("secret-admin-token");
  });
});

describe("request auth headers", () => {
  it("sends Authorization: Basic base64(app_id:client_secret) for sign-in", async () => {
    let authorization: string | null = null;

    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      appId: "app-id",
      appSecret: "app-secret",
      fetch: async (input, init) => {
        authorization = getRequestHeader(input, init, "Authorization");
        return new Response(
          JSON.stringify({
            access_token: "access",
            refresh_token: "refresh",
            token_type: "Bearer",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    });

    await client.signIn.email({
      email: "ada@example.com",
      password: "secret",
    });

    expect(authorization).toBe(`Basic ${encodeBasicAuth("app-id", "app-secret")}`);
  });

  it("sends Authorization: Bearer <token> for bearer-protected endpoints", async () => {
    let authorization: string | null = null;

    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      accessToken: "jwt-token",
      fetch: async (input, init) => {
        authorization = getRequestHeader(input, init, "Authorization");
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await client.session.switchOrg({ orgId: "org_123" });

    expect(authorization).toBe("Bearer jwt-token");
  });

  it("sends admin_token cookie for admin protected endpoints", async () => {
    let cookie: string | null = null;

    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      adminCookie: "secret-admin-token",
      fetch: async (input, init) => {
        cookie = getRequestHeader(input, init, "Cookie");
        return new Response(
          JSON.stringify({
            id: "app_123",
            name: "My App",
            client_secret: "secret",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    });

    await client.api.admin.createApplication({
      body: {
        name: "My App",
      },
    });

    expect(cookie).toBe("admin_token=secret-admin-token");
  });
});

describe("createAuthstackClient", () => {
  it("exposes ergonomic and low-level API namespaces", () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      appId: "app-id",
      appSecret: "app-secret",
    });

    expect(client.signUp.email).toBeTypeOf("function");
    expect(client.organization.list).toBeTypeOf("function");
    expect(client.organization.roles.list).toBeTypeOf("function");
    expect(client.permissions.list).toBeTypeOf("function");
    expect(client.api.auth.signup).toBeTypeOf("function");
    expect(client.jwks).toBeTypeOf("function");
  });

  it("stores session after sign-in when autoUseSession is enabled", async () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      appId: "app-id",
      appSecret: "app-secret",
      fetch: async () =>
        new Response(
          JSON.stringify({
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "Bearer",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    });

    await client.signIn.email({
      email: "ada@example.com",
      password: "secret",
    });

    expect(client.getSession()?.accessToken).toBe("access-token");
    expect(client.getSession()?.refreshToken).toBe("refresh-token");
  });

  it("throws AuthstackApiError by default on ergonomic calls", async () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      appId: "app-id",
      appSecret: "app-secret",
      fetch: async () =>
        new Response(JSON.stringify({ error: "invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    });

    await expect(
      client.signIn.email({ email: "ada@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AuthstackApiError);
  });

  it("returns { data, error } when throwOnError is false", async () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      throwOnError: false,
      appId: "app-id",
      appSecret: "app-secret",
      fetch: async () =>
        new Response(JSON.stringify({ error: "invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    });

    const result = await client.signIn.email(
      { email: "ada@example.com", password: "wrong" },
      { throwOnError: false },
    );

    expect(result).toHaveProperty("error");
    if ("error" in result && result.error) {
      expect(result.error).toBeInstanceOf(AuthstackApiError);
    }
  });

  it("updates credentials via setters", () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
    });

    client.setAppCredentials("app-id", "app-secret");
    client.setAccessToken("access-token");
    client.setAdminCookie("admin-token");

    const auth = client.getConfig().auth;
    expect(typeof auth).toBe("function");

    if (typeof auth !== "function") {
      throw new Error("expected auth resolver");
    }

    expect(
      auth({
        type: "http",
        scheme: "basic",
      }),
    ).toBe("app-id:app-secret");

    expect(
      auth({
        type: "http",
        scheme: "bearer",
      }),
    ).toBe("access-token");

    expect(
      auth({
        type: "apiKey",
        name: "admin_token",
        in: "cookie",
      }),
    ).toBe("admin-token");
  });

  it("clears bearer auth with asApp()", () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      accessToken: "jwt-token",
    });

    client.asApp();

    const auth = client.getConfig().auth;
    if (typeof auth !== "function") {
      throw new Error("expected auth resolver");
    }

    expect(
      auth({
        type: "http",
        scheme: "bearer",
      }),
    ).toBeUndefined();
  });
});

describe("AuthstackApiError", () => {
  it("builds an error from a failed response", () => {
    const response = new Response(null, {
      status: 400,
      statusText: "Bad Request",
    });
    Object.defineProperty(response, "url", {
      value: "http://localhost:8080/auth/login",
    });

    const error = AuthstackApiError.fromResponse(response, { error: "invalid credentials" });

    expect(error).toBeInstanceOf(AuthstackApiError);
    expect(error.message).toBe("invalid credentials");
    expect(error.status).toBe(400);
    expect(error.url).toBe("http://localhost:8080/auth/login");
  });
});
