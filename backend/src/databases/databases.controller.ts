import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createDatabaseSchema,
  CreateDatabaseDto,
} from './dto/create-database.dto';
import {
  updateDatabaseSchema,
  UpdateDatabaseDto,
} from './dto/update-database.dto';
import {
  databaseQuerySchema,
  DatabaseQueryDto,
  databaseParamsSchema,
  DatabaseParamsDto,
  databaseDetailParamsSchema,
  DatabaseDetailParamsDto,
} from './dto/database-query.dto';

@Controller('projects/:projectId/databases')
export class DatabasesController {
  constructor(private readonly databasesService: DatabasesService) {}

  @Post()
  async createDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseParamsSchema))
    params: DatabaseParamsDto,
    @Body(new ZodValidationPipe(createDatabaseSchema))
    dto: CreateDatabaseDto,
  ) {
    return this.databasesService.createDatabase(
      firebaseUser,
      params.projectId,
      dto,
    );
  }

  @Get()
  async listDatabases(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseParamsSchema))
    params: DatabaseParamsDto,
    @Query(new ZodValidationPipe(databaseQuerySchema))
    query: DatabaseQueryDto,
  ) {
    return this.databasesService.listDatabases(
      firebaseUser,
      params.projectId,
      query,
    );
  }

  @Get(':databaseId')
  async getDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.getDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Patch(':databaseId')
  async updateDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
    @Body(new ZodValidationPipe(updateDatabaseSchema))
    dto: UpdateDatabaseDto,
  ) {
    return this.databasesService.updateDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
      dto,
    );
  }

  @Delete(':databaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    await this.databasesService.deleteDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Get(':databaseId/events')
  async listEvents(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
    @Query(new ZodValidationPipe(databaseQuerySchema))
    query: DatabaseQueryDto,
  ) {
    return this.databasesService.listEvents(
      firebaseUser,
      params.projectId,
      params.databaseId,
      query,
    );
  }
}
