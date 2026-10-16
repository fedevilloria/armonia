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
  ) {}
}