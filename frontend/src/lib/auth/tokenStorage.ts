/**
 * @file src/lib/auth/tokenStorage.ts
 * @description Local browser storage adapter for JWT access & refresh tokens
 * and authentication identity provider source tagging ('backend' | 'firebase').
 * All operations are wrapped in safe try/catch guards to avoid exceptions in SSR or incognito mode.
 */

export const tokenStorage = {
  /** Retrieves JWT access token from localStorage */
  getAccessToken: (): string | null => {
    try { return localStorage.getItem('dbaas_access'); } catch { return null; }
  },
  
  /** Retrieves JWT refresh token from localStorage */
  getRefreshToken: (): string | null => {
    try { return localStorage.getItem('dbaas_refresh'); } catch { return null; }
  },
  
  /** Stores new access and optional refresh tokens */
  setTokens: (access: string, refresh?: string): void => {
    try {
      localStorage.setItem('dbaas_access', access);
      if (refresh) localStorage.setItem('dbaas_refresh', refresh);
    } catch {}
  },
  
  /** Returns the source provider for the current session ('backend' or 'firebase') */
  getTokenSource: (): 'backend' | 'firebase' | null => {
    try { return localStorage.getItem('dbaas_token_source') as 'backend' | 'firebase' | null; } catch { return null; }
  },
  
  /** Sets the source provider tag for token management */
  setTokenSource: (source: 'backend' | 'firebase'): void => {
    try { localStorage.setItem('dbaas_token_source', source); } catch {}
  },
  
  /** Wipes all stored authentication tokens and credentials */
  clear: (): void => {
    try {
      localStorage.removeItem('dbaas_access');
      localStorage.removeItem('dbaas_refresh');
      localStorage.removeItem('dbaas_token_source');
    } catch {}
  }
};
