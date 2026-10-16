import { CreateAppointmentDto } from '../../application/dto/create-appointment.dto';
import { AppointmentResponseDto } from '../../application/dto/appointment-response.dto';
import { CreateAppointmentService } from '../../application/services/create-appointment.service';
import { AppointmentExceptionFilter } from '../filters/appointment-exception.filter';
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  Post,
  Body,
  UseFilters,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import { GetFreeSlotsDto } from '../../application/dto/get-free-slots.dto';
import { FreeSlotsResponseDto } from '../../application/dto/free-slots-response.dto';
import { GetFreeSlotsService } from '../../application/services/get-free-slots.service';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly getFreeSlotsService: GetFreeSlotsService,
    private readonly createAppointmentService: CreateAppointmentService,
  ) {}

  @Post()
  @Roles('PROFESIONAL')
  @UseGuards(ProfessionalIdentityGuard)
  @UseFilters(AppointmentExceptionFilter)
  create(
    @Body() dto: CreateAppointmentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AppointmentResponseDto> {
    return this.createAppointmentService.execute(
      request.professionalId!,
      request.user!.sub,
      dto,
    );
  }

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
