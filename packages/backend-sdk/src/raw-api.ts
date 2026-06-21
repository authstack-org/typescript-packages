import type { Client } from "@hey-api/client-fetch";

import * as generated from "./generated/sdk.gen.js";

type SdkOptions<T> = Omit<T, "client">;

function bind<T extends { client?: Client }, R>(
  fn: (options: T) => R,
  client: Client,
) {
  return (options?: SdkOptions<T>) => fn({ ...(options ?? {}), client } as T);
}

/**
 * Low-level API that mirrors the OpenAPI operations.
 * Prefer the ergonomic methods on {@link AuthstackClient} (`signIn`, `organization`, …).
 */
export function createRawApi(client: Client) {
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
    /** @deprecated Use `organization.roles` on the ergonomic client instead. */
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
    /** @deprecated Use `organization.members` on the ergonomic client instead. */
    members: {
      list: bind(generated.membersList, client),
      add: bind(generated.membersAdd, client),
      remove: bind(generated.membersRemove, client),
    },
    /** @deprecated Use `organization.invites` on the ergonomic client instead. */
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

export type RawApi = ReturnType<typeof createRawApi>;
