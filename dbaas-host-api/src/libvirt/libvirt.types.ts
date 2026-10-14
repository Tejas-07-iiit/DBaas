export interface VmInfo {
  id: string;
  name: string;
  state: string;
}

export interface VmDetails {
  id: string;
  name: string;
  uuid?: string;
  state: string;
  osType?: string;
  cpu?: number;
  maxMemoryKb?: number;
  usedMemoryKb?: number;
}

export interface LibvirtStatus {
  connected: boolean;
  hypervisor?: string;
  version?: string;
  error?: string;
}

export interface CreateDomainOptions {
  ipAddress?: string;
  gateway?: string;
  adminPassword?: string;
  dbEngine?: string;
  dbPassword?: string;
}
