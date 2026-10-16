import { AppointmentStatus } from '../enums/appointment-status.enum';
export const blockingAppointmentStatuses: readonly AppointmentStatus[] =
  Object.freeze([
    AppointmentStatus.RESERVED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.ATTENDED,
    AppointmentStatus.NOT_ATTENDED,
  ]);
