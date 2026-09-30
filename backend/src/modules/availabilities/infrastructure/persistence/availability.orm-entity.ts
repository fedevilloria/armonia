import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DayOfWeek } from '../../domain/enums/day-of-week.enum';

/**
 * Representa la estructura de persistencia de una disponibilidad
 * horaria dentro de la base de datos.
 *
 * Esta entidad pertenece a la capa de infraestructura y define
 * como TypeORM almacena cada atributo.
 */
@Entity('availabilities')
export class AvailabilityOrmEntity {
  /**
   * Identificador unico generado automaticamente por la base de datos.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Identificador del profesional propietario de la disponibilidad.
   */
  @Column({ name: 'professional_id', type: 'int' })
  professionalId!: number;

  /**
   * Dia de la semana correspondiente al bloque de disponibilidad.
   */
  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek!: DayOfWeek;

  /**
   * Hora de inicio del bloque horario.
   */
  @Column({
    name: 'start_time',
    type: 'time',
  })
  startTime!: string;

  /**
   * Hora de finalizacion del bloque horario.
   */
  @Column({
    name: 'end_time',
    type: 'time',
  })
  endTime!: string;

  /**
   * Duracion de cada turno expresada en minutos.
   */
  @Column({
    type: 'int',
  })
  duration!: number;

  /**
   * Fecha desde la cual comienza la vigencia.
   */
  @Column({
    name: 'valid_from',
    type: 'date',
  })
  validFrom!: string;

  /**
   * Fecha hasta la cual se mantiene la vigencia.
   */
  @Column({
    name: 'valid_until',
    type: 'date',
  })
  validUntil!: string;
}