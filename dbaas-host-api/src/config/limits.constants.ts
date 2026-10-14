export const HOST_LIMITS = {
  MIN_CPU: 1,
  MAX_CPU: 8,
  MIN_MEMORY_MB: 256,
  MAX_MEMORY_MB: 32768, // 32 GB
  MIN_DISK_GB: 5,
  MAX_DISK_GB: 500,
  DEFAULT_NETWORK: '10.50.0.0/24',
  DEFAULT_BRIDGE: 'virbr0',
  DEFAULT_DISK_FORMAT: 'qcow2',
} as const;

export const VM_NAME_REGEX = /^[a-z][a-z0-9-]{0,61}[a-z0-9]$|^[a-z]$/;
