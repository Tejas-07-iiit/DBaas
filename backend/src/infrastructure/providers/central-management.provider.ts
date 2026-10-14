import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseType } from '@prisma/client';
import {
  IInfrastructureProvider,
  ProvisionVmRequest,
  ProvisionVmResult,
  VmStatusResult,
  VmOperationResult,
  VmHealthCheckResult,
  VmConnectionMetadata,
  VmReconciliationResult,
} from '../provider.interface';

@Injectable()
export class CentralManagementProvider implements IInfrastructureProvider {
  public readonly name = 'central-management';
  private readonly logger = new Logger(CentralManagementProvider.name);

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs = 15000;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('CENTRAL_MANAGEMENT_URL') ||
      process.env.CENTRAL_MANAGEMENT_URL ||
      'http://10.50.0.2:8443';
    this.apiKey =
      this.configService.get<string>('CENTRAL_MANAGEMENT_API_KEY') ||
      process.env.CENTRAL_MANAGEMENT_API_KEY ||
      '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        this.logger.error(
          `Central Management VM request failed [${response.status}]: ${errorBody}`,
        );
        throw new BadGatewayException(
          `Infrastructure provider returned error: ${response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new BadGatewayException(
          'Timeout connecting to Central Management VM over private network',
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async provisionDatabaseVm(
    request: ProvisionVmRequest,
  ): Promise<ProvisionVmResult> {
    this.logger.log(
      `Dispatching provision request to Central Management VM for database ${request.databaseId}`,
    );

    return this.request<ProvisionVmResult>('/api/v1/vms/provision', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDatabaseVmStatus(vmId: string): Promise<VmStatusResult> {
    return this.request<VmStatusResult>(`/api/v1/vms/${vmId}/status`, {
      method: 'GET',
    });
  }

  async startDatabaseVm(vmId: string): Promise<VmOperationResult> {
    return this.request<VmOperationResult>(`/api/v1/vms/${vmId}/start`, {
      method: 'POST',
    });
  }

  async stopDatabaseVm(vmId: string): Promise<VmOperationResult> {
    return this.request<VmOperationResult>(`/api/v1/vms/${vmId}/stop`, {
      method: 'POST',
    });
  }

  async restartDatabaseVm(vmId: string): Promise<VmOperationResult> {
    return this.request<VmOperationResult>(`/api/v1/vms/${vmId}/restart`, {
      method: 'POST',
    });
  }

  async deleteDatabaseVm(vmId: string): Promise<VmOperationResult> {
    return this.request<VmOperationResult>(`/api/v1/vms/${vmId}`, {
      method: 'DELETE',
    });
  }

  async checkDatabaseHealth(vmId: string): Promise<VmHealthCheckResult> {
    return this.request<VmHealthCheckResult>(`/api/v1/vms/${vmId}/health`, {
      method: 'GET',
    });
  }

  async getConnectionMetadata(
    vmId: string,
    engineType: DatabaseType,
  ): Promise<VmConnectionMetadata> {
    return this.request<VmConnectionMetadata>(
      `/api/v1/vms/${vmId}/connection?engine=${engineType}`,
      { method: 'GET' },
    );
  }

  async reconcileInfrastructureState(): Promise<VmReconciliationResult> {
    return this.request<VmReconciliationResult>('/api/v1/vms/reconcile', {
      method: 'GET',
    });
  }
}
