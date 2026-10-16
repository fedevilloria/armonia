import { Repository } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentOrmEntity } from '../persistence/appointment.orm-entity';
import { TypeOrmAppointmentRepository } from './typeorm-appointment.repository';

describe('TypeOrmAppointmentRepository', () => {
  const row = {
    id: 3,
    professionalId: 42,
    patientId: 9,
    date: '2026-10-19',
    startTime: '09:00:00',
    endTime: '09:30:00',
    status: AppointmentStatus.RESERVED,
    createdAt: new Date('2026-10-18T12:00:00Z'),
    updatedAt: new Date('2026-10-18T12:00:00Z'),
    createdByUserId: 7,
  };
  const repository = { find: jest.fn(), save: jest.fn() };
  const adapter = new TypeOrmAppointmentRepository(
    repository as unknown as Repository<AppointmentOrmEntity>,
  );
  beforeEach(() => jest.clearAllMocks());
  it('filters by owner, date and statuses and maps to the domain', async () => {
    repository.find.mockResolvedValue([row]);
    const result = await adapter.findByProfessionalAndDate(
      42,
      new Date('2026-10-19T00:00:00.000Z'),
      [AppointmentStatus.RESERVED],
    );
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          professionalId: 42,
          date: '2026-10-19',
          status: expect.anything(),
        }),
      }),
    );
    expect(result[0]).toBeInstanceOf(Appointment);
    expect(result[0].startTime).toBe('09:00');
    expect(result[0].createdByUserId).toBe(7);
    expect(result[0].createdAt).toEqual(row.createdAt);
    expect(result[0].updatedAt).toEqual(row.updatedAt);
    expect(result[0].date.getUTCDate()).toBe(19);
  });
  it.each([null, 3])(
    'preserves identifiers and values on save (%s)',
    async (id) => {
      repository.save.mockResolvedValue(row);
      const result = await adapter.save(
        new Appointment(
          id,
          42,
          9,
          new Date('2026-10-19T00:00:00.000Z'),
          '09:00',
          '09:30',
          AppointmentStatus.RESERVED,
        ),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalId: 42,
          patientId: 9,
          date: '2026-10-19',
        }),
      );
      const saved = repository.save.mock.calls[0][0];
      expect(saved).toBeInstanceOf(AppointmentOrmEntity);
      expect(saved.id).toBe(id === null ? undefined : id);
      expect(result.id).toBe(3);
    },
  );
});
