import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';

import { CreateAvailabilityDto } from '../../application/dto/create-availability.dto';
import { CreateAvailabilityService } from '../../application/services/create-availability.service';
import { Availability } from '../../domain/entities/availability.entity';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
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
  @Roles('PROFESIONAL')
  @UseGuards(ProfessionalIdentityGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAvailabilityDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Availability> {
    return this.createAvailabilityService.execute(request.professionalId!, dto);
  }
}
