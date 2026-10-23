// Friendly aliases for the backend schemas. Source of truth: schema.d.ts, generated from
// FastAPI's /openapi.json with `npm run gen:api`. Regenerate whenever the backend changes.
import type { components, paths } from "./schema";

type Schemas = components["schemas"];

export type ApiPath = keyof paths;
export type Me = Schemas["MeOut"];
export type TokenResponse = Schemas["TokenOut"];
export type LoginRequest = Schemas["LoginRequest"];
export type ChangePasswordRequest = Schemas["ChangePasswordRequest"];
export type RoleDetail = Schemas["RoleDetailOut"];
export type Health = Schemas["HealthOut"];
export type Readiness = Schemas["ReadinessOut"];
export type ErrorEnvelope = Schemas["ErrorResponse"];
