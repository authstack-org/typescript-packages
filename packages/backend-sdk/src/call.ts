import { AuthstackApiError } from "./errors.js";

export type HeyApiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

export type RequestOptions = {
  /** Override the client-level throwOnError setting for this call. */
  throwOnError?: boolean;
  headers?: Record<string, string>;
};

export type ApiResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: AuthstackApiError };

function toApiError<T>(result: HeyApiResult<T>): AuthstackApiError {
  if (result.error instanceof AuthstackApiError) {
    return result.error;
  }

  if (result.error instanceof Error) {
    return new AuthstackApiError(result.error.message, {
      status: result.response.status,
      body: result.error,
      url: result.response.url,
    });
  }

  const body =
    result.error ??
    (result.response.status >= 400 ? { error: result.response.statusText } : undefined);

  return AuthstackApiError.fromResponse(result.response, body);
}

export async function invoke<T>(
  promise: Promise<HeyApiResult<T>>,
  throwOnError: boolean,
): Promise<T | ApiResult<T>> {
  const result = await promise;
  const failed = result.error !== undefined || !result.response.ok;

  if (failed) {
    const error = toApiError(result);
    if (throwOnError) {
      throw error;
    }
    return { error };
  }

  if (throwOnError) {
    return result.data as T;
  }

  return { data: result.data as T };
}

export function resolveThrowOnError(
  clientDefault: boolean,
  request?: RequestOptions,
): boolean {
  return request?.throwOnError ?? clientDefault;
}
