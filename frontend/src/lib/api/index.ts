/**
 * @file src/lib/api/index.ts
 * @description Central API layer hub for DBaaS frontend control plane.
 * Provides unified access to all typed client operations, mappers, and error handlers.
 */

export { apiClient } from "./client";
export { ApiError } from "./errors";
export { buildPath } from "./buildPath";
export { authApi } from "./auth";

// Module APIs
export * as userApi from "./user";
export * as projectsApi from "./projects";
export * as databasesApi from "./databases";
export * as membersApi from "./members";
export * as subscriptionApi from "./subscription";
export * as monitoringApi from "./monitoring";
export * as adminApi from "./admin";

// Mappers and Types
export type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MeResponse,
  DbStatus,
  HealthStatus,
  CheckoutRequest,
} from "./mappers";

export {
  parseTokenResponse,
  mapProject,
  mapSubscription,
  mapDatabaseStatus,
  mapDatabase,
  mapHealthStatus,
  mapUser,
} from "./mappers";
