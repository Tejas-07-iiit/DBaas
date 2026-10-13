/**
 * @file src/lib/api/auth.ts
 * @description API service module for authentication actions:
 * register, login, logout, me, forgot password, and password reset.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';
import { tokenStorage } from "@/lib/auth/tokenStorage";
import { 
  RegisterRequest, LoginRequest, TokenResponse, 
  ForgotPasswordRequest, ResetPasswordRequest, MeResponse,
  parseTokenResponse,
  mapUser
} from './mappers';

export const authApi = {
  /**
   * Registers a new user account with email, name, and password.
   */
  register: (data: RegisterRequest) => 
    apiClient<any>(endpoints.auth.register, { body: JSON.stringify(data) }).then(parseTokenResponse),
  
  /**
   * Authenticates with email and password credentials.
   */
  login: (data: LoginRequest) => 
    apiClient<any>(endpoints.auth.login, { body: JSON.stringify(data) }).then(parseTokenResponse),
    
  /**
   * Invalidates active session tokens on the backend.
   */
  logout: () => 
    apiClient<void>(endpoints.auth.logout, { body: JSON.stringify({ refreshToken: tokenStorage.getRefreshToken() }) }),
    
  /**
   * Fetches current authenticated user session data and platform admin status.
   */
  me: () => 
    apiClient<any>(endpoints.auth.me, {}).then(mapUser),
    
  /**
   * Initiates password recovery email for given address.
   */
  forgotPassword: (data: ForgotPasswordRequest) => 
    apiClient<void>(endpoints.auth.forgotPassword, { body: JSON.stringify(data) }),
    
  /**
   * Resets password using verification token from recovery email.
   */
  resetPassword: (data: ResetPasswordRequest) => 
    apiClient<void>(endpoints.auth.resetPassword, { body: JSON.stringify(data) }),
};
