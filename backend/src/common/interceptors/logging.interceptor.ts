import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const correlationId = (request as any).correlationId || 'N/A';
    const now = Date.now();

    this.logger.log(`→ ${method} ${url} [${correlationId}]`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - now;
          this.logger.log(
            `← ${method} ${url} ${response.statusCode} ${duration}ms [${correlationId}]`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          const status = error?.status || error?.statusCode || 500;
          this.logger.warn(
            `← ${method} ${url} ${status} ${duration}ms [${correlationId}]`,
          );
        },
      }),
    );
  }
}
