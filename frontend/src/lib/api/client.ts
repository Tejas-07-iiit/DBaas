import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { ApiError } from './errors';
import { endpoints, Endpoint, getEndpointUrl } from '@/config/endpoints';
// DEMO MODE
import { getDemoSession } from '@/lib/auth/demo/demoSession';

/**
 * Internal lock/promise to prevent multiple concurrent token refresh requests.
 * When a 401 occurs, subsequent requests wait for this single promise to resolve.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to exchange the current refresh token for a fresh access token.
 * Updates local token storage on success.
 *
 * @returns {Promise<string | null>} The new access token, or null if refresh failed.
 */
async function executeRefresh(): Promise<string | null> {
  const refresh = tokenStorage.getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(getEndpointUrl(endpoints.auth.refresh), {
      method: endpoints.auth.refresh.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh, refresh_token: refresh }),
      ...(env.API_WITH_CREDENTIALS ? { credentials: 'include' } : {})
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    const newAccess = data.accessToken || data.access_token || data.idToken || data.token;
    const newRefresh = data.refreshToken || data.refresh_token;
    if (newAccess) {
      tokenStorage.setTokens(newAccess, newRefresh || refresh);
      return newAccess;
    }
  } catch (err) {}
  return null;
}

/**
 * Primary HTTP client for all DBaaS REST API calls.
 * 
 * Features:
 * - Dynamic URL parameter substitution via `getEndpointUrl`
 * - Demo mode interceptor routing requests to mock in-browser storage
 * - Automatic Authorization header injection for backend or Firebase tokens
 * - Automated 401 token refresh queue and retry
 * - Normalized ApiError exception mapping
 *
 * @template T - Expected response payload type
 * @param {Endpoint} endpoint - The target endpoint definition containing method and path template
 * @param {Omit<RequestInit, 'method'>} [options={}] - Standard fetch options (headers, body, etc.)
 * @param {Record<string, string | number>} [params] - URL path parameters (e.g. :projectId, :databaseId)
 * @param {boolean} [isRetry=false] - Internal flag preventing infinite retry loops on 401
 * @returns {Promise<T>} Resolves to parsed JSON or empty object
 */
export async function apiClient<T>(
  endpoint: Endpoint, 
  options: Omit<RequestInit, 'method'> = {}, 
  params?: Record<string, string | number>,
  isRetry = false
): Promise<T> {
  const url = getEndpointUrl(endpoint, params);

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  let token = tokenStorage.getAccessToken();
  const source = tokenStorage.getTokenSource();
  if (source === 'firebase') {
     try {
       const { auth } = await import('@/lib/firebase/client');
       if (auth.currentUser) {
          token = await auth.currentUser.getIdToken(false);
       }
     } catch {}
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const reqOptions: RequestInit = {
    ...options,
    method: endpoint.method,
    headers,
    ...(env.API_WITH_CREDENTIALS ? { credentials: 'include' } : {})
  };

  let res: Response;
  try {
    res = await fetch(url, reqOptions);
  } catch (err) {
    throw ApiError.fromStatus(0);
  }

  // Handle automatic refresh for 401s
  const isAuthEndpoint = [
    endpoints.auth.login.path, 
    endpoints.auth.register.path, 
    endpoints.auth.refresh.path
  ].includes(endpoint.path);
  
  if (res.status === 401 && !isAuthEndpoint && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = executeRefresh().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return apiClient<T>(endpoint, options, params, true);
    } else {
      tokenStorage.clear();
      if (typeof window !== 'undefined') {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
      throw ApiError.fromStatus(401);
    }
  }

  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch {}
    throw ApiError.fromStatus(res.status, data);
  }

  if (res.status === 204) {
    return {} as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}
