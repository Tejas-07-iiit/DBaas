# M-DBaaS — Host-Side Provisioning API (Phase 2)

This service runs directly on the Ubuntu host (`10.50.0.2`) outside of Docker, providing a restricted, authenticated control plane interface for hypervisor operations via libvirt.

## Architecture & Security Contracts

1. **Private Network Binding**: Exposes HTTP service only on the host bridge interface (`10.50.0.2:8081`).
2. **Client IP Restriction**: Restricts incoming requests via `IpAllowlistGuard` to the Management VM (`10.50.0.7`) and local test addresses.
3. **Fail-Closed Authentication**: All endpoints require `Authorization: Bearer <HOST_API_TOKEN>`. The application will refuse to start if `HOST_API_TOKEN` is unset.
4. **Command Injection Prevention**: Uses `child_process.execFile` with fixed executable `/usr/bin/virsh` and strict argument arrays (no shell interpretation).
5. **Phase 2 Scope**: VM provisioning runs in **dry-run mode only**; VM deletion is disabled (`501 Not Implemented`).

---

## Host Resource Boundaries

Based on the Ubuntu host hardware (AMD Ryzen 5 7530U, 6C/12T, DDR4 memory):

| Resource | Minimum | Maximum | Default Format / Network |
|---|---|---|---|
| **CPU** | 1 vCPU | 8 vCPUs | - |
| **RAM** | 256 MB | 32,768 MB (32 GB) | - |
| **Disk** | 5 GB | 500 GB | `qcow2` |
| **Network** | - | - | `10.50.0.0/24` on bridge `virbr0` |

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Status Code | Description |
|---|---|---|---|
| `GET` | `/health` | `200` | Liveness health check |
| `GET` | `/host/status` | `200` | Read-only hypervisor connectivity and host limits |
| `GET` | `/v1/vms` | `200` | List all libvirt VMs (ID, Name, State) |
| `GET` | `/v1/vms/:id` | `200` / `404` | Retrieve detailed VM status |
| `POST` | `/v1/vms` | `200` | **Dry-run** provisioning plan validation |
| `DELETE` | `/v1/vms/:id` | `501` | Unsupported in Phase 2 (safe refusal) |

---

## Installation & Deployment on Ubuntu Host

```bash
cd /home/tejas/root/dbaas-host-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Generate secret token
SECRET_TOKEN=$(openssl rand -hex 32)
echo "HOST_API_TOKEN=${SECRET_TOKEN}" >> .env

# Build TypeScript
npm run build

# Start service on 10.50.0.2:8081
npm run start:prod
```

---

## Calling from the Management VM (`10.50.0.7`)

From the management VM, invoke the host API over the private bridge:

```bash
# 1. Health check
curl -s http://10.50.0.2:8081/health \
  -H "Authorization: Bearer $HOST_API_TOKEN"

# 2. Check host and libvirt status
curl -s http://10.50.0.2:8081/host/status \
  -H "Authorization: Bearer $HOST_API_TOKEN"

# 3. List VMs
curl -s http://10.50.0.2:8081/v1/vms \
  -H "Authorization: Bearer $HOST_API_TOKEN"

# 4. Request Dry-Run VM Plan
curl -s -X POST http://10.50.0.2:8081/v1/vms \
  -H "Authorization: Bearer $HOST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"postgres-test","cpu":2,"memoryMb":2048,"diskGb":20}'
```
