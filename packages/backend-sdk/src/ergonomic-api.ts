import type { Client } from "@hey-api/client-fetch";

import { invoke, resolveThrowOnError, type RequestOptions } from "./call.js";
import * as generated from "./generated/sdk.gen.js";
import type {
  AcceptInviteResponse,
  AppPermission,
  InviteResponse,
  JwksResponse,
  Member,
  OrgRoleDetail,
  Organization,
  SignupResponse,
  TokenResponse,
  User,
  UserOrganization,
} from "./generated/types.gen.js";

export type ErgonomicApiContext = {
  client: Client;
  throwOnError: boolean;
  onSession?: (session: TokenResponse) => void;
};

type GeneratedCall<T> = Promise<{
  data?: T;
  error?: unknown;
  response: Response;
}>;

function call<T>(
  ctx: ErgonomicApiContext,
  promise: GeneratedCall<T>,
  options?: RequestOptions,
) {
  return invoke<T>(promise, resolveThrowOnError(ctx.throwOnError, options));
}

function maybeApplySession(
  ctx: ErgonomicApiContext,
  tokens: TokenResponse | undefined,
) {
  if (tokens?.access_token) {
    ctx.onSession?.(tokens);
  }
}

export function createErgonomicApi(ctx: ErgonomicApiContext) {
  const { client } = ctx;

  return {
    signIn: {
      email: async (
        input: { email: string; password: string },
        options?: RequestOptions,
      ) => {
        const result = await call<TokenResponse>(
          ctx,
          generated.authLogin({
            client,
            body: input,
            headers: options?.headers,
          }),
          options,
        );

        if (ctx.throwOnError && options?.throwOnError !== false) {
          maybeApplySession(ctx, result as TokenResponse);
        } else if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          result.data
        ) {
          maybeApplySession(ctx, result.data);
        }

        return result;
      },
    },

    signUp: {
      email: (
        input: { name: string; email: string; password: string },
        options?: RequestOptions,
      ) =>
        call<SignupResponse>(
          ctx,
          generated.authSignup({
            client,
            body: input,
            headers: options?.headers,
          }),
          options,
        ),
    },

    signOut: (
      input: { refreshToken: string },
      options?: RequestOptions,
    ) =>
      call<{ ok: boolean }>(
        ctx,
        generated.authLogout({
          client,
          body: { refresh_token: input.refreshToken },
          headers: options?.headers,
        }),
        options,
      ),

    session: {
      refresh: async (
        input: { refreshToken: string; orgId?: string },
        options?: RequestOptions,
      ) => {
        const result = await call<TokenResponse>(
          ctx,
          generated.authRefresh({
            client,
            body: {
              refresh_token: input.refreshToken,
              org_id: input.orgId ?? null,
            },
            headers: options?.headers,
          }),
          options,
        );

        if (ctx.throwOnError && options?.throwOnError !== false) {
          maybeApplySession(ctx, result as TokenResponse);
        } else if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          result.data
        ) {
          maybeApplySession(ctx, result.data);
        }

        return result;
      },

      switchOrg: async (
        input: { orgId: string },
        options?: RequestOptions,
      ) => {
        const result = await call<TokenResponse>(
          ctx,
          generated.authSwitchOrg({
            client,
            body: { org_id: input.orgId },
            headers: options?.headers,
          }),
          options,
        );

        if (ctx.throwOnError && options?.throwOnError !== false) {
          maybeApplySession(ctx, result as TokenResponse);
        } else if (
          result &&
          typeof result === "object" &&
          "data" in result &&
          result.data
        ) {
          maybeApplySession(ctx, result.data);
        }

        return result;
      },
    },

    me: {
      organizations: (options?: RequestOptions) =>
        call<UserOrganization[]>(
          ctx,
          generated.meOrganizations({ client, headers: options?.headers }),
          options,
        ),
    },

    organization: {
      list: (options?: RequestOptions) =>
        call<Organization[]>(
          ctx,
          generated.orgsList({ client, headers: options?.headers }),
          options,
        ),

      create: (
        input: { name: string; slug: string },
        options?: RequestOptions,
      ) =>
        call<Organization>(
          ctx,
          generated.orgsCreate({
            client,
            body: input,
            headers: options?.headers,
          }),
          options,
        ),

      get: (organizationId: string, options?: RequestOptions) =>
        call<Organization>(
          ctx,
          generated.orgsGet({
            client,
            path: { id: organizationId },
            headers: options?.headers,
          }),
          options,
        ),

      members: {
        list: (organizationId: string, options?: RequestOptions) =>
          call<Member[]>(
            ctx,
            generated.membersList({
              client,
              path: { org_id: organizationId },
              headers: options?.headers,
            }),
            options,
          ),

        add: (
          organizationId: string,
          input: { userId: string; roleSlug?: string; orgRoleId?: string },
          options?: RequestOptions,
        ) =>
          call<Member>(
            ctx,
            generated.membersAdd({
              client,
              path: { org_id: organizationId },
              body: {
                user_id: input.userId,
                role: input.roleSlug ?? null,
                org_role_id: input.orgRoleId ?? null,
              },
              headers: options?.headers,
            }),
            options,
          ),

        remove: (
          organizationId: string,
          userId: string,
          options?: RequestOptions,
        ) =>
          call<unknown>(
            ctx,
            generated.membersRemove({
              client,
              path: { org_id: organizationId, user_id: userId },
              headers: options?.headers,
            }),
            options,
          ),
      },

      invites: {
        list: (organizationId: string, options?: RequestOptions) =>
          call<InviteResponse[]>(
            ctx,
            generated.invitesList({
              client,
              path: { org_id: organizationId },
              headers: options?.headers,
            }),
            options,
          ),

        create: (
          organizationId: string,
          input: {
            email: string;
            name?: string;
            roleSlug?: string;
            orgRoleId?: string;
          },
          options?: RequestOptions,
        ) =>
          call<InviteResponse>(
            ctx,
            generated.invitesCreate({
              client,
              path: { org_id: organizationId },
              body: {
                email: input.email,
                name: input.name ?? null,
                role: input.roleSlug ?? null,
                org_role_id: input.orgRoleId ?? null,
              },
              headers: options?.headers,
            }),
            options,
          ),

        accept: (
          input: { token: string; password: string; name?: string },
          options?: RequestOptions,
        ) =>
          call<AcceptInviteResponse>(
            ctx,
            generated.invitesAccept({
              client,
              path: { token: input.token },
              body: {
                password: input.password,
                name: input.name ?? null,
              },
              headers: options?.headers,
            }),
            options,
          ),
      },

      roles: {
        list: (organizationId: string, options?: RequestOptions) =>
          call<OrgRoleDetail[]>(
            ctx,
            generated.orgRolesList({
              client,
              path: { org_id: organizationId },
              headers: options?.headers,
            }),
            options,
          ),

        create: (
          organizationId: string,
          input: {
            slug: string;
            name: string;
            description?: string;
            permissionIds?: string[];
          },
          options?: RequestOptions,
        ) =>
          call<OrgRoleDetail>(
            ctx,
            generated.orgRolesCreate({
              client,
              path: { org_id: organizationId },
              body: {
                slug: input.slug,
                name: input.name,
                description: input.description ?? null,
                permission_ids: input.permissionIds ?? [],
              },
              headers: options?.headers,
            }),
            options,
          ),

        get: (
          organizationId: string,
          roleId: string,
          options?: RequestOptions,
        ) =>
          call<OrgRoleDetail>(
            ctx,
            generated.orgRolesGet({
              client,
              path: { org_id: organizationId, role_id: roleId },
              headers: options?.headers,
            }),
            options,
          ),

        update: (
          organizationId: string,
          roleId: string,
          input: {
            name?: string;
            description?: string;
            permissionIds?: string[];
          },
          options?: RequestOptions,
        ) =>
          call<OrgRoleDetail>(
            ctx,
            generated.orgRolesUpdate({
              client,
              path: { org_id: organizationId, role_id: roleId },
              body: {
                name: input.name ?? null,
                description: input.description ?? null,
                permission_ids: input.permissionIds ?? null,
              },
              headers: options?.headers,
            }),
            options,
          ),

        delete: (
          organizationId: string,
          roleId: string,
          options?: RequestOptions,
        ) =>
          call<unknown>(
            ctx,
            generated.orgRolesDelete({
              client,
              path: { org_id: organizationId, role_id: roleId },
              headers: options?.headers,
            }),
            options,
          ),
      },
    },

    permissions: {
      list: (options?: RequestOptions) =>
        call<AppPermission[]>(
          ctx,
          generated.permissionsList({ client, headers: options?.headers }),
          options,
        ),

      create: (
        input: { key: string; name: string; description?: string },
        options?: RequestOptions,
      ) =>
        call<AppPermission>(
          ctx,
          generated.permissionsCreate({
            client,
            body: {
              key: input.key,
              name: input.name,
              description: input.description ?? null,
            },
            headers: options?.headers,
          }),
          options,
        ),

      get: (permissionId: string, options?: RequestOptions) =>
        call<AppPermission>(
          ctx,
          generated.permissionsGet({
            client,
            path: { id: permissionId },
            headers: options?.headers,
          }),
          options,
        ),

      delete: (permissionId: string, options?: RequestOptions) =>
        call<unknown>(
          ctx,
          generated.permissionsDelete({
            client,
            path: { id: permissionId },
            headers: options?.headers,
          }),
          options,
        ),
    },

    users: {
      list: (options?: RequestOptions) =>
        call<User[]>(
          ctx,
          generated.usersList({ client, headers: options?.headers }),
          options,
        ),

      get: (userId: string, options?: RequestOptions) =>
        call<User>(
          ctx,
          generated.usersGet({
            client,
            path: { id: userId },
            headers: options?.headers,
          }),
          options,
        ),
    },

    jwks: (options?: RequestOptions) =>
      call<JwksResponse>(
        ctx,
        generated.jwks({ client, headers: options?.headers }),
        options,
      ),
  };
}

export type ErgonomicApi = ReturnType<typeof createErgonomicApi>;
