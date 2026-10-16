import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Appointment } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentOrmEntity } from '../persistence/appointment.orm-entity';

/**
 * Implementa el repositorio de turnos utilizando TypeORM.
 *
 * Esta clase se encarga de realizar las operaciones de persistencia
 * definidas por AppointmentRepository y de convertir las entidades
 * entre el modelo de dominio y el modelo de persistencia.
 */
@Injectable()
export class TypeOrmAppointmentRepository implements AppointmentRepository {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repository: Repository<AppointmentOrmEntity>,
  ) {}

  /**
   * Busca los turnos de un profesional para una fecha determinada
   * que se encuentren en alguno de los estados indicados.
   *
   * @param professionalId Identificador del profesional.
   * @param date Fecha para la cual se desean consultar los turnos.
   * @param statuses Estados de los turnos que deben incluirse.
   * @returns Lista de turnos encontrados.
   */
  async findByProfessionalAndDate(
    professionalId: number,
    date: Date,
    statuses: AppointmentStatus[],
  ): Promise<Appointment[]> {
    const entities = await this.repository.find({
      where: {
        professionalId,
        date: this.formatDate(date),
        status: In(statuses),
      },
      order: {
        startTime: 'ASC',
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Guarda un turno en la base de datos.
   *
   * Convierte la entidad de dominio al modelo de persistencia,
   * almacena sus datos mediante TypeORM y devuelve nuevamente
   * una entidad perteneciente al dominio.
   *
   * @param appointment Turno que se desea almacenar.
   * @returns Turno almacenado.
   */
  async save(appointment: Appointment): Promise<Appointment> {
    const persistenceEntity = this.toPersistence(appointment);

    const savedEntity = await this.repository.save(persistenceEntity);

    return this.toDomain(savedEntity);
  }

  /**
   * Convierte una entidad de persistencia de TypeORM
   * en una entidad perteneciente al dominio.
   *
   * @param entity Entidad obtenida desde la base de datos.
   * @returns Entidad de dominio Appointment.
   */
  private toDomain(entity: AppointmentOrmEntity): Appointment {
    return new Appointment(
      entity.id,
      entity.professionalId,
      entity.patientId,
      new Date(`${entity.date}T00:00:00.000Z`),
      this.formatTime(entity.startTime),
      this.formatTime(entity.endTime),
      entity.status,
      entity.createdAt ?? null,
      entity.updatedAt ?? null,
      entity.createdByUserId ?? null,
    );
  }

  /**
   * Convierte una entidad del dominio al modelo utilizado
   * por TypeORM para su persistencia.
   *
   * @param appointment Entidad de dominio que se desea convertir.
   * @returns Entidad preparada para ser almacenada por TypeORM.
   */
  private toPersistence(appointment: Appointment): AppointmentOrmEntity {
    const entity = new AppointmentOrmEntity();

    if (appointment.id !== null) {
      entity.id = appointment.id;
    }

    entity.professionalId = appointment.professionalId;
    entity.patientId = appointment.patientId;
    entity.date = this.formatDate(appointment.date);
    entity.startTime = appointment.startTime;
    entity.endTime = appointment.endTime;
    entity.status = appointment.status;
    entity.createdByUserId = appointment.createdByUserId;

    return entity;
  }

  /**
   * Convierte un objeto Date al formato YYYY-MM-DD
   * utilizado por las columnas date de PostgreSQL.
   *
   * @param date Fecha que se desea convertir.
   * @returns Fecha representada en formato YYYY-MM-DD.
   */
  private formatDate(date: Date): string {
    // Usar UTC como contenedor de la fecha civil, igual que disponibilidades.
    return date.toISOString().slice(0, 10);
  }

  /**
   * Normaliza una hora obtenida desde PostgreSQL al formato HH:mm.
   *
   * @param time Hora que se desea normalizar.
   * @returns Hora representada en formato HH:mm.
   */
  private formatTime(time: string): string {
    return time.slice(0, 5);
  }
}
