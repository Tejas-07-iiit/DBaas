import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || message;
        error = (resp.error as string) || error;
      }
      error = HttpStatus[status] || error;
    } else if (exception instanceof Error) {
      // Check for Prisma-specific errors
      if (exception.constructor.name === 'PrismaClientKnownRequestError') {
        status = HttpStatus.CONFLICT;
        message = 'Database constraint violation';
        error = 'Conflict';
      } else if (exception.constructor.name === 'PrismaClientValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid data provided';
        error = 'Bad Request';
      }
    }

    const correlationId = (request as any).correlationId;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the full error (safe — server logs only)
    this.logger.error(
      {
        correlationId,
        statusCode: status,
        path: request.url,
        method: request.method,
        message: exception instanceof Error ? exception.message : 'Unknown error',
        ...(isProduction ? {} : { stack: exception instanceof Error ? exception.stack : undefined }),
      },
      exception instanceof Error ? exception.stack : undefined,
    );

    // Return safe response to client
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId ? { correlationId } : {}),
    });
  }
}
