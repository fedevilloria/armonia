import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AVAILABILITY_REPOSITORY,
  type AvailabilityRepository,
} from '../../../availabilities/domain/repositories/availability.repository';
import { DayOfWeek } from '../../../availabilities/domain/enums/day-of-week.enum';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repositories/appointment.repository';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { isCivilDate } from '../../domain/value-objects/civil-date';
import { GetFreeSlotsDto } from '../dto/get-free-slots.dto';
import {
  FreeSlotDto,
  FreeSlotsResponseDto,
} from '../dto/free-slots-response.dto';

const blockingStatuses = [
  AppointmentStatus.RESERVED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.ATTENDED,
  AppointmentStatus.NOT_ATTENDED,
];
const weekDays = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

@Injectable()
export class GetFreeSlotsService {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: AvailabilityRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(
    professionalId: number,
    dto: GetFreeSlotsDto,
  ): Promise<FreeSlotsResponseDto> {
    if (!isCivilDate(dto.date))
      throw new BadRequestException(
        'La fecha debe ser una fecha válida con formato YYYY-MM-DD',
      );
    const date = new Date(dto.date + 'T00:00:00.000Z');
    const dayOfWeek = weekDays[date.getUTCDay()];
    const blocks = await this.availabilityRepository.findByProfessionalAndDay(
      professionalId,
      dayOfWeek,
    );
    const activeBlocks = blocks.filter(
      (block) =>
        block.professionalId === professionalId &&
        block.dayOfWeek === dayOfWeek &&
        dto.date >= this.civilDate(block.validFrom) &&
        dto.date <= this.civilDate(block.validUntil),
    );
    if (!activeBlocks.length) return { date: dto.date, slots: [] };
    const appointments =
      await this.appointmentRepository.findByProfessionalAndDate(
        professionalId,
        date,
        blockingStatuses,
      );
    const occupied = appointments
      .filter(
        (appointment) =>
          appointment.professionalId === professionalId &&
          this.civilDate(appointment.date) === dto.date &&
          blockingStatuses.includes(appointment.status),
      )
      .map((appointment) => ({
        start: this.minutes(appointment.startTime),
        end: this.minutes(appointment.endTime),
      }));
    if (occupied.some((interval) => interval.start >= interval.end))
      this.invalidSchedule();
    const slots = new Map<string, FreeSlotDto>();
    for (const block of activeBlocks) {
      if (!Number.isSafeInteger(block.duration) || block.duration <= 0)
        this.invalidSchedule();
      const start = this.minutes(block.startTime);
      const end = this.minutes(block.endTime);
      if (start >= end) this.invalidSchedule();
      for (
        let cursor = start;
        cursor + block.duration <= end;
        cursor += block.duration
      ) {
        const slotEnd = cursor + block.duration;
        if (
          occupied.some(
            (interval) => cursor < interval.end && slotEnd > interval.start,
          )
        )
          continue;
        const slot = {
          startTime: this.time(cursor),
          endTime: this.time(slotEnd),
          duration: block.duration,
        };
        slots.set(slot.startTime + '-' + slot.endTime, slot);
      }
    }
    return {
      date: dto.date,
      slots: [...slots.values()].sort(
        (a, b) =>
          a.startTime.localeCompare(b.startTime) ||
          a.endTime.localeCompare(b.endTime),
      ),
    };
  }

  private civilDate(date: Date): string {
    if (!Number.isFinite(date.getTime())) this.invalidSchedule();
    return date.toISOString().slice(0, 10);
  }

  private minutes(time: string): number {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) this.invalidSchedule();
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private time(minutes: number): string {
    return (
      String(Math.floor(minutes / 60)).padStart(2, '0') +
      ':' +
      String(minutes % 60).padStart(2, '0')
    );
  }

  private invalidSchedule(): never {
    throw new InternalServerErrorException(
      'La agenda contiene una configuración inválida',
    );
  }
}
