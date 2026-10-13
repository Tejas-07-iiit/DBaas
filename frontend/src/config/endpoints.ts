/**
 * @file src/config/endpoints.ts
 * @description Central REST API endpoint catalog for the DBaaS control-plane.
 * Maps all 40 frontend service endpoints to corresponding environment configuration keys
 * with associated HTTP verbs and URL interpolation helpers.
 */

import { env } from './env';
import { buildPath } from '@/lib/api/buildPath';

export type Endpoint = { path: string; method: string };

export const endpoints = {
  auth: {
    register: { path: env.AUTH_REGISTER_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-01
    login: { path: env.AUTH_LOGIN_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-02
    refresh: { path: env.AUTH_REFRESH_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-03
    logout: { path: env.AUTH_LOGOUT_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-04
    me: { path: env.AUTH_ME_ENDPOINT as string, method: 'GET' } as Endpoint, // AUTH-05
    forgotPassword: { path: env.AUTH_FORGOT_PASSWORD_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-06
    resetPassword: { path: env.AUTH_RESET_PASSWORD_ENDPOINT as string, method: 'POST' } as Endpoint, // AUTH-07
  },
  user: {
    get: { path: env.USER_GET_ENDPOINT as string, method: 'GET' } as Endpoint, // USER-01
    update: { path: env.USER_UPDATE_ENDPOINT as string, method: 'PUT' } as Endpoint, // USER-02
    delete: { path: env.USER_DELETE_ENDPOINT as string, method: 'DELETE' } as Endpoint, // USER-03
  },
  projects: {
    list: { path: env.PROJECTS_LIST_ENDPOINT as string, method: 'GET' } as Endpoint, // PROJ-01
    create: { path: env.PROJECTS_CREATE_ENDPOINT as string, method: 'POST' } as Endpoint, // PROJ-02
    get: { path: env.PROJECTS_GET_ENDPOINT as string, method: 'GET' } as Endpoint, // PROJ-03
    update: { path: env.PROJECTS_UPDATE_ENDPOINT as string, method: 'PUT' } as Endpoint, // PROJ-04
    delete: { path: env.PROJECTS_DELETE_ENDPOINT as string, method: 'DELETE' } as Endpoint, // PROJ-05
  },
  members: {
    list: { path: env.MEMBERS_LIST_ENDPOINT as string, method: 'GET' } as Endpoint, // TEAM-01
    add: { path: env.MEMBERS_ADD_ENDPOINT as string, method: 'POST' } as Endpoint, // TEAM-02
    updateRole: { path: env.MEMBERS_UPDATE_ROLE_ENDPOINT as string, method: 'PUT' } as Endpoint, // TEAM-03
    remove: { path: env.MEMBERS_REMOVE_ENDPOINT as string, method: 'DELETE' } as Endpoint, // TEAM-04
  },
  subscription: {
    listPlans: { path: env.PLANS_LIST_ENDPOINT as string, method: 'GET' } as Endpoint, // BILL-01
    get: { path: env.SUBSCRIPTION_GET_ENDPOINT as string, method: 'GET' } as Endpoint, // BILL-02
    checkout: { path: env.SUBSCRIPTION_CHECKOUT_ENDPOINT as string, method: 'POST' } as Endpoint, // BILL-03
    cancel: { path: env.SUBSCRIPTION_CANCEL_ENDPOINT as string, method: 'POST' } as Endpoint, // BILL-04
  },
  databases: {
    list: { path: env.DATABASES_LIST_ENDPOINT as string, method: 'GET' } as Endpoint, // DB-01
    create: { path: env.DATABASES_CREATE_ENDPOINT as string, method: 'POST' } as Endpoint, // DB-02
    get: { path: env.DATABASES_GET_ENDPOINT as string, method: 'GET' } as Endpoint, // DB-03
    update: { path: env.DATABASES_UPDATE_ENDPOINT as string, method: 'PUT' } as Endpoint, // DB-04
    delete: { path: env.DATABASES_DELETE_ENDPOINT as string, method: 'DELETE' } as Endpoint, // DB-05
    start: { path: env.DATABASES_START_ENDPOINT as string, method: 'POST' } as Endpoint, // DB-06
    stop: { path: env.DATABASES_STOP_ENDPOINT as string, method: 'POST' } as Endpoint, // DB-07
    restart: { path: env.DATABASES_RESTART_ENDPOINT as string, method: 'POST' } as Endpoint, // DB-08
    connection: { path: env.DATABASES_CONNECTION_ENDPOINT as string, method: 'GET' } as Endpoint, // DB-09
    rotateCredentials: { path: env.DATABASES_ROTATE_CREDENTIALS_ENDPOINT as string, method: 'POST' } as Endpoint, // DB-10
  },
  monitoring: {
    metrics: { path: env.MONITORING_METRICS_ENDPOINT as string, method: 'GET' } as Endpoint, // MON-01
    logs: { path: env.MONITORING_LOGS_ENDPOINT as string, method: 'GET' } as Endpoint, // MON-02
    events: { path: env.MONITORING_EVENTS_ENDPOINT as string, method: 'GET' } as Endpoint, // MON-03
  },
  admin: {
    users: { path: env.ADMIN_USERS_ENDPOINT as string, method: 'GET' } as Endpoint, // ADMIN-01
    projects: { path: env.ADMIN_PROJECTS_ENDPOINT as string, method: 'GET' } as Endpoint, // ADMIN-02
    databases: { path: env.ADMIN_DATABASES_ENDPOINT as string, method: 'GET' } as Endpoint, // ADMIN-03
    systemHealth: { path: env.ADMIN_SYSTEM_HEALTH_ENDPOINT as string, method: 'GET' } as Endpoint, // ADMIN-04
  },
};

export function getEndpointUrl(endpoint: Endpoint, params?: Record<string, string | number>): string {
  const path = buildPath(endpoint.path, params);
  return `${env.API_BASE_URL}${path}`;
}
