
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { PatientService } from '../../application/services/patient.service';
import { CreatePatientDto } from '../../application/dto/create-patient.dto';
import { UpdatePatientDto } from '../../application/dto/update-patient.dto';

import { ProfesionalesService } from '../../../../profesionales/profesionales.service';
import { UsuarioActual } from '../../../../auth/decorators/usuario-actual.decorator';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import type { UsuarioAutenticado } from '../../../../auth/interfaces/usuario-autenticado.interface';

@Controller('patients')
@Roles('PROFESIONAL')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly profesionalesService: ProfesionalesService,
  ) {}

  // 1. Registrar paciente
  @Post()
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.patientService.createPatient(
      createPatientDto,
      profesional.idProfesional,
    );
  }

  // 2. Consultar pacientes del profesional autenticado
  @Get()
  async findAll(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.patientService.getMyPatients(
      profesional.idProfesional,
    );
  }

  // 3. Modificar paciente
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) idPaciente: number,
    @Body() updatePatientDto: UpdatePatientDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.patientService.updatePatient(
      idPaciente,
      updatePatientDto,
      profesional.idProfesional,
    );
  }
}
