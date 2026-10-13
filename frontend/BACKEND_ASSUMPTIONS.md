# Backend Assumptions

This document outlines the exact assumptions the frontend makes about the backend authentication implementation. Please review carefully.

## Endpoints

| ID | Method | Path | Expected Status |
| :--- | :---: | :--- | :---: |
| Register | `POST` | `/auth/register` | `201` |
| Login | `POST` | `/auth/login` | `200` |
| Refresh | `POST` | `/auth/refresh` | `200` |
| Logout | `POST` | `/auth/logout` | `204` |
| Me | `GET` | `/auth/me` | `200` |
| Forgot Password | `POST` | `/auth/forgot-password` | `202` |
| Reset Password | `POST` | `/auth/reset-password` | `200` |

## Request and Response Payloads

### 1. Register (`/auth/register`)
- **Request Body:** `{ name: string, email: string, password: string }`
- **Response:** The frontend accepts tokens directly in the 201 response. If returned, the shape should match the Token Response (below). If no tokens are returned, the user is redirected to the login page.

### 2. Login (`/auth/login`)
- **Request Body:** `{ email: string, password: string }`
- **Response (Token Response):** 
  - Access token: `accessToken` (or `access_token`, `idToken`, `token`)
  - Refresh token: `refreshToken` (or `refresh_token`)
  - User object: `user` (or `data.user`, or top-level `id`/`name`/`email`) containing `{ id: string, name: string, email: string }`

### 3. Refresh (`/auth/refresh`)
- **Request Body:** `{ refreshToken: string, refresh_token: string }`
- **Response (Token Response):** Same as Login response.

### 4. Logout (`/auth/logout`)
- **Request Body:** Empty
- **Response:** None (204 No Content).

### 5. Me (`/auth/me`)
- **Request Body:** None
- **Response:** `{ id: string, name: string, email: string, role?: string }`

### 6. Forgot Password (`/auth/forgot-password`)
- **Request Body:** `{ email: string }`
- **Response:** None (202 Accepted).

### 7. Reset Password (`/auth/reset-password`)
- **Request Body:** `{ token: string, password: string }`
- **Response:** None (200 OK).

## Frontend Rules & Logic

1. **Authorization Header:** Access tokens are sent in the `Authorization: Bearer <token>` header for all protected requests.
2. **Automatic Refresh:** If a request returns a `401 Unauthorized` (and isn't the login/register/refresh endpoint), the frontend automatically calls the refresh endpoint exactly once. If successful, it retries the original request.
3. **Logout Behavior:** Calling the logout endpoint clears the local tokens regardless of whether the backend returns a success or failure (e.g., if the token was already expired).
4. **Password Validation:** Passwords must be a minimum of 8 characters and contain at least one letter and one number.
5. **Reset Links:** Reset links directed to the frontend should be formatted as `/reset-password?token=<token>` (or `?oobCode=<token>`).
6. **Post-Login Redirect:** Configured via `NEXT_PUBLIC_POST_LOGIN_REDIRECT` in `.env.local` (default is `/dashboard`).

## CORS Requirements

The backend must be configured to allow CORS requests from the frontend origin (`http://localhost:3000` in development). 
Specifically, the server must allow:
- `Origin: http://localhost:3000`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

## Please confirm or tell us what to change

- [ ] Endpoints match exactly (paths and methods).
- [ ] Expected status codes match (e.g. 201 for register, 204 for logout, 202 for forgot password).
- [ ] Register request accepts `{ name, email, password }`.
- [ ] Login request accepts `{ email, password }`.
- [ ] The token response contains an access token, a refresh token, and user data.
- [ ] Refresh request accepts `{ refreshToken, refresh_token }`.
- [ ] Me request returns `{ id, name, email }`.
- [ ] Forgot password request accepts `{ email }`.
- [ ] Reset password request accepts `{ token, password }`.
- [ ] CORS is configured to allow `http://localhost:3000` and the `Authorization` header.

# Backend Assumptions
## Projects
- Does the project object include the user's role (Owner, Admin, Member)?
- What does the create project endpoint return (just ID, or full object)?
- What are the delete semantics (does it synchronously delete all databases)?

## Subscription
- What does the subscription object look like? Does it have planName, status, renewalDate?


### Firebase Google Sign-In
- Is Google sign-in enabled in the Firebase console?
- Does the backend create the user record automatically on the first verified token, or does the frontend call register? (Currently calling `register` with `{ name, email }`).
- Are localhost and the deploy domain in Firebase Authorized domains?


### Platform Admin
- How is the `isPlatformAdmin` boolean derived from the user endpoint (is it a role, isAdmin flag, or platformRole)?
- Do the Admin lists (users, projects, databases) support paging via query parameters (`page`, `limit`)?
- What exactly does the Health endpoint (`ADMIN-04`) return (array, nested object, status strings)?
