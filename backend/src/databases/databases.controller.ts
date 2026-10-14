import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
  operationParamsSchema,
  OperationParamsDto,
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

  @Put(':databaseId')
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

  @Post(':databaseId/start')
  async startDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.startDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Post(':databaseId/stop')
  async stopDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.stopDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Post(':databaseId/restart')
  async restartDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.restartDatabase(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Get(':databaseId/connection')
  async getConnectionDetails(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.getConnectionDetails(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Post(':databaseId/credentials/rotate')
  async rotateCredentials(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.rotateCredentials(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Get(':databaseId/explorer')
  async getExplorerOverview(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.getExplorerOverview(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Get(':databaseId/explorer/documents')
  async getCollectionDocuments(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
    @Query('db') dbName: string,
    @Query('collection') collectionName: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('search') search?: string,
  ) {
    return this.databasesService.getCollectionDocuments(
      firebaseUser,
      params.projectId,
      params.databaseId,
      dbName,
      collectionName,
      limit,
      skip,
      search,
    );
  }

  @Post(':databaseId/explorer/documents')
  async insertCollectionDocument(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
    @Body() body: { db: string; collection: string; document: any },
  ) {
    return this.databasesService.insertCollectionDocument(
      firebaseUser,
      params.projectId,
      params.databaseId,
      body.db,
      body.collection,
      body.document,
    );
  }

  @Get(':databaseId/database-users')
  async getDatabaseUsers(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.getDatabaseUsers(
      firebaseUser,
      params.projectId,
      params.databaseId,
    );
  }

  @Get(':databaseId/operations')
  async listOperations(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
    @Query(new ZodValidationPipe(databaseQuerySchema))
    query: DatabaseQueryDto,
  ) {
    return this.databasesService.listOperations(
      firebaseUser,
      params.projectId,
      params.databaseId,
      query,
    );
  }

  @Get(':databaseId/operations/:operationId')
  async getOperation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(operationParamsSchema))
    params: OperationParamsDto,
  ) {
    return this.databasesService.getOperation(
      firebaseUser,
      params.projectId,
      params.databaseId,
      params.operationId,
    );
  }

  @Post(':databaseId/reconcile')
  async reconcileDatabase(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(databaseDetailParamsSchema))
    params: DatabaseDetailParamsDto,
  ) {
    return this.databasesService.reconcileDatabase(
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
