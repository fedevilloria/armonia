import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

/**
 * Representa la estructura de persistencia de un turno
 * dentro de la base de datos.
 *
 * Esta entidad pertenece a la capa de infraestructura y define
 * como se almacena un Appointment utilizando TypeORM.
 */
@Entity('appointments')
export class AppointmentOrmEntity {
  /**
   * Identificador unico del turno.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Identificador del profesional al cual pertenece el turno.
   */
  @Column({
    name: 'professional_id',
    type: 'integer',
  })
  professionalId!: number;

  /**
   * Identificador del paciente al cual pertenece el turno.
   */
  @Column({
    name: 'patient_id',
    type: 'integer',
  })
  patientId!: number;

  /**
   * Fecha en la cual se realizara el turno.
   */
  @Column({
    type: 'date',
  })
  date!: string;

  /**
   * Hora de inicio del turno.
   */
  @Column({
    name: 'start_time',
    type: 'time',
  })
  startTime!: string;

  /**
   * Hora de finalizacion del turno.
   */
  @Column({
    name: 'end_time',
    type: 'time',
  })
  endTime!: string;

  /**
   * Estado actual del turno.
   */
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.RESERVED,
  })
  status!: AppointmentStatus;
}