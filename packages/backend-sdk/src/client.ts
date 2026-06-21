import { createClient, createConfig, type Client } from "@hey-api/client-fetch";

import {
  createAuthResolver,
  mergeCredentials,
  type AuthstackCredentials,
} from "./auth.js";
import { createErgonomicApi } from "./ergonomic-api.js";
import type { TokenResponse } from "./generated/types.gen.js";
import type { ClientOptions } from "./generated/types.gen.js";
import { createRawApi } from "./raw-api.js";
import {
  sessionFromTokenResponse,
  type AuthstackSession,
} from "./session.js";

export type AuthstackClientConfig = AuthstackCredentials & {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  /**
   * When true (default), ergonomic methods throw {@link AuthstackApiError} on failure.
   * The low-level `api` namespace always returns `{ data, error }`.
   */
  throwOnError?: boolean;
  /**
   * When true (default), successful sign-in, refresh, and org-switch responses
   * automatically call {@link AuthstackClient.useSession}.
   */
  autoUseSession?: boolean;
};

export type AuthstackClient = ReturnType<typeof createAuthstackClient>;

export function createAuthstackClient(config: AuthstackClientConfig) {
  const throwOnError = config.throwOnError ?? true;
  const autoUseSession = config.autoUseSession ?? true;

  let credentials: AuthstackCredentials = {
    appId: config.appId,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    adminCookie: config.adminCookie,
  };

  let session: AuthstackSession | undefined;

  const client = createClient(
    createConfig<ClientOptions>({
      baseUrl: config.baseUrl,
      headers: config.headers,
      fetch: config.fetch,
      auth: createAuthResolver(credentials),
    }),
  );

  const refreshAuth = () => {
    client.setConfig({
      auth: createAuthResolver(credentials),
    });
  };

  const applySession = (tokens: TokenResponse) => {
    session = sessionFromTokenResponse(tokens);
    credentials = mergeCredentials(credentials, {
      accessToken: session.accessToken,
    });
    refreshAuth();
    return session;
  };

  const api = createRawApi(client);

  const ergonomic = createErgonomicApi({
    client,
    throwOnError,
    onSession: autoUseSession ? applySession : undefined,
  });

  return {
    /** Low-level OpenAPI client. Returns `{ data, error }` for every call. */
    client,
    api,
    ...ergonomic,

    throwOnError,
    getConfig: () => client.getConfig(),

    /** Store tokens on the client for subsequent bearer-authenticated calls. */
    useSession(tokens: TokenResponse | AuthstackSession) {
      if ("access_token" in tokens) {
        return applySession(tokens);
      }

      session = tokens;
      credentials = mergeCredentials(credentials, {
        accessToken: tokens.accessToken,
      });
      refreshAuth();
      return session;
    },

    getSession(): AuthstackSession | undefined {
      return session;
    },

    clearSession() {
      session = undefined;
      credentials = mergeCredentials(credentials, { accessToken: undefined });
      refreshAuth();
    },

    /** Use application basic auth (clears the bearer access token). */
    asApp() {
      session = undefined;
      credentials = mergeCredentials(credentials, { accessToken: undefined });
      refreshAuth();
    },

    /** Use a bearer access token for user-scoped calls. */
    asUser(accessToken: string) {
      credentials = mergeCredentials(credentials, { accessToken });
      refreshAuth();
    },

    setAccessToken(accessToken?: string) {
      credentials = mergeCredentials(credentials, { accessToken });
      if (accessToken && session) {
        session = { ...session, accessToken };
      }
      refreshAuth();
    },

    setAppCredentials(appId?: string, appSecret?: string) {
      credentials = mergeCredentials(credentials, { appId, appSecret });
      refreshAuth();
    },

    setAdminCookie(adminCookie?: string) {
      credentials = mergeCredentials(credentials, { adminCookie });
      refreshAuth();
    },

    setCredentials(next: Partial<AuthstackCredentials>) {
      credentials = mergeCredentials(credentials, next);
      refreshAuth();
    },
  };
}
