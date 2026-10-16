import { DataSource, EntityManager } from 'typeorm';
import {
  TypeOrmAppointmentTransaction,
  appointmentExclusionConstraint,
} from './typeorm-appointment.transaction';
import { UnconfiguredPatientAccessFactory } from './patient-access.factory';
import { AppointmentException } from '../../domain/exceptions/appointment.exception';
import { TypeOrmAppointmentRepository } from '../repositories/typeorm-appointment.repository';

describe('TypeOrmAppointmentTransaction', () => {
  const builder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const manager = {
    getRepository: jest
      .fn()
      .mockReturnValue({ createQueryBuilder: () => builder }),
  };
  const dataSource = { transaction: jest.fn() };
  const factory = new UnconfiguredPatientAccessFactory();
  const adapter = new TypeOrmAppointmentTransaction(
    dataSource as unknown as DataSource,
    factory,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(
      (_level: string, work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    );
  });
  it('locks availability and binds repositories to the transaction manager', async () => {
    await adapter.run(42, '2026-11-09', async (context) => {
      expect(context.appointments).toBeInstanceOf(TypeOrmAppointmentRepository);
      expect(await context.patientAccess.canAssign(25, 42)).toBe(false);
    });
    expect(dataSource.transaction).toHaveBeenCalledWith(
      'READ COMMITTED',
      expect.any(Function),
    );
    expect(builder.setLock).toHaveBeenCalledWith('pessimistic_read');
    expect(builder.where).toHaveBeenCalledWith(expect.any(String), {
      professionalId: 42,
    });
    expect(builder.orderBy).toHaveBeenCalledWith('availability.id', 'ASC');
    expect(manager.getRepository).toHaveBeenCalledTimes(3);
  });
  it('keeps real patient access closed', async () => {
    expect(
      await factory
        .create(manager as unknown as EntityManager)
        .canAssign(25, 42),
    ).toBe(false);
  });
  it('throws domain errors out of the transaction callback for rollback', async () => {
    const error = new AppointmentException(
      'patient-not-found',
      'Paciente no encontrado',
    );
    await expect(
      adapter.run(42, '2026-11-09', () => Promise.reject(error)),
    ).rejects.toBe(error);
  });
  it('translates the named exclusion violation after transaction rollback', async () => {
    dataSource.transaction.mockRejectedValue({
      driverError: {
        code: '23P01',
        constraint: appointmentExclusionConstraint,
        detail: 'private SQL data',
      },
    });
    await expect(
      adapter.run(42, '2026-11-09', () => Promise.resolve()),
    ).rejects.toMatchObject({ code: 'occupied' });
  });
  it.each([
    { code: '23P01', constraint: 'another_constraint' },
    { code: '23503', detail: 'private patient' },
    { message: 'secret SQL' },
  ])('sanitizes persistence failures: %p', async (failure) => {
    dataSource.transaction.mockRejectedValue(failure);
    await expect(
      adapter.run(42, '2026-11-09', () => Promise.resolve()),
    ).rejects.toMatchObject({
      code: 'persistence',
      message: 'No se pudo registrar el turno. Intente nuevamente',
    });
  });
});
