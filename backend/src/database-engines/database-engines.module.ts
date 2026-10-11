import { Module } from '@nestjs/common';
import { DatabaseEnginesController } from './database-engines.controller';
import { DatabaseEnginesService } from './database-engines.service';

@Module({
  controllers: [DatabaseEnginesController],
  providers: [DatabaseEnginesService],
  exports: [DatabaseEnginesService],
})
export class DatabaseEnginesModule {}
