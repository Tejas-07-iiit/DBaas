# API Endpoints

This document outlines the 40 endpoints used by the frontend.

| Env Variable | Endpoint ID | Module | Method | Path Template | Who May Call It | Expected Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT` | AUTH-01 | auth | POST | `/auth/register` | Public | 201 |
| `NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT` | AUTH-02 | auth | POST | `/auth/login` | Public | 200 |
| `NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT` | AUTH-03 | auth | POST | `/auth/refresh` | Public | 200 |
| `NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT` | AUTH-04 | auth | POST | `/auth/logout` | Authenticated | 204 |
| `NEXT_PUBLIC_AUTH_ME_ENDPOINT` | AUTH-05 | auth | GET | `/auth/me` | Authenticated | 200 |
| `NEXT_PUBLIC_AUTH_FORGOT_PASSWORD_ENDPOINT` | AUTH-06 | auth | POST | `/auth/forgot-password` | Public | 202 |
| `NEXT_PUBLIC_AUTH_RESET_PASSWORD_ENDPOINT` | AUTH-07 | auth | POST | `/auth/reset-password` | Public | 200 |
| `NEXT_PUBLIC_USER_GET_ENDPOINT` | USER-01 | user | GET | `/users/me` | Authenticated | 200 |
| `NEXT_PUBLIC_USER_UPDATE_ENDPOINT` | USER-02 | user | PUT | `/users/me` | Authenticated | 200 |
| `NEXT_PUBLIC_USER_DELETE_ENDPOINT` | USER-03 | user | DELETE | `/users/me` | Authenticated | 200 |
| `NEXT_PUBLIC_PROJECTS_LIST_ENDPOINT` | PROJ-01 | projects | GET | `/projects` | Authenticated | 200 |
| `NEXT_PUBLIC_PROJECTS_CREATE_ENDPOINT` | PROJ-02 | projects | POST | `/projects` | Authenticated | 201 |
| `NEXT_PUBLIC_PROJECTS_GET_ENDPOINT` | PROJ-03 | projects | GET | `/projects/:projectId` | Project Member | 200 |
| `NEXT_PUBLIC_PROJECTS_UPDATE_ENDPOINT` | PROJ-04 | projects | PUT | `/projects/:projectId` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_PROJECTS_DELETE_ENDPOINT` | PROJ-05 | projects | DELETE | `/projects/:projectId` | Project Owner | 200 |
| `NEXT_PUBLIC_MEMBERS_LIST_ENDPOINT` | TEAM-01 | members | GET | `/projects/:projectId/members` | Project Member | 200 |
| `NEXT_PUBLIC_MEMBERS_ADD_ENDPOINT` | TEAM-02 | members | POST | `/projects/:projectId/members` | Project Admin-Owner | 201 |
| `NEXT_PUBLIC_MEMBERS_UPDATE_ROLE_ENDPOINT` | TEAM-03 | members | PUT | `/projects/:projectId/members/:userId` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_MEMBERS_REMOVE_ENDPOINT` | TEAM-04 | members | DELETE | `/projects/:projectId/members/:userId` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_PLANS_LIST_ENDPOINT` | BILL-01 | subscription | GET | `/plans` | Public | 200 |
| `NEXT_PUBLIC_SUBSCRIPTION_GET_ENDPOINT` | BILL-02 | subscription | GET | `/subscription` | Authenticated | 200 |
| `NEXT_PUBLIC_SUBSCRIPTION_CHECKOUT_ENDPOINT` | BILL-03 | subscription | POST | `/subscription/checkout` | Authenticated | 200 |
| `NEXT_PUBLIC_SUBSCRIPTION_CANCEL_ENDPOINT` | BILL-04 | subscription | POST | `/subscription/cancel` | Authenticated | 200 |
| `NEXT_PUBLIC_DATABASES_LIST_ENDPOINT` | DB-01 | databases | GET | `/projects/:projectId/databases` | Project Member | 200 |
| `NEXT_PUBLIC_DATABASES_CREATE_ENDPOINT` | DB-02 | databases | POST | `/projects/:projectId/databases` | Project Admin-Owner | 201 |
| `NEXT_PUBLIC_DATABASES_GET_ENDPOINT` | DB-03 | databases | GET | `/projects/:projectId/databases/:databaseId` | Project Member | 200 |
| `NEXT_PUBLIC_DATABASES_UPDATE_ENDPOINT` | DB-04 | databases | PUT | `/projects/:projectId/databases/:databaseId` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_DATABASES_DELETE_ENDPOINT` | DB-05 | databases | DELETE | `/projects/:projectId/databases/:databaseId` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_DATABASES_START_ENDPOINT` | DB-06 | databases | POST | `/projects/:projectId/databases/:databaseId/start` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_DATABASES_STOP_ENDPOINT` | DB-07 | databases | POST | `/projects/:projectId/databases/:databaseId/stop` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_DATABASES_RESTART_ENDPOINT` | DB-08 | databases | POST | `/projects/:projectId/databases/:databaseId/restart` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_DATABASES_CONNECTION_ENDPOINT` | DB-09 | databases | GET | `/projects/:projectId/databases/:databaseId/connection` | Project Member | 200 |
| `NEXT_PUBLIC_DATABASES_ROTATE_CREDENTIALS_ENDPOINT` | DB-10 | databases | POST | `/projects/:projectId/databases/:databaseId/credentials/rotate` | Project Admin-Owner | 200 |
| `NEXT_PUBLIC_MONITORING_METRICS_ENDPOINT` | MON-01 | monitoring | GET | `/projects/:projectId/databases/:databaseId/metrics` | Project Member | 200 |
| `NEXT_PUBLIC_MONITORING_LOGS_ENDPOINT` | MON-02 | monitoring | GET | `/projects/:projectId/databases/:databaseId/logs` | Project Member | 200 |
| `NEXT_PUBLIC_MONITORING_EVENTS_ENDPOINT` | MON-03 | monitoring | GET | `/projects/:projectId/databases/:databaseId/events` | Project Member | 200 |
| `NEXT_PUBLIC_ADMIN_USERS_ENDPOINT` | ADMIN-01 | admin | GET | `/admin/users` | Admin | 200 |
| `NEXT_PUBLIC_ADMIN_PROJECTS_ENDPOINT` | ADMIN-02 | admin | GET | `/admin/projects` | Admin | 200 |
| `NEXT_PUBLIC_ADMIN_DATABASES_ENDPOINT` | ADMIN-03 | admin | GET | `/admin/databases` | Admin | 200 |
| `NEXT_PUBLIC_ADMIN_SYSTEM_HEALTH_ENDPOINT` | ADMIN-04 | admin | GET | `/admin/system/health` | Admin | 200 |

## How to change an endpoint

If the backend path for an API changes:
1. Edit `.env.local` to point to the new path.
2. Restart the dev server (`npm run dev`).
3. Run `npm run check:endpoints` to ensure everything is configured properly.

## Intentionally excluded endpoints
The following backend endpoints are intentionally NOT included in the frontend code:
- `/internal/*` (INFRA-01..06)
- `/webhooks/stripe` (BILL-05)

The browser must never call these directly.
