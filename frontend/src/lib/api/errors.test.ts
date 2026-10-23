import { describe, expect, it } from "vitest";

import { apiErrorFromResponse, errorMessage } from "./errors";

describe("apiErrorFromResponse", () => {
  it("reads the backend error envelope", () => {
    const response = new Response(null, { status: 422, headers: { "X-Request-ID": "header-id" } });
    const error = apiErrorFromResponse(response, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields are invalid.",
        details: [{ field: "username", message: "Field required" }, { bogus: true }],
        request_id: "body-id",
      },
    });
    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([{ field: "username", message: "Field required" }]);
    expect(error.requestId).toBe("body-id");
  });

  it("keeps Retry-After for rate limits", () => {
    const response = new Response(null, { status: 429, headers: { "Retry-After": "42" } });
    const error = apiErrorFromResponse(response, { error: { code: "RATE_LIMITED", message: "Too many requests." } });
    expect(error.retryAfterSeconds).toBe(42);
    expect(errorMessage(error)).toBe("Too many requests. Try again in 42s.");
  });

  it("treats a non-JSON 5xx as the backend being unreachable", () => {
    const error = apiErrorFromResponse(new Response("Internal Server Error", { status: 500 }), undefined);
    expect(error.code).toBe("BACKEND_UNAVAILABLE");
    expect(error.isNetworkError).toBe(true);
  });
});
