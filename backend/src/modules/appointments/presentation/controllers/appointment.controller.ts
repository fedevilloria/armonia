import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import { GetFreeSlotsDto } from '../../application/dto/get-free-slots.dto';
import { FreeSlotsResponseDto } from '../../application/dto/free-slots-response.dto';
import { GetFreeSlotsService } from '../../application/services/get-free-slots.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly getFreeSlotsService: GetFreeSlotsService) {}

  @Get('free-slots')
  @Roles('PROFESIONAL')
  @UseGuards(ProfessionalIdentityGuard)
  getFreeSlots(
    @Query() dto: GetFreeSlotsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<FreeSlotsResponseDto> {
    return this.getFreeSlotsService.execute(request.professionalId!, dto);
  }
}
