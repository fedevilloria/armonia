import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { translateClinicalPersistenceError } from '../../database/clinical-persistence-errors';

// Barrera HTTP exclusiva de los controladores clinicos; no registra errores crudos.
@Catch()
export class ClinicalExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const safeError = translateClinicalPersistenceError(error);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(safeError.getStatus())
      .json(safeError.getResponse());
  }
}
