# Infrastructure Module

This module will contain infrastructure provisioning logic in future phases.

## Planned Components (Phase 2+)

- **InfrastructureProvider** — Abstract interface for infrastructure backends
- **LibvirtProvider** — KVM/QEMU VM provisioning via libvirt
- **KubernetesProvider** — K8s-based database workload orchestration
- **DBaaSRouterService** — DBaaS Router VM integration
- **WireGuardService** — VPN tunnel management
- **NetworkManager** — Private network (10.50.0.0/24) management

## Architecture Notes

- All database provisioning will be handled via BullMQ async jobs
- Infrastructure providers will implement a common interface for dependency inversion
- Customer databases run on isolated private network, accessible only through NestJS
