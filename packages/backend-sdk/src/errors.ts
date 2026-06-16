export type AuthstackApiErrorBody = {
  error?: string;
  message?: string;
};

export class AuthstackApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly url: string;

  constructor(message: string, options: { status: number; body: unknown; url: string }) {
    super(message);
    this.name = "AuthstackApiError";
    this.status = options.status;
    this.body = options.body;
    this.url = options.url;
  }

  static fromResponse(response: Response, body: unknown): AuthstackApiError {
    const parsed =
      typeof body === "object" && body !== null
        ? (body as AuthstackApiErrorBody)
        : undefined;
    const message =
      parsed?.error ??
      parsed?.message ??
      `Authstack API request failed with status ${response.status}`;

    return new AuthstackApiError(message, {
      status: response.status,
      body,
      url: response.url,
    });
  }
}

export function isAuthstackApiError(error: unknown): error is AuthstackApiError {
  return error instanceof AuthstackApiError;
}
