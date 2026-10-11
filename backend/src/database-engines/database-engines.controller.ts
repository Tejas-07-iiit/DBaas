import { Controller, Get, Param } from '@nestjs/common';
import { DatabaseEnginesService } from './database-engines.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('database-engines')
export class DatabaseEnginesController {
  constructor(private readonly enginesService: DatabaseEnginesService) {}

  @Public()
  @Get()
  listEngines() {
    return this.enginesService.listEngines();
  }

  @Public()
  @Get(':engine')
  getEngine(@Param('engine') engine: string) {
    return this.enginesService.getEngine(engine);
  }
}
