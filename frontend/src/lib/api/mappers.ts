// ASSUMPTION - confirm with backend: register request
export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
}

// ASSUMPTION - confirm with backend: login request
export interface LoginRequest {
  email: string;
  password?: string;
}

// ASSUMPTION - confirm with backend: token response
export interface TokenResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function parseTokenResponse(data: any): TokenResponse {
  if (!data || typeof data !== 'object') {
    throw new Error("Unexpected response from server");
  }

  const access = data.accessToken || data.access_token || data.idToken || data.token;
  const refresh = data.refreshToken || data.refresh_token;
  
  let user = data.user || data.data?.user;
  if (!user && data.id && data.name && data.email) {
    user = { id: data.id, name: data.name, email: data.email };
  }

  if (!access && !user) {
    if (process.env.NODE_ENV === 'development') {
      const shape = Array.isArray(data) ? 'Array' : Object.keys(data).join(', ');
      console.error(`Unexpected response shape: { ${shape} }`);
    }
    throw new Error("Unexpected response from server");
  }

  return {
    accessToken: access,
    refreshToken: refresh,
    user
  };
}

// ASSUMPTION - confirm with backend: forgot request
export interface ForgotPasswordRequest {
  email: string;
}

// ASSUMPTION - confirm with backend: reset request
export interface ResetPasswordRequest {
  token: string;
  password?: string;
}

// ASSUMPTION - confirm with backend: me response
export interface MeResponse {
  isPlatformAdmin: boolean;
  id: string;
  name: string;
  email: string;
  role?: string;
}

// ASSUMPTION - confirm with backend:
// 1. Does the project object include the user's role?
// 2. What does create return?
// 3. What are the delete semantics?
export function mapProject(data: any) {
  let role = 'Member';
  if (data?.role) {
    const r = String(data.role).toLowerCase();
    if (r === 'owner') role = 'Owner';
    else if (r === 'admin') role = 'Admin';
    else role = 'Member';
  }
  return {
    id: data?.id || data?._id,
    name: data?.name || '',
    description: data?.description || '',
    createdAt: data?.createdAt || data?.created_at || new Date().toISOString(),
    role
  };
}


// ASSUMPTION - confirm with backend:
// 1. What does the subscription object look like? Does it have planName, status, renewalDate?
export function mapSubscription(data: any) {
  return {
    planName: data?.planName || data?.plan?.name || 'Free Plan',
    status: data?.status || 'active',
    renewalDate: data?.renewalDate || data?.current_period_end || null,
    limits: data?.limits || {}
  };
}


export type DbStatus = 'provisioning' | 'running' | 'stopped' | 'starting' | 'stopping' | 'restarting' | 'deleting' | 'deleted' | 'failed' | 'unknown';
export function mapDatabaseStatus(status: string): DbStatus {
  const s = (status || '').toLowerCase();
  if (s === 'requested' || s === 'pending') return 'provisioning';
  if (s === 'error') return 'failed';
  if (['provisioning', 'running', 'stopped', 'starting', 'stopping', 'restarting', 'deleting', 'deleted', 'failed'].includes(s)) return s as DbStatus;
  return 'unknown';
}

// ASSUMPTION - confirm with backend
export function mapDatabase(data: any) {
  const engine = (data.type || data.engine || 'postgresql').toLowerCase();
  const defaultPort = engine.includes('post') ? 5432 : engine.includes('mongo') ? 27017 : 6333;
  return {
    id: data.id,
    projectId: data.projectId || data.project_id,
    name: data.name,
    engine,
    status: mapDatabaseStatus(data.status),
    statusUpdatedAt: data.statusUpdatedAt || data.status_updated_at || data.updatedAt || new Date().toISOString(),
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    cpu: data.cpuCores || data.cpu || 1,
    memoryMb: data.ramMb || data.memoryMb || data.memory_mb || 1024,
    storageGb: data.storageMb ? Math.round(data.storageMb / 1024) : (data.storageGb || data.storage_gb || 10),
    internalIp: data.internalIp || data.host || '',
    port: data.port || defaultPort,
    failureReason: data.failureReason || null,
  };
}


export type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';
export function mapHealthStatus(status: string): HealthStatus {
  const s = (status || '').toLowerCase();
  if (s === 'ok' || s === 'degraded' || s === 'down') return s as HealthStatus;
  return 'unknown';
}

export function mapUser(data: any): MeResponse {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    isPlatformAdmin: data.isPlatformAdmin || data.isAdmin || data.platformRole === "admin" || false // ASSUMPTION - confirm with backend
  };
}

// ASSUMPTION - confirm with backend: checkout request
export interface CheckoutRequest {
  planId: string;
  successUrl?: string;
  cancelUrl?: string;
}
