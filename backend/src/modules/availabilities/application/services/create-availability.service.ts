import { Inject, Injectable } from '@nestjs/common';

import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { Availability } from '../../domain/entities/availability.entity';
import {
  AVAILABILITY_REPOSITORY,
  type AvailabilityRepository,
} from '../../domain/repositories/availability.repository';
import { DomainException } from '../../domain/exceptions/domain.exception';

/**
 * Implementa el caso de uso para registrar una nueva
 * disponibilidad horaria de un profesional.
 */
@Injectable()
export class CreateAvailabilityService {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  /**
   * Registra una nueva disponibilidad horaria.
   *
   * Verifica que el nuevo bloque horario no se superponga con otra
   * disponibilidad existente del profesional durante el mismo
   * periodo de vigencia.
   *
   * @param professionalId Identificador del profesional autenticado.
   * @param dto Datos necesarios para registrar la disponibilidad.
   * @returns Disponibilidad horaria registrada.
   */
  async execute(
    professionalId: number,
    dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    // Convierte las fechas recibidas por el DTO a objetos Date.
    const newValidFrom = new Date(dto.validFrom);
    const newValidUntil = new Date(dto.validUntil);

    // Busca las disponibilidades existentes del profesional
    // correspondientes al mismo dia de la semana.
    const existingAvailabilities =
      await this.availabilityRepository.findByProfessionalAndDay(
        professionalId,
        dto.dayOfWeek,
      );

    // Comprueba si existe una disponibilidad cuyo horario y periodo
    // de vigencia se superpongan con los que se intentan registrar.
    const hasOverlap = existingAvailabilities.some((availability) => {
      const newStartTime = this.timeToMinutes(dto.startTime);
      const newEndTime = this.timeToMinutes(dto.endTime);

      const existingStartTime = this.timeToMinutes(
        availability.startTime,
      );

      const existingEndTime = this.timeToMinutes(
        availability.endTime,
      );

      const timeOverlaps =
        newStartTime < existingEndTime &&
        newEndTime > existingStartTime;

      const validityOverlaps =
        newValidFrom <= availability.validUntil &&
        newValidUntil >= availability.validFrom;

      return timeOverlaps && validityOverlaps;
    });

    // Impide registrar bloques incompatibles para el mismo profesional.
    if (hasOverlap) {
      throw new DomainException(
        'La disponibilidad horaria se superpone con otra ya registrada.',
      );
    }

    // Crea la entidad de dominio con los datos validados.
    const availability = new Availability(
      null,
      professionalId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.duration,
      newValidFrom,
      newValidUntil,
    );

    // Delega la persistencia al repositorio y devuelve
    // la disponibilidad almacenada.
    return this.availabilityRepository.save(availability);
  }

  /**
   * Convierte una hora en formato HH:mm a minutos desde medianoche.
   *
   * @param time Hora que se desea convertir.
   * @returns Cantidad de minutos transcurridos desde las 00:00.
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
  }
}