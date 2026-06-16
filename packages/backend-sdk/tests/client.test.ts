import { describe, expect, it } from "vitest";

import { createAuthResolver, encodeBasicAuth } from "../src/auth.js";
import { createAuthstackClient } from "../src/client.js";
import { AuthstackApiError } from "../src/errors.js";

describe("encodeBasicAuth", () => {
  it("encodes application credentials", () => {
    expect(encodeBasicAuth("app-id", "app-secret")).toBe("YXBwLWlkOmFwcC1zZWNyZXQ=");
  });
});

describe("createAuthResolver", () => {
  it("returns basic auth credentials for app basic auth", () => {
    const auth = createAuthResolver({
      appId: "app-id",
      appSecret: "app-secret",
    });

    expect(
      auth({
        type: "http",
        scheme: "basic",
      }),
    ).toBe("YXBwLWlkOmFwcC1zZWNyZXQ=");
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

  it("returns admin key for admin header auth", () => {
    const auth = createAuthResolver({
      adminKey: "secret-admin-key",
    });

    expect(
      auth({
        type: "apiKey",
        name: "X-Admin-Key",
        in: "header",
      }),
    ).toBe("secret-admin-key");
  });
});

describe("createAuthstackClient", () => {
  it("exposes grouped API namespaces", () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
      appId: "app-id",
      appSecret: "app-secret",
    });

    expect(client.api.auth.signup).toBeTypeOf("function");
    expect(client.api.orgs.list).toBeTypeOf("function");
    expect(client.api.admin.createApplication).toBeTypeOf("function");
    expect(client.api.jwks).toBeTypeOf("function");
  });

  it("updates credentials via setters", () => {
    const client = createAuthstackClient({
      baseUrl: "http://localhost:8080",
    });

    client.setAppCredentials("app-id", "app-secret");
    client.setAccessToken("access-token");

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
    ).toBe("YXBwLWlkOmFwcC1zZWNyZXQ=");

    expect(
      auth({
        type: "http",
        scheme: "bearer",
      }),
    ).toBe("access-token");
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
