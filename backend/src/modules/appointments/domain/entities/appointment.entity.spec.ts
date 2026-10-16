import { Appointment } from './appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentException } from '../exceptions/appointment.exception';
describe('Appointment invariants', () => {
  const create = (
    professionalId = 42,
    patientId = 25,
    date = new Date('2026-11-09T00:00:00Z'),
    start = '09:00',
    end = '09:30',
    status = AppointmentStatus.RESERVED,
  ) =>
    new Appointment(null, professionalId, patientId, date, start, end, status);
  it('allows a valid appointment', () =>
    expect(create()).toBeInstanceOf(Appointment));
  it.each([
    { professionalId: 0 },
    { patientId: -1 },
    { date: new Date('invalid') },
    { date: new Date('2026-11-09T01:00:00Z') },
    { start: '09:99' },
    { end: '08:00' },
    { end: '09:00' },
  ])('rejects invalid values %p', (changes) => {
    const {
      professionalId = 42,
      patientId = 25,
      date = new Date('2026-11-09T00:00:00Z'),
      start = '09:00',
      end = '09:30',
    } = changes;
    expect(() => create(professionalId, patientId, date, start, end)).toThrow(
      AppointmentException,
    );
  });
});
