import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ClinicalHistoryService } from '../../application/services/clinical-histort.service';
import { CreateClinicalHistoryDto } from '../../application/dto/create-clinical-history.dto';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
import { ClinicalExceptionFilter } from '../../../../common/filters/clinical-exception.filter';

@Controller('historias-clinicas')
@Roles('PROFESIONAL')
@UseGuards(ProfessionalIdentityGuard)
@UseFilters(ClinicalExceptionFilter)
export class ClinicalHistoryController {
  constructor(
    private readonly clinicalHistoryService: ClinicalHistoryService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateClinicalHistoryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.clinicalHistoryService.create(
      dto,
      request.professionalId!,
    );
  }
}
