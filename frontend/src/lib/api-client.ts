import { getAccessToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  details: unknown;
  response: { status: number; data: unknown };

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.response = { status, data: details };
  }
}

type PrimitiveBody = string | number | boolean | null;

type RequestBody =
  | FormData
  | URLSearchParams
  | Blob
  | PrimitiveBody
  | object
  | Array<unknown>
  | undefined;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: RequestBody;
  requiresAuth?: boolean;
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveHeaders(body: RequestBody, headers?: HeadersInit) {
  const mergedHeaders = new Headers(headers);

  if (!(body instanceof FormData) && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  return mergedHeaders;
}

function resolveBody(body: RequestBody): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob
  ) {
    return body;
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

export async function apiRequest<T>(
  path: string,
  { body, requiresAuth = false, headers, ...rest }: RequestOptions = {},
): Promise<T> {
  const requestHeaders = resolveHeaders(body, headers);

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: resolveBody(body),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export { API_BASE_URL };
