/** Error thrown by `apiFetch`, carrying the API's own message (`{ error }`). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * fetch wrapper for the app's JSON API: sends/receives JSON and throws
 * `ApiError` with the server's `error` message on non-2xx responses.
 */
export async function apiFetch<T = unknown>(
  url: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const { body, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers:
      body !== undefined
        ? { "Content-Type": "application/json", ...headers }
        : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.error || "Erro inesperado", res.status);
  }

  return json as T;
}

/** Message to show in a toast for any thrown value. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
