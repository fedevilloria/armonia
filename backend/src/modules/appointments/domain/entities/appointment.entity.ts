import { AppointmentException } from '../exceptions/appointment.exception';
import { isCivilDate } from '../value-objects/civil-date';
import { AppointmentStatus } from '../enums/appointment-status.enum';

/**
 * Representa un turno asignado a un paciente con un profesional.
 *
 * La entidad contiene la informacion necesaria para identificar
 * el horario del turno, sus participantes y su estado actual.
 */
export class Appointment {
  constructor(
    public readonly id: number | null,
    public readonly professionalId: number,
    public readonly patientId: number,
    // Fecha civil representada a medianoche UTC, sin conversion a hora local.
    public readonly date: Date,
    public readonly startTime: string,
    public readonly endTime: string,
    public status: AppointmentStatus,
    public readonly createdAt: Date | null = null,
    public readonly updatedAt: Date | null = null,
    public readonly createdByUserId: number | null = null,
  ) {
    const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (
      (id !== null && (!Number.isSafeInteger(id) || id <= 0)) ||
      !Number.isSafeInteger(professionalId) ||
      professionalId <= 0 ||
      !Number.isSafeInteger(patientId) ||
      patientId <= 0 ||
      !Number.isFinite(date.getTime()) ||
      !isCivilDate(date.toISOString().slice(0, 10)) ||
      date.toISOString().slice(10) !== 'T00:00:00.000Z' ||
      !validTime(startTime) ||
      !validTime(endTime) ||
      startTime >= endTime ||
      !Object.values(AppointmentStatus).includes(status) ||
      (createdByUserId !== null &&
        (!Number.isSafeInteger(createdByUserId) || createdByUserId <= 0))
    ) {
      throw new AppointmentException(
        'invalid',
        'Los datos del turno no son válidos',
      );
    }
  }
}
