import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import type { AvailabilityRepository } from '../../../availabilities/domain/repositories/availability.repository';
import type { PatientAccess } from './patient-access';
export interface AppointmentTransactionContext {
  appointments: AppointmentRepository;
  availabilities: AvailabilityRepository;
  patientAccess: PatientAccess;
}
export abstract class AppointmentTransaction {
  abstract run<T>(
    professionalId: number,
    date: string,
    work: (context: AppointmentTransactionContext) => Promise<T>,
  ): Promise<T>;
}
