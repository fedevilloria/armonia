import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import {
  AppointmentException,
  type AppointmentErrorCode,
} from '../../domain/exceptions/appointment.exception';
const statusCodes: Record<AppointmentErrorCode, number> = {
  invalid: 400,
  'patient-not-found': 404,
  occupied: 409,
  ambiguous: 409,
  'invalid-schedule': 500,
  persistence: 503,
};
@Catch(AppointmentException)
export class AppointmentExceptionFilter implements ExceptionFilter {
  catch(error: AppointmentException, host: ArgumentsHost): void {
    const statusCode = statusCodes[error.code];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, message: error.message });
  }
}
