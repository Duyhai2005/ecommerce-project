const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const AUTH_BASE_PATH = process.env.NEXT_PUBLIC_AUTH_BASE_PATH ?? "/auth";
const REFRESH_PATH = `${AUTH_BASE_PATH}/refresh`;
const SKIP_REFRESH_PATHS = new Set([
  `${AUTH_BASE_PATH}/login`,
  `${AUTH_BASE_PATH}/register`,
  `${AUTH_BASE_PATH}/verify-email`,
  `${AUTH_BASE_PATH}/verify-email/send`,
  `${AUTH_BASE_PATH}/verify-phone`,
  `${AUTH_BASE_PATH}/verify-phone/send`,
  `${AUTH_BASE_PATH}/logout`,
  REFRESH_PATH
]);

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  detail?: unknown;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error?.message ?? payload.message ?? detailMessage(payload.detail) ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = payload.error?.code;
    this.details = payload.error?.details;
  }
}

function detailMessage(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return undefined;
  const first = detail[0] as { msg?: string } | undefined;
  return first?.msg;
}

function parseResponsePayload<T>(text: string, fallbackMessage: string): T & ApiErrorPayload {
  if (!text) return { message: fallbackMessage } as T & ApiErrorPayload;

  try {
    return JSON.parse(text) as T & ApiErrorPayload;
  } catch {
    return { message: text || fallbackMessage } as T & ApiErrorPayload;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, retryOnUnauthorized = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const text = await response.text();
  const data = parseResponsePayload<T>(text, response.statusText || "Request failed");

  if (response.status === 401 && retryOnUnauthorized && !SKIP_REFRESH_PATHS.has(path)) {
    await apiFetch<AuthSessionRefreshResponse>(REFRESH_PATH, { method: "POST" }, false);
    return apiFetch<T>(path, options, false);
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

type AuthSessionRefreshResponse = {
  expiresIn: number;
  tokenType: string;
};
