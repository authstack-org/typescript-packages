export type AuthstackCredentials = {
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  adminKey?: string;
  adminCookie?: string;
};

type AuthScheme = {
  in?: "header" | "query" | "cookie";
  name?: string;
  scheme?: "basic" | "bearer";
  type: "apiKey" | "http";
};

export function encodeBasicAuth(username: string, password: string): string {
  const value = `${username}:${password}`;

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }

  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return Buffer.from(binary, "binary").toString("base64");
}

/**
 * Returns the raw `username:password` pair for HTTP Basic auth.
 *
 * @hey-api/client-fetch base64-encodes this value and prefixes it with `Basic `
 * when building the Authorization header.
 */
export function formatBasicAuthCredentials(username: string, password: string): string {
  return `${username}:${password}`;
}

export function createAuthResolver(credentials: AuthstackCredentials) {
  return (auth: AuthScheme): string | undefined => {
    if (auth.type === "http" && auth.scheme === "basic") {
      if (credentials.appId && credentials.appSecret) {
        return formatBasicAuthCredentials(credentials.appId, credentials.appSecret);
      }

      return undefined;
    }

    if (auth.type === "http" && auth.scheme === "bearer") {
      return credentials.accessToken;
    }

    if (auth.type === "apiKey" && auth.name === "X-Admin-Key") {
      return credentials.adminKey;
    }

    if (auth.type === "apiKey" && auth.name === "admin_token") {
      return credentials.adminCookie;
    }

    return undefined;
  };
}

export function mergeCredentials(
  current: AuthstackCredentials,
  next: Partial<AuthstackCredentials>,
): AuthstackCredentials {
  return {
    ...current,
    ...next,
  };
}
