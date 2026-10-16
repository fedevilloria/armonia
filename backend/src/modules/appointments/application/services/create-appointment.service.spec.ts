import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentException } from '../../domain/exceptions/appointment.exception';
import { Availability } from '../../../availabilities/domain/entities/availability.entity';
import { DayOfWeek } from '../../../availabilities/domain/enums/day-of-week.enum';
import { CreateAppointmentService } from './create-appointment.service';
import type { AppointmentTransactionContext } from '../ports/appointment-transaction';
const date = (value = '2026-11-09') => new Date(value + 'T00:00:00.000Z');
const block = (changes: Partial<Availability> = {}) =>
  Object.assign(
    new Availability(
      1,
      42,
      DayOfWeek.MONDAY,
      '09:00',
      '11:00',
      30,
      date(),
      date(),
    ),
    changes,
  );
const occupied = (
  status = AppointmentStatus.RESERVED,
  start = '09:30',
  end = '10:00',
) => new Appointment(1, 42, 25, date(), start, end, status);
describe('CreateAppointmentService', () => {
  const context = {
    appointments: { findByProfessionalAndDate: jest.fn(), save: jest.fn() },
    availabilities: { findByProfessionalAndDay: jest.fn(), save: jest.fn() },
    patientAccess: { canAssign: jest.fn() },
  };
  const commits = jest.fn(),
    rollbacks = jest.fn();
  const transaction = {
    async run<T>(
      _professionalId: number,
      _date: string,
      work: (context: AppointmentTransactionContext) => Promise<T>,
    ): Promise<T> {
      try {
        const result = await work(context);
        commits();
        return result;
      } catch (error) {
        rollbacks();
        throw error;
      }
    },
  };
  const runSpy = jest.spyOn(transaction, 'run');
  const clock = { now: jest.fn() };
  const service = new CreateAppointmentService(transaction, clock);
  const input = { patientId: 25, date: '2026-11-09', startTime: '09:30' };
  beforeEach(() => {
    jest.clearAllMocks();
    clock.now.mockReturnValue(new Date('2026-11-09T12:00:00Z'));
    context.patientAccess.canAssign.mockResolvedValue(true);
    context.availabilities.findByProfessionalAndDay.mockResolvedValue([
      block(),
    ]);
    context.appointments.findByProfessionalAndDate.mockResolvedValue([]);
    context.appointments.save.mockImplementation((appointment: Appointment) =>
      Promise.resolve(
        new Appointment(
          77,
          appointment.professionalId,
          appointment.patientId,
          appointment.date,
          appointment.startTime,
          appointment.endTime,
          appointment.status,
          new Date('2026-11-09T12:00:00Z'),
          new Date('2026-11-09T12:00:00Z'),
          appointment.createdByUserId,
        ),
      ),
    );
  });
  it('creates RESERVED with derived end and creator from the authenticated user', async () => {
    expect(await service.execute(42, 7, input)).toEqual({
      id: 77,
      patientId: 25,
      date: '2026-11-09',
      startTime: '09:30',
      endTime: '10:00',
      status: 'RESERVED',
    });
    expect(context.patientAccess.canAssign).toHaveBeenCalledWith(25, 42);
    expect(context.appointments.save).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalId: 42,
        createdByUserId: 7,
        status: AppointmentStatus.RESERVED,
      }),
    );
    expect(commits).toHaveBeenCalledTimes(1);
  });
  it.each(['missing', 'foreign'])(
    'rejects %s patients with the same generic error',
    async () => {
      context.patientAccess.canAssign.mockResolvedValue(false);
      await expect(service.execute(42, 7, input)).rejects.toMatchObject({
        code: 'patient-not-found',
        message: 'Paciente no encontrado o no disponible',
      });
      expect(context.appointments.save).not.toHaveBeenCalled();
      expect(rollbacks).toHaveBeenCalled();
    },
  );
  it.each([
    '2026-11-09T12:30:00Z',
    '2026-11-09T12:30:00.001Z',
    '2026-11-10T00:00:00Z',
  ])('rejects elapsed or equal start at %s', async (now) => {
    clock.now.mockReturnValue(new Date(now));
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'invalid',
    });
    expect(context.appointments.save).not.toHaveBeenCalled();
  });
  it('accepts a strictly future start without additional lead time', async () => {
    clock.now.mockReturnValue(new Date('2026-11-09T12:29:59.999Z'));
    await expect(service.execute(42, 7, input)).resolves.toMatchObject({
      id: 77,
    });
  });
  it('rechecks the future after waiting for transactional reads', async () => {
    clock.now
      .mockReturnValueOnce(new Date('2026-11-09T12:29:59Z'))
      .mockReturnValueOnce(new Date('2026-11-09T12:30:01Z'));
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'invalid',
    });
    expect(context.appointments.save).not.toHaveBeenCalled();
    expect(rollbacks).toHaveBeenCalled();
  });
  it('compares the center civil day rather than the UTC day', async () => {
    clock.now.mockReturnValue(new Date('2026-11-10T01:00:00Z'));
    context.availabilities.findByProfessionalAndDay.mockResolvedValue([
      block({ startTime: '23:00', endTime: '23:59' }),
    ]);
    await expect(
      service.execute(42, 7, { ...input, startTime: '23:00' }),
    ).resolves.toMatchObject({ startTime: '23:00' });
  });
  it.each([
    { blocks: [] },
    { blocks: [block({ validFrom: date('2026-11-10') })] },
    { blocks: [block({ validUntil: date('2026-11-08') })] },
    { blocks: [block({ dayOfWeek: DayOfWeek.TUESDAY })] },
  ])('rejects absent or non-applicable availability', async ({ blocks }) => {
    context.availabilities.findByProfessionalAndDay.mockResolvedValue(blocks);
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'invalid',
    });
    expect(context.appointments.save).not.toHaveBeenCalled();
  });
  it.each(['09:15', '11:00', '08:30'])(
    'rejects off-grid start %s',
    async (startTime) => {
      await expect(
        service.execute(42, 7, { ...input, startTime }),
      ).rejects.toMatchObject({ code: 'invalid' });
    },
  );
  it('rejects ambiguous durations before checking occupation', async () => {
    context.availabilities.findByProfessionalAndDay.mockResolvedValue([
      block(),
      block({ startTime: '09:30', duration: 60 }),
    ]);
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'ambiguous',
    });
    expect(context.appointments.save).not.toHaveBeenCalled();
  });
  it('accepts duplicate blocks with identical duration', async () => {
    context.availabilities.findByProfessionalAndDay.mockResolvedValue([
      block(),
      block(),
    ]);
    await expect(service.execute(42, 7, input)).resolves.toMatchObject({
      endTime: '10:00',
    });
  });
  it.each([
    AppointmentStatus.RESERVED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ATTENDED,
    AppointmentStatus.NOT_ATTENDED,
  ])('rejects blocking status %s', async (status) => {
    context.appointments.findByProfessionalAndDate.mockResolvedValue([
      occupied(status),
    ]);
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'occupied',
    });
    expect(context.appointments.save).not.toHaveBeenCalled();
  });
  it('rejects partial overlaps', async () => {
    context.appointments.findByProfessionalAndDate.mockResolvedValue([
      occupied(AppointmentStatus.RESERVED, '09:45', '10:15'),
    ]);
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'occupied',
    });
  });
  it.each([AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED])(
    'allows nonblocking status %s',
    async (status) => {
      context.appointments.findByProfessionalAndDate.mockResolvedValue([
        occupied(status),
      ]);
      await expect(service.execute(42, 7, input)).resolves.toMatchObject({
        id: 77,
      });
    },
  );
  it('allows consecutive appointments at both ends', async () => {
    context.appointments.findByProfessionalAndDate.mockResolvedValue([
      occupied(AppointmentStatus.RESERVED, '09:00', '09:30'),
      occupied(AppointmentStatus.RESERVED, '10:00', '10:30'),
    ]);
    await expect(service.execute(42, 7, input)).resolves.toMatchObject({
      id: 77,
    });
  });
  it('propagates a persistence failure to trigger rollback', async () => {
    context.appointments.save.mockRejectedValue(
      new AppointmentException('persistence', 'No se pudo registrar el turno'),
    );
    await expect(service.execute(42, 7, input)).rejects.toMatchObject({
      code: 'persistence',
    });
    expect(rollbacks).toHaveBeenCalled();
    expect(commits).not.toHaveBeenCalled();
  });
  it.each([{ date: '2026-02-30' }, { startTime: '24:00' }, { patientId: 0 }])(
    'rejects invalid input before opening the transaction',
    async (changes) => {
      await expect(
        service.execute(42, 7, { ...input, ...changes }),
      ).rejects.toMatchObject({ code: 'invalid' });
      expect(runSpy).not.toHaveBeenCalled();
    },
  );
});
