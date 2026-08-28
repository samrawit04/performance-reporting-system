import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter.
 * Ensures all errors return a consistent JSON format.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || message;
        error = (resp.error as string) || error;
        details = resp.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // In production, don't leak internal error details
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
