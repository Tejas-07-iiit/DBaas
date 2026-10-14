import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { INFRASTRUCTURE_PROVIDER } from './provider.interface';
import { MockInfrastructureProvider } from './providers/mock-infrastructure.provider';
import { LocalDevelopmentProvider } from './providers/local-development.provider';
import { CentralManagementProvider } from './providers/central-management.provider';
import { ReconciliationService } from './reconciliation/reconciliation.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    MockInfrastructureProvider,
    LocalDevelopmentProvider,
    CentralManagementProvider,
    {
      provide: INFRASTRUCTURE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        mockProvider: MockInfrastructureProvider,
        localProvider: LocalDevelopmentProvider,
        centralMgmtProvider: CentralManagementProvider,
      ) => {
        const providerType =
          configService.get<string>('INFRASTRUCTURE_PROVIDER') ||
          process.env.INFRASTRUCTURE_PROVIDER ||
          'mock';

        switch (providerType.toLowerCase()) {
          case 'central-management':
            return centralMgmtProvider;
          case 'local':
            return localProvider;
          case 'mock':
          default:
            return mockProvider;
        }
      },
      inject: [
        ConfigService,
        MockInfrastructureProvider,
        LocalDevelopmentProvider,
        CentralManagementProvider,
      ],
    },
    ReconciliationService,
  ],
  exports: [
    INFRASTRUCTURE_PROVIDER,
    MockInfrastructureProvider,
    LocalDevelopmentProvider,
    CentralManagementProvider,
    ReconciliationService,
  ],
})
export class InfrastructureModule {}
