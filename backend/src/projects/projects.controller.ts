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
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createProjectSchema, CreateProjectDto } from './dto/create-project.dto';
import { updateProjectSchema, UpdateProjectDto } from './dto/update-project.dto';
import {
  projectQuerySchema,
  ProjectQueryDto,
  projectIdParamSchema,
  ProjectIdParamDto,
} from './dto/project-query.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Body(new ZodValidationPipe(createProjectSchema)) dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(firebaseUser, dto);
  }

  @Get()
  async listUserProjects(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Query(new ZodValidationPipe(projectQuerySchema)) query: ProjectQueryDto,
  ) {
    return this.projectsService.listUserProjects(firebaseUser, query);
  }

  @Get(':projectId')
  async getProject(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(projectIdParamSchema)) params: ProjectIdParamDto,
  ) {
    return this.projectsService.getProject(firebaseUser, params.projectId);
  }

  @Patch(':projectId')
  async updateProject(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(projectIdParamSchema)) params: ProjectIdParamDto,
    @Body(new ZodValidationPipe(updateProjectSchema)) dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(firebaseUser, params.projectId, dto);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(projectIdParamSchema)) params: ProjectIdParamDto,
  ) {
    await this.projectsService.deleteProject(firebaseUser, params.projectId);
  }
}
