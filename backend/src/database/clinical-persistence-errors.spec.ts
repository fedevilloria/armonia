import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { translateClinicalPersistenceError } from './clinical-persistence-errors';

describe('Clinical persistence error translation', () => {
  it.each([
    ['23505', 'UQ_patients_tipo_numero_documento', 'patient-write', 409],
    ['23503', 'FK_patients_tipo_documento', 'patient-write', 400],
    ['23505', 'IDX_proceso_activo_por_paciente', 'process-create', 409],
    ['23503', 'IDX_proceso_activo_por_paciente', 'process-create', 500],
    ['23505', 'other_unique', 'process-create', 500],
    ['23505', 'IDX_proceso_activo_por_paciente_extra', 'process-create', 500],
    ['23505', 'IDX_proceso_activo_por_paciente', 'patient-write', 500],
    ['23505', 'UQ_patients_tipo_numero_documento', 'process-create', 500],
    ['23503', 'FK_proceso_profesional', 'patient-write', 500],
    ['23505', 'FK_patients_tipo_documento', 'patient-write', 500],
  ] as const)(
    'matches %s + %s only in %s',
    (code, constraint, operation, status) => {
      const failure = new QueryFailedError(
        'SENTINEL_SQL',
        ['SENTINEL_DOCUMENT'],
        Object.assign(new Error('SENTINEL_EMAIL'), {
          code,
          constraint,
          detail: 'SENTINEL_CLINICAL_NOTE',
        }),
      );
      const safe = translateClinicalPersistenceError(failure, operation);
      expect(safe.getStatus()).toBe(status);
      expect(safe.cause).toBeUndefined();
      expect(JSON.stringify(safe)).not.toContain('SENTINEL');
      expect(JSON.stringify(safe.getResponse())).not.toContain('SENTINEL');
    },
  );
  it.each([
    new NotFoundException('Recurso no encontrado'),
    new BadRequestException('Entrada inválida'),
  ])('preserves known business exceptions', (error) => {
    expect(translateClinicalPersistenceError(error, 'patient-write')).toBe(
      error,
    );
  });
  it('does not classify by driver message or detail', () => {
    const failure = new QueryFailedError(
      'SENTINEL_SQL',
      [],
      Object.assign(new Error('23505 IDX_proceso_activo_por_paciente'), {
        detail: '23505 IDX_proceso_activo_por_paciente',
      }),
    );
    expect(
      translateClinicalPersistenceError(failure, 'process-create').getStatus(),
    ).toBe(500);
  });
  it.each([
    new Error('SENTINEL_EMAIL'),
    null,
    undefined,
    { code: '23505', constraint: 'IDX_proceso_activo_por_paciente' },
  ])('fails safely for unexpected exceptions', (error) => {
    expect(translateClinicalPersistenceError(error).getResponse()).toEqual({
      statusCode: 500,
      message: 'No se pudo completar la operación.',
      error: 'Internal Server Error',
    });
  });
});
