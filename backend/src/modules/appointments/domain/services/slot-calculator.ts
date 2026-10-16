import type { Availability } from '../../../availabilities/domain/entities/availability.entity';
import { DayOfWeek } from '../../../availabilities/domain/enums/day-of-week.enum';
import type { Appointment } from '../entities/appointment.entity';
import { AppointmentException } from '../exceptions/appointment.exception';
import { blockingAppointmentStatuses } from '../policies/blocking-appointment-statuses';
export interface Slot {
  startTime: string;
  endTime: string;
  duration: number;
}
const weekDays = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];
export function dayOfWeek(date: string): DayOfWeek {
  return weekDays[new Date(date + 'T00:00:00.000Z').getUTCDay()];
}
export function civilDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) invalidSchedule();
  return date.toISOString().slice(0, 10);
}
function invalidSchedule(): never {
  throw new AppointmentException(
    'invalid-schedule',
    'La agenda contiene una configuración inválida',
  );
}
export function minutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) invalidSchedule();
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
function time(value: number): string {
  return (
    String(Math.floor(value / 60)).padStart(2, '0') +
    ':' +
    String(value % 60).padStart(2, '0')
  );
}
export function buildSlots(
  professionalId: number,
  date: string,
  blocks: Availability[],
): Slot[] {
  const slots = new Map<string, Slot>();
  for (const block of blocks) {
    if (
      block.professionalId !== professionalId ||
      block.dayOfWeek !== dayOfWeek(date) ||
      date < civilDate(block.validFrom) ||
      date > civilDate(block.validUntil)
    )
      continue;
    if (!Number.isSafeInteger(block.duration) || block.duration <= 0)
      invalidSchedule();
    const start = minutes(block.startTime),
      end = minutes(block.endTime);
    if (start >= end) invalidSchedule();
    for (
      let cursor = start;
      cursor + block.duration <= end;
      cursor += block.duration
    ) {
      const slot = {
        startTime: time(cursor),
        endTime: time(cursor + block.duration),
        duration: block.duration,
      };
      slots.set(slot.startTime + '-' + slot.endTime, slot);
    }
  }
  return [...slots.values()].sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime),
  );
}
export function excludeOccupiedSlots(
  professionalId: number,
  date: string,
  slots: Slot[],
  appointments: Appointment[],
): Slot[] {
  const occupied = appointments
    .filter(
      (appointment) =>
        appointment.professionalId === professionalId &&
        civilDate(appointment.date) === date &&
        blockingAppointmentStatuses.includes(appointment.status),
    )
    .map((appointment) => ({
      start: minutes(appointment.startTime),
      end: minutes(appointment.endTime),
    }));
  if (occupied.some((interval) => interval.start >= interval.end))
    invalidSchedule();
  return slots.filter(
    (slot) =>
      !occupied.some(
        (interval) =>
          minutes(slot.startTime) < interval.end &&
          minutes(slot.endTime) > interval.start,
      ),
  );
}
