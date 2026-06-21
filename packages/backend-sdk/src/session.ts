import type { TokenResponse } from "./generated/types.gen.js";

export type AuthstackSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export function sessionFromTokenResponse(tokens: TokenResponse): AuthstackSession {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type,
  };
}
