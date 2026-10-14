import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { HOST_LIMITS, VM_NAME_REGEX } from '../../config/limits.constants';

export class CreateVmDto {
  @IsString()
  @MinLength(1)
  @MaxLength(63)
  @Matches(VM_NAME_REGEX, {
    message:
      'name must start with a lowercase letter, contain only lowercase alphanumeric characters and hyphens, and not end with a hyphen (1-63 chars).',
  })
  name!: string;

  @IsInt()
  @Min(HOST_LIMITS.MIN_CPU, {
    message: `cpu must be at least ${HOST_LIMITS.MIN_CPU}`,
  })
  @Max(HOST_LIMITS.MAX_CPU, {
    message: `cpu must not exceed host maximum of ${HOST_LIMITS.MAX_CPU}`,
  })
  cpu!: number;

  @IsInt()
  @Min(HOST_LIMITS.MIN_MEMORY_MB, {
    message: `memoryMb must be at least ${HOST_LIMITS.MIN_MEMORY_MB} MB`,
  })
  @Max(HOST_LIMITS.MAX_MEMORY_MB, {
    message: `memoryMb must not exceed host maximum of ${HOST_LIMITS.MAX_MEMORY_MB} MB`,
  })
  memoryMb!: number;

  @IsInt()
  @Min(HOST_LIMITS.MIN_DISK_GB, {
    message: `diskGb must be at least ${HOST_LIMITS.MIN_DISK_GB} GB`,
  })
  @Max(HOST_LIMITS.MAX_DISK_GB, {
    message: `diskGb must not exceed host maximum of ${HOST_LIMITS.MAX_DISK_GB} GB`,
  })
  diskGb!: number;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  internalIp?: string;

  @IsOptional()
  @IsString()
  gateway?: string;

  @IsOptional()
  @IsString()
  adminPassword?: string;

  @IsOptional()
  @IsString()
  dbEngine?: string;

  @IsOptional()
  @IsString()
  dbPassword?: string;
}
