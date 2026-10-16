import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

/**
 * Token utilizado por NestJS para inyectar la implementacion
 * concreta del repositorio de turnos.
 */
export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');

/**
 * Define las operaciones de persistencia necesarias para trabajar
 * con los turnos desde la capa de dominio.
 *
 * La interfaz permite que los casos de uso dependan de una abstraccion
 * y no directamente de TypeORM o PostgreSQL.
 */
export interface AppointmentRepository {
  /**
   * Busca los turnos de un profesional para una fecha determinada
   * que se encuentren en alguno de los estados indicados.
   *
   * Se utilizara principalmente para determinar que bloques horarios
   * se encuentran ocupados al consultar horarios libres.
   *
   * @param professionalId Identificador del profesional.
   * @param date Fecha civil a medianoche UTC para consultar los turnos.
   * @param statuses Estados de los turnos que deben incluirse.
   * @returns Lista de turnos encontrados.
   */
  findByProfessionalAndDate(
    professionalId: number,
    date: Date,
    statuses: AppointmentStatus[],
  ): Promise<Appointment[]>;

  /**
   * Guarda un turno en el repositorio.
   *
   * Este metodo sera utilizado al implementar la asignacion
   * de turnos sin superposiciones.
   *
   * @param appointment Turno que se desea almacenar.
   * @returns Turno almacenado.
   */
  save(appointment: Appointment): Promise<Appointment>;
}