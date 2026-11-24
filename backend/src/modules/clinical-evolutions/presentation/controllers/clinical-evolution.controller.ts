import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ClinicalEvolutionService } from '../../application/services/clinical-evolutions.service';
import { CreateClinicalEvolutionDto } from '../../application/dto/create-clinical-evolution.dto';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
import { ClinicalExceptionFilter } from '../../../../common/filters/clinical-exception.filter';

@Controller('evoluciones-clinicas')
@Roles('PROFESIONAL')
@UseGuards(ProfessionalIdentityGuard)
@UseFilters(ClinicalExceptionFilter)
export class ClinicalEvolutionController {
  constructor(private readonly evolutionService: ClinicalEvolutionService) {}

  @Post()
  async create(
    @Body() createDto: CreateClinicalEvolutionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.evolutionService.create(
      createDto,
      request.professionalId!,
    );
  }

  @Get('historia-clinica/:idHistoriaClinica')
  async findAllByHistoriaClinica(
    @Param('idHistoriaClinica', ParseIntPipe) idHistoriaClinica: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.evolutionService.findAllByHistoriaClinica(
      idHistoriaClinica,
      request.professionalId!,
    );
  }
}
