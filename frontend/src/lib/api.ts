const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const REFRESH_PATH = "/api/v1/auth/refresh";
const SKIP_REFRESH_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/verify-email/resend",
  "/api/v1/auth/verify-phone",
  "/api/v1/auth/verify-phone/resend",
  "/api/v1/auth/logout",
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
    super(payload.error?.message ?? payload.message ?? validationMessage(payload.detail) ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = payload.error?.code;
    this.details = payload.error?.details;
  }
}

function validationMessage(detail: unknown) {
  if (!Array.isArray(detail)) return undefined;
  const first = detail[0] as { msg?: string } | undefined;
  return first?.msg;
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
  const data = text ? (JSON.parse(text) as T & ApiErrorPayload) : ({} as T & ApiErrorPayload);

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
