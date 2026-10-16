import type { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
export class AppointmentResponseDto {
  id!: number;
  patientId!: number;
  date!: string;
  startTime!: string;
  endTime!: string;
  status!: AppointmentStatus;
}
