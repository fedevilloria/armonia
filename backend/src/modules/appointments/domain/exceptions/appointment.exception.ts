export type AppointmentErrorCode =
  | 'invalid'
  | 'patient-not-found'
  | 'occupied'
  | 'ambiguous'
  | 'invalid-schedule'
  | 'persistence';
export class AppointmentException extends Error {
  constructor(
    public readonly code: AppointmentErrorCode,
    message: string,
  ) {
    super(message);
  }
}
