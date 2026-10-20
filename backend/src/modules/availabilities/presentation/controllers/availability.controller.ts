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

import { UsuarioActual } from '../../../../auth/decorators/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../../../../auth/interfaces/usuario-autenticado.interface';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfesionalesService } from '../../../../profesionales/profesionales.service';

/**
 * Expone los endpoints HTTP relacionados con la gestion
 * de disponibilidades horarias.
 */
@Controller('availabilities')
@UseFilters(DomainExceptionFilter)
export class AvailabilityController {
  constructor(
    private readonly createAvailabilityService: CreateAvailabilityService,
    private readonly profesionalesService: ProfesionalesService,
  ) {}

  /**
   * Registra una nueva disponibilidad horaria para un profesional.
   *
   * @param dto Datos recibidos para registrar la disponibilidad.
   * @returns Disponibilidad horaria registrada.
   */
  @Post()
  @Roles('PROFESIONAL')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAvailabilityDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<Availability> {
    // Se obtiene el profesional autenticado a partir del usuario identificado mediante JWT.
    const profesional =
      await this.profesionalesService.buscarPorUsuario(
        usuario.sub,
      );

    return this.createAvailabilityService.execute(
      profesional.idProfesional,
      dto,
    );
  }
}