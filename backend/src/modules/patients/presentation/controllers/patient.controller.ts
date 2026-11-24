import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PatientService } from '../../application/services/patient.service';
import { CreatePatientDto } from '../../application/dto/create-patient.dto';
import { UpdatePatientDto } from '../../application/dto/update-patient.dto';

import { ProfessionalIdentityGuard } from '../../../../auth/guards/professional-identity.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../../auth/authenticated-request';

@Controller('patients')
@Roles('PROFESIONAL')
@UseGuards(ProfessionalIdentityGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  // 1. Registrar paciente
  @Post()
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientService.createPatient(
      createPatientDto,
      request.professionalId!,
    );
  }

  // 2. Consultar pacientes del profesional autenticado
  @Get()
  async findAll(@Req() request: AuthenticatedRequest) {
    return this.patientService.getMyPatients(request.professionalId!);
  }

  // 3. Modificar paciente
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) idPaciente: number,
    @Body() updatePatientDto: UpdatePatientDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.patientService.updatePatient(
      idPaciente,
      updatePatientDto,
      request.professionalId!,
    );
  }
}
