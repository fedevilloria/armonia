import { Injectable } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentException } from '../../domain/exceptions/appointment.exception';
import { blockingAppointmentStatuses } from '../../domain/policies/blocking-appointment-statuses';
import {
  buildSlots,
  dayOfWeek,
  excludeOccupiedSlots,
  civilDate,
} from '../../domain/services/slot-calculator';
import { isFutureStart } from '../../domain/services/center-time';
import { isCivilDate } from '../../domain/value-objects/civil-date';
import { AppointmentTransaction } from '../ports/appointment-transaction';
import { Clock } from '../ports/clock';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentResponseDto } from '../dto/appointment-response.dto';
@Injectable()
export class CreateAppointmentService {
  constructor(
    private readonly transaction: AppointmentTransaction,
    private readonly clock: Clock,
  ) {}
  async execute(
    professionalId: number,
    userId: number,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    if (
      !Number.isSafeInteger(professionalId) ||
      professionalId <= 0 ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    )
      throw new AppointmentException(
        'invalid',
        'Identidad autenticada inválida',
      );
    if (
      !isCivilDate(dto.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.startTime) ||
      !Number.isSafeInteger(dto.patientId) ||
      dto.patientId <= 0
    )
      throw new AppointmentException(
        'invalid',
        'Los datos del turno no son válidos',
      );
    if (!isFutureStart(dto.date, dto.startTime, this.clock.now()))
      throw new AppointmentException(
        'invalid',
        'La fecha y hora de inicio deben ser futuras',
      );
    return this.transaction.run(professionalId, dto.date, async (context) => {
      if (
        !(await context.patientAccess.canAssign(dto.patientId, professionalId))
      )
        throw new AppointmentException(
          'patient-not-found',
          'Paciente no encontrado o no disponible',
        );
      const blocks = await context.availabilities.findByProfessionalAndDay(
        professionalId,
        dayOfWeek(dto.date),
      );
      const candidates = buildSlots(professionalId, dto.date, blocks).filter(
        (slot) => slot.startTime === dto.startTime,
      );
      if (!candidates.length)
        throw new AppointmentException(
          'invalid',
          'El inicio no corresponde a una disponibilidad vigente de la grilla',
        );
      if (new Set(candidates.map((slot) => slot.duration)).size > 1)
        throw new AppointmentException(
          'ambiguous',
          'El horario corresponde a disponibilidades con duraciones distintas',
        );
      const date = new Date(dto.date + 'T00:00:00.000Z');
      const appointments = await context.appointments.findByProfessionalAndDate(
        professionalId,
        date,
        [...blockingAppointmentStatuses],
      );
      if (
        !excludeOccupiedSlots(
          professionalId,
          dto.date,
          candidates,
          appointments,
        ).length
      )
        throw new AppointmentException(
          'occupied',
          'El horario solicitado ya no está disponible',
        );
      // Validar el futuro despues de las consultas y bloqueos, antes de insertar.
      if (!isFutureStart(dto.date, dto.startTime, this.clock.now()))
        throw new AppointmentException(
          'invalid',
          'La fecha y hora de inicio deben ser futuras',
        );
      const appointment = new Appointment(
        null,
        professionalId,
        dto.patientId,
        date,
        dto.startTime,
        candidates[0].endTime,
        AppointmentStatus.RESERVED,
        null,
        null,
        userId,
      );
      const saved = await context.appointments.save(appointment);
      return {
        id: saved.id!,
        patientId: saved.patientId,
        date: civilDate(saved.date),
        startTime: saved.startTime,
        endTime: saved.endTime,
        status: saved.status,
      };
    });
  }
}
