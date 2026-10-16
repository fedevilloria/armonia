/**
 * Representa los posibles estados de un turno dentro del sistema.
 *
 * El estado permite determinar la situacion actual del turno
 * y sera utilizado para aplicar las distintas reglas de negocio.
 */
export enum AppointmentStatus {
  RESERVED = 'RESERVED',
  CONFIRMED = 'CONFIRMED',
  ATTENDED = 'ATTENDED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  NOT_ATTENDED = 'NOT_ATTENDED',
}