import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export type ClinicalPersistenceOperation = 'patient-write' | 'process-create';

// No conserva la excepcion original, su causa ni parametros del controlador SQL.
export function translateClinicalPersistenceError(
  error: unknown,
  operation?: ClinicalPersistenceOperation,
): HttpException {
  if (error instanceof HttpException) return error;
  if (error instanceof QueryFailedError) {
    const driver = error.driverError as {
      code?: unknown;
      constraint?: unknown;
    };
    if (operation === 'patient-write') {
      if (
        driver?.code === '23505' &&
        driver.constraint === 'UQ_patients_tipo_numero_documento'
      ) {
        return new ConflictException(
          'Ya existe un paciente registrado con ese tipo y número de documento.',
        );
      }
      if (
        driver?.code === '23503' &&
        driver.constraint === 'FK_patients_tipo_documento'
      ) {
        return new BadRequestException(
          'El tipo de documento indicado no es válido.',
        );
      }
    }
    if (
      operation === 'process-create' &&
      driver?.code === '23505' &&
      driver.constraint === 'IDX_proceso_activo_por_paciente'
    ) {
      return new ConflictException(
        'No se pudo crear el proceso porque existe un proceso activo.',
      );
    }
  }
  return new InternalServerErrorException('No se pudo completar la operación.');
}
