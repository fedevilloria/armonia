import { NotFoundException } from '@nestjs/common';
import { Repository, QueryFailedError } from 'typeorm';
import { TipoDocumento } from '../../../../profesionales/entities/tipo-documento.entity';
import { Patient } from '../../domain/entities/patient.entity';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { PatientRepository } from './patient.repository';
import { PatientOrmEntity } from '../persistence/patient.orm-entity';

describe('Patient repository access rules', () => {
  const builder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };
  const orm = {
    manager: { existsBy: jest.fn() },
    createQueryBuilder: () => builder,
    update: jest.fn(),
    findOne: jest.fn(),
  };
  const repository = new PatientRepository(
    orm as unknown as Repository<PatientOrmEntity>,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    builder.getOne.mockResolvedValue({ idPaciente: 1, telefono: 'old' });
    builder.getMany.mockResolvedValue([{ idPaciente: 1 }]);
    orm.update.mockResolvedValue({ affected: 1 });
    orm.findOne.mockResolvedValue({ idPaciente: 1, telefono: 'new' });
    orm.manager.existsBy.mockResolvedValue(true);
  });
  it('keeps historical ownership filters without requiring an active state', async () => {
    await repository.findAllByProfessional(42);
    const [listFilter, listParameters] = builder.where.mock.calls[0] as [
      string,
      object,
    ];
    expect(listFilter).toContain('proceso."idProfesional" = :idProfessional');
    expect(listFilter).not.toContain('idEstadoProcesoTerapeutico');
    expect(listParameters).toEqual({ idProfessional: 42 });
    await repository.update(1, { telefono: 'new' }, 42);
    const [updateFilter, updateParameters] = builder.andWhere.mock.calls[0] as [
      string,
      object,
    ];
    expect(updateFilter).toContain('proceso."idProfesional" = :idProfesional');
    expect(updateFilter).not.toContain('idEstadoProcesoTerapeutico');
    expect(updateParameters).toEqual({ idProfesional: 42 });
    expect(orm.update).toHaveBeenCalledWith(1, { telefono: 'new' });
  });
  it.each([4, 999])(
    'denies inaccessible patient %s without writing',
    async (id) => {
      builder.getOne.mockResolvedValue(null);
      await expect(
        repository.update(id, { telefono: 'new' }, 42),
      ).rejects.toMatchObject({
        message: 'Recurso no encontrado',
      });
      expect(orm.update).not.toHaveBeenCalled();
    },
  );
  it('does not reveal identifiers if the final read finds no patient', async () => {
    orm.findOne.mockResolvedValue(null);
    await expect(repository.update(1, { telefono: 'new' }, 42)).rejects.toEqual(
      new NotFoundException('Recurso no encontrado'),
    );
  });
  it('checks document references only when provided and after access', async () => {
    await repository.update(1, { telefono: 'new' }, 42);
    expect(orm.manager.existsBy).not.toHaveBeenCalled();
    await repository.update(1, { idTipoDocumento: 2 }, 42);
    expect(orm.manager.existsBy).toHaveBeenCalledWith(TipoDocumento, {
      idTipoDocumento: 2,
    });
    builder.getOne.mockResolvedValue(null);
    orm.manager.existsBy.mockClear();
    await expect(
      repository.update(4, { idTipoDocumento: 999 }, 42),
    ).rejects.toMatchObject({ message: 'Recurso no encontrado' });
    expect(orm.manager.existsBy).not.toHaveBeenCalled();
  });
  it('rejects an unknown document type before updating', async () => {
    orm.manager.existsBy.mockResolvedValue(false);
    await expect(
      repository.update(1, { idTipoDocumento: 999 }, 42),
    ).rejects.toMatchObject({ status: 400 });
    expect(orm.update).not.toHaveBeenCalled();
  });
  it('passes null emergency contacts to persistence without changing omitted fields', async () => {
    const update = {
      nombreContactoEmergencia: null,
      telefonoContactoEmergencia: null,
    } as unknown as Partial<Patient>;
    orm.findOne.mockResolvedValue({ idPaciente: 1, ...update });
    await expect(repository.update(1, update, 42)).resolves.toMatchObject(
      update,
    );
    expect(orm.update).toHaveBeenCalledWith(1, update);
    expect(orm.manager.existsBy).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    'persists and recovers pareja %s on update',
    async (pareja) => {
      orm.findOne.mockResolvedValue({ idPaciente: 1, pareja });
      await expect(repository.update(1, { pareja }, 42)).resolves.toMatchObject(
        { pareja },
      );
      expect(orm.update).toHaveBeenCalledWith(1, { pareja });
    },
  );
  it('does not reset pareja when it is omitted in an update', async () => {
    orm.findOne.mockResolvedValue({
      idPaciente: 1,
      telefono: 'new',
      pareja: true,
    });
    await expect(
      repository.update(1, { telefono: 'new' }, 42),
    ).resolves.toMatchObject({ pareja: true });
    expect(orm.update).toHaveBeenCalledWith(1, { telefono: 'new' });
  });
  it.each([
    ['23505', 'UQ_patients_tipo_numero_documento', 409],
    ['23503', 'FK_patients_tipo_documento', 400],
    ['23505', 'other_unique', 500],
  ])('translates update errors %s %s', async (code, constraint, status) => {
    orm.update.mockRejectedValue(
      new QueryFailedError(
        'SENTINEL_SQL',
        ['SENTINEL_DOCUMENT'],
        Object.assign(new Error('SENTINEL_EMAIL'), { code, constraint }),
      ),
    );
    await expect(
      repository.update(1, { telefono: 'new' }, 42),
    ).rejects.toMatchObject({ status });
  });
});

describe('Patient initial transaction', () => {
  const initial = new Patient({ idTipoDocumento: 1, nombre: 'Ficticio' });
  const manager = { existsBy: jest.fn(), create: jest.fn(), save: jest.fn() };
  const outsideExists = jest.fn();
  let rolledBack: boolean;
  let transactionFailure: unknown;
  const transaction = jest.fn(
    async (work: (value: typeof manager) => Promise<unknown>) => {
      try {
        return await work(manager);
      } catch (error) {
        rolledBack = true;
        transactionFailure = error;
        throw error;
      }
    },
  );
  const repository = new PatientRepository({
    manager: { transaction, existsBy: outsideExists },
  } as unknown as Repository<PatientOrmEntity>);
  beforeEach(() => {
    jest.clearAllMocks();
    rolledBack = false;
    transactionFailure = undefined;
    manager.existsBy.mockResolvedValue(true);
    manager.create.mockImplementation((_entity: unknown, data: object) => data);
    manager.save.mockImplementation((entity: unknown, data: object) =>
      Promise.resolve(
        entity === PatientOrmEntity ? { ...data, idPaciente: 1 } : data,
      ),
    );
  });
  it('checks the catalog and saves both entities using the same transaction manager', async () => {
    await repository.create(initial, 42);
    expect(manager.existsBy).toHaveBeenCalledWith(TipoDocumento, {
      idTipoDocumento: 1,
    });
    expect(outsideExists).not.toHaveBeenCalled();
    expect(manager.save).toHaveBeenNthCalledWith(1, PatientOrmEntity, initial);
    expect(manager.save).toHaveBeenNthCalledWith(
      2,
      TherapeuticProcessOrmEntity,
      expect.objectContaining({
        idProfesional: 42,
        idEstadoProcesoTerapeutico: 1,
      }),
    );
    expect(manager.save).toHaveBeenCalledTimes(2);
  });
  it.each([true, false])(
    'preserves pareja %s through initial persistence mapping',
    async (pareja) => {
      const patient = new Patient({
        idTipoDocumento: 1,
        nombre: 'Ficticio',
        pareja,
      });
      await expect(repository.create(patient, 42)).resolves.toMatchObject({
        pareja,
      });
      expect(manager.save).toHaveBeenNthCalledWith(
        1,
        PatientOrmEntity,
        patient,
      );
      expect(manager.save).toHaveBeenCalledTimes(2);
    },
  );
  it('rejects an unknown catalog entry before either save', async () => {
    manager.existsBy.mockResolvedValue(false);
    await expect(repository.create(initial, 42)).rejects.toMatchObject({
      status: 400,
    });
    expect(manager.save).not.toHaveBeenCalled();
    expect(rolledBack).toBe(true);
  });
  it('translates only after the simulated transaction has rejected', async () => {
    const failure = new QueryFailedError(
      'SENTINEL_SQL',
      [],
      Object.assign(new Error('SENTINEL_DOCUMENT'), {
        code: '23505',
        constraint: 'UQ_patients_tipo_numero_documento',
      }),
    );
    manager.save.mockRejectedValueOnce(failure);
    await expect(repository.create(initial, 42)).rejects.toMatchObject({
      status: 409,
    });
    expect(rolledBack).toBe(true);
    expect(transactionFailure).toBe(failure);
  });
  it('propagates a safe error after a failed initial process save', async () => {
    manager.save
      .mockResolvedValueOnce({ ...initial, idPaciente: 1 })
      .mockRejectedValueOnce(new Error('SENTINEL_CLINICAL_NOTE'));
    await expect(repository.create(initial, 42)).rejects.toMatchObject({
      status: 500,
      message: 'No se pudo completar la operación.',
    });
    expect(rolledBack).toBe(true);
  });
});
