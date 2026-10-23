import type { ErrorEnvelope } from "./types";

export type FieldErrorDetail = { field: string; message: string };

/** A failed API call, normalised from the backend's {"error": {...}} envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldErrorDetail[];
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    details?: FieldErrorDetail[];
    requestId?: string | null;
    retryAfterSeconds?: number | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.requestId = init.requestId ?? null;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  get isNetworkError(): boolean {
    return this.status === 0 || this.code === "BACKEND_UNAVAILABLE";
  }
}

function isEnvelope(body: unknown): body is ErrorEnvelope {
  if (typeof body !== "object" || body === null || !("error" in body)) return false;
  const error = (body as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
}

function toFieldDetails(details: unknown): FieldErrorDetail[] {
  if (!Array.isArray(details)) return [];
  return details.flatMap((d) =>
    typeof d === "object" && d !== null && typeof d.message === "string"
      ? [{ field: typeof d.field === "string" ? d.field : "", message: d.message }]
      : [],
  );
}

/** Builds an ApiError from a non-2xx response. `body` is the parsed JSON, or undefined. */
export function apiErrorFromResponse(response: Response, body: unknown): ApiError {
  const retryAfter = Number(response.headers.get("Retry-After"));
  const retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
  const headerRequestId = response.headers.get("X-Request-ID");

  if (isEnvelope(body)) {
    return new ApiError({
      status: response.status,
      code: body.error.code,
      message: body.error.message,
      details: toFieldDetails(body.error.details),
      requestId: body.error.request_id ?? headerRequestId,
      retryAfterSeconds,
    });
  }
  // A non-JSON 5xx comes from the Next.js proxy when FastAPI is not reachable.
  if (response.status >= 500) {
    return new ApiError({
      status: response.status,
      code: "BACKEND_UNAVAILABLE",
      message: "The FaceTrack API is not reachable. Check that the backend is running.",
      requestId: headerRequestId,
    });
  }
  return new ApiError({
    status: response.status,
    code: "HTTP_ERROR",
    message: `Request failed (${response.status}).`,
    requestId: headerRequestId,
  });
}

export function networkError(cause: unknown): ApiError {
  const error = new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: "Cannot reach the server. Check your connection and that the app is running.",
  });
  (error as { cause?: unknown }).cause = cause;
  return error;
}

/** A user-facing message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429 && error.retryAfterSeconds) {
      return `${error.message} Try again in ${error.retryAfterSeconds}s.`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
