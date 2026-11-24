import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';

import { TherapeuticProcessService } from '../../application/services/therapeutic-process.service';
import { CreateTherapeuticProcessDto } from '../../application/dto/create-therapeutic-process.dto';
import { ChangeTherapeuticProcessStateDto } from '../../application/dto/change-therapeutic-process-state.dto';

import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
import { ClinicalExceptionFilter } from '../../../../common/filters/clinical-exception.filter';

@Controller('procesos-terapeuticos')
@Roles('PROFESIONAL')
@UseGuards(ProfessionalIdentityGuard)
@UseFilters(ClinicalExceptionFilter)
export class TherapeuticProcessController {
  constructor(private readonly processService: TherapeuticProcessService) {}

  // Crear un proceso terapéutico
  @Post()
  async create(
    @Body() createDto: CreateTherapeuticProcessDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.processService.create(createDto, request.professionalId!);
  }

  // Cambiar el estado de un proceso terapéutico
  @Patch(':id/estado')
  async changeState(
    @Param('id', ParseIntPipe) idProcesoTerapeutico: number,
    @Body() dto: ChangeTherapeuticProcessStateDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.processService.changeState(
      idProcesoTerapeutico,
      dto,
      request.professionalId!,
    );
  }
}
