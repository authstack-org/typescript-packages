import { createClient, createConfig, type Client } from "@hey-api/client-fetch";

import {
  createAuthResolver,
  mergeCredentials,
  type AuthstackCredentials,
} from "./auth.js";
import * as generated from "./generated/sdk.gen.js";
import type { ClientOptions } from "./generated/types.gen.js";

export type AuthstackClientConfig = AuthstackCredentials & {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

type SdkOptions<T> = Omit<T, "client">;

function bind<T extends { client?: Client }, R>(
  fn: (options: T) => R,
  client: Client,
) {
  return (options?: SdkOptions<T>) => fn({ ...(options ?? {}), client } as T);
}

function createApi(client: Client) {
  return {
    jwks: bind(generated.jwks, client),
    admin: {
      createApplication: bind(generated.adminCreateApplication, client),
      createApp: bind(generated.adminCreateApp, client),
      newAppPage: bind(generated.adminNewAppPage, client),
      dashboard: bind(generated.adminDashboard, client),
      loginPage: bind(generated.adminLoginPage, client),
      processLogin: bind(generated.adminProcessLogin, client),
      logout: bind(generated.adminLogout, client),
    },
    auth: {
      login: bind(generated.authLogin, client),
      logout: bind(generated.authLogout, client),
      refresh: bind(generated.authRefresh, client),
      signup: bind(generated.authSignup, client),
      switchOrg: bind(generated.authSwitchOrg, client),
    },
    me: {
      organizations: bind(generated.meOrganizations, client),
    },
    permissions: {
      list: bind(generated.permissionsList, client),
      create: bind(generated.permissionsCreate, client),
      get: bind(generated.permissionsGet, client),
      delete: bind(generated.permissionsDelete, client),
    },
    orgRoles: {
      list: bind(generated.orgRolesList, client),
      create: bind(generated.orgRolesCreate, client),
      get: bind(generated.orgRolesGet, client),
      update: bind(generated.orgRolesUpdate, client),
      delete: bind(generated.orgRolesDelete, client),
    },
    orgs: {
      list: bind(generated.orgsList, client),
      create: bind(generated.orgsCreate, client),
      get: bind(generated.orgsGet, client),
    },
    members: {
      list: bind(generated.membersList, client),
      add: bind(generated.membersAdd, client),
      remove: bind(generated.membersRemove, client),
    },
    invites: {
      list: bind(generated.invitesList, client),
      create: bind(generated.invitesCreate, client),
      accept: bind(generated.invitesAccept, client),
    },
    users: {
      list: bind(generated.usersList, client),
      get: bind(generated.usersGet, client),
    },
  };
}

export type AuthstackClient = ReturnType<typeof createAuthstackClient>;

export function createAuthstackClient(config: AuthstackClientConfig) {
  let credentials: AuthstackCredentials = {
    appId: config.appId,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    adminCookie: config.adminCookie,
  };

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

  const api = createApi(client);

  return {
    client,
    api,
    getConfig: () => client.getConfig(),
    setAccessToken(accessToken?: string) {
      credentials = mergeCredentials(credentials, { accessToken });
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
