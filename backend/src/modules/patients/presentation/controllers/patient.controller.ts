
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
import { ProfesionalesService } from '../../../../profesionales/profesionales.service';
import { UsuarioActual } from '../../../../auth/decorators/usuario-actual.decorator';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import type { UsuarioAutenticado } from '../../../../auth/interfaces/usuario-autenticado.interface';

@Controller('patients') // esta sera la ruta base: http://localhost:3000/patients
@Roles('PROFESIONAL')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly profesionalesService: ProfesionalesService,
  ) {}

  // 1. Registrar paciente (POST)
  @Post()
  async create(
    @Body() createPatientDto: any,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    // Obtener el profesional asociado al usuario autenticado
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.patientService.createPatient(
      createPatientDto,
      profesional.idProfesional,
    );
  }

  // 2. Consultar pacientes asignados al profesional (GET)
  @Get()
  async findAll(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    // Obtener el profesional asociado al usuario autenticado
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.patientService.getMyPatients(
      profesional.idProfesional,
    );
  }

  // 3. Modificar paciente (PUT)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) idPaciente: number,
    @Body() updatePatientDto: any,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    // Obtener el profesional asociado al usuario autenticado
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
