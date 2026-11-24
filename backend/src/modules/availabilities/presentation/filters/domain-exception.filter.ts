import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';

import { DomainException } from '../../domain/exceptions/domain.exception';

/**
 * Convierte las excepciones producidas por reglas del dominio
 * en respuestas HTTP apropiadas para la API.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse();

    const badRequestException = new BadRequestException(
      exception.message,
    );

    const status = badRequestException.getStatus();
    const body = badRequestException.getResponse();

    response.status(status).json(body);
  }
}