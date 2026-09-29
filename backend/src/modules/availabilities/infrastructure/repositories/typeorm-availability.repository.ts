import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Availability } from '../../domain/entities/availability.entity';
import { DayOfWeek } from '../../domain/enums/day-of-week.enum';
import { AvailabilityRepository } from '../../domain/repositories/availability.repository';
import { AvailabilityOrmEntity } from '../persistence/availability.orm-entity';

/**
 * Implementacion del repositorio de disponibilidades utilizando TypeORM.
 *
 * Se encarga de traducir entre la entidad de dominio Availability
 * y la entidad de persistencia AvailabilityOrmEntity.
 */
@Injectable()
export class TypeOrmAvailabilityRepository
  implements AvailabilityRepository
{
  constructor(
    @InjectRepository(AvailabilityOrmEntity)
    private readonly repository: Repository<AvailabilityOrmEntity>,
  ) {}

  /**
   * Guarda una disponibilidad horaria en la base de datos.
   *
   * @param availability Entidad de dominio que se desea persistir.
   * @returns Disponibilidad almacenada convertida nuevamente al dominio.
   */
  async save(availability: Availability): Promise<Availability> {
    const ormEntity = this.repository.create({
      professionalId: availability.professionalId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      duration: availability.duration,
      validFrom: this.formatDate(availability.validFrom),
      validUntil: this.formatDate(availability.validUntil),
    });

    const savedEntity = await this.repository.save(ormEntity);

    return this.toDomain(savedEntity);
  }

  /**
   * Busca las disponibilidades de un profesional para un dia
   * determinado.
   *
   * @param professionalId Identificador del profesional.
   * @param dayOfWeek Dia de la semana que se desea consultar.
   * @returns Disponibilidades encontradas convertidas al dominio.
   */
  async findByProfessionalAndDay(
    professionalId: number,
    dayOfWeek: DayOfWeek,
  ): Promise<Availability[]> {
    const entities = await this.repository.find({
      where: {
        professionalId,
        dayOfWeek,
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Convierte una entidad de persistencia de TypeORM
   * en una entidad perteneciente al dominio.
   *
   * @param entity Entidad obtenida desde la base de datos.
   * @returns Entidad de dominio Availability.
   */
  private toDomain(entity: AvailabilityOrmEntity): Availability {
    return new Availability(
      entity.id,
      entity.professionalId,
      entity.dayOfWeek,
      this.formatTime(entity.startTime),
      this.formatTime(entity.endTime),
      entity.duration,
      new Date(entity.validFrom),
      new Date(entity.validUntil),
    );
  }

  /**
   * Convierte un objeto Date al formato YYYY-MM-DD
   * utilizado por las columnas date de PostgreSQL.
   *
   * @param date Fecha que se desea convertir.
   * @returns Fecha representada en formato YYYY-MM-DD.
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Normaliza una hora al formato HH:mm utilizado por el dominio.
   *
   * PostgreSQL puede devolver valores time en formato HH:mm:ss,
   * mientras que la API trabaja con HH:mm.
   *
   * @param time Hora que se desea normalizar.
   * @returns Hora representada en formato HH:mm.
   */
  private formatTime(time: string): string {
    return time.slice(0, 5);
  }
}