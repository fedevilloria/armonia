import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';

import { CreateAvailabilityDto } from '../../application/dto/create-availability.dto';
import { CreateAvailabilityService } from '../../application/services/create-availability.service';
import { Availability } from '../../domain/entities/availability.entity';
import { DomainExceptionFilter } from '../filters/domain-exception.filter';

/**
 * Expone los endpoints HTTP relacionados con la gestion
 * de disponibilidades horarias.
 */
@Controller('availabilities')
@UseFilters(DomainExceptionFilter)
export class AvailabilityController {
  constructor(
    private readonly createAvailabilityService: CreateAvailabilityService,
  ) {}

  /**
   * Registra una nueva disponibilidad horaria para un profesional.
   *
   * @param dto Datos recibidos para registrar la disponibilidad.
   * @returns Disponibilidad horaria registrada.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    //TODO: REEMPLAZAR POR EL IDENTIFICADOR DEL PROFESIONAL AUTENTICADO.
    const professionalId = 1; // Temporalmente se utiliza un identificador fijo hasta integrar la autenticacion de usuarios.

    return this.createAvailabilityService.execute(
      professionalId,
      dto,
    );
  }
}