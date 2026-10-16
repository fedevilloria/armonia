import {
  Column,
  Check,
  Exclusion,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Usuario } from '../../../../usuarios/entities/usuario.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

/**
 * Representa la estructura de persistencia de un turno
 * dentro de la base de datos.
 *
 * Esta entidad pertenece a la capa de infraestructura y define
 * como se almacena un Appointment utilizando TypeORM.
 */
@Check('CK_appointments_time_order', '"start_time" < "end_time"')
@Exclusion(
  'EX_appointments_professional_time',
  `USING gist ("professional_id" WITH =, tsrange("date" + "start_time", "date" + "end_time", '[)') WITH &&) WHERE ("status" IN ('RESERVED','CONFIRMED','ATTENDED','NOT_ATTENDED'))`,
)
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'created_by_user_id', type: 'integer', nullable: true })
  createdByUserId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'created_by_user_id',
    foreignKeyConstraintName: 'FK_appointments_creator',
  })
  createdByUser?: Usuario | null;
}
