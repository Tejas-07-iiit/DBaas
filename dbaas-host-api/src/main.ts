import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const token = process.env.HOST_API_TOKEN || process.env.API_TOKEN;
  if (!token) {
    console.error(
      'FATAL: Refusing to start host provisioning service. HOST_API_TOKEN environment variable is not configured.',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter to avoid stack trace leaks
  app.useGlobalFilters(new HttpExceptionFilter());

  // Restrict payload size
  app.use(json({ limit: '1mb' }));

  const bindHost = process.env.BIND_HOST || '10.50.0.2';
  const port = parseInt(process.env.PORT || '8081', 10);

  await app.listen(port, bindHost);
  console.log(`dbaas-host-api listening on ${bindHost}:${port}`);
}

bootstrap();
