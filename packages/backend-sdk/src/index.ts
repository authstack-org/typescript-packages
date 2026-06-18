export { createAuthstackClient, type AuthstackClient, type AuthstackClientConfig } from "./client.js";
export {
  createAuthResolver,
  encodeBasicAuth,
  formatBasicAuthCredentials,
  mergeCredentials,
  type AuthstackCredentials,
} from "./auth.js";
export {
  AuthstackApiError,
  isAuthstackApiError,
  type AuthstackApiErrorBody,
} from "./errors.js";
export type * from "./generated/types.gen.js";
