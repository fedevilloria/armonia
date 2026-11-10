
import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { TherapeuticProcessService } from '../../application/services/therapeutic-process.service';
import { CreateTherapeuticProcessDto } from '../../application/dto/create-therapeutic-process.dto';
import { ChangeTherapeuticProcessStateDto } from '../../application/dto/change-therapeutic-process-state.dto';

import { ProfesionalesService } from '../../../../profesionales/profesionales.service';
import { UsuarioActual } from '../../../../auth/decorators/usuario-actual.decorator';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import type { UsuarioAutenticado } from '../../../../auth/interfaces/usuario-autenticado.interface';

@Controller('procesos-terapeuticos')
@Roles('PROFESIONAL')
export class TherapeuticProcessController {
  constructor(
    private readonly processService: TherapeuticProcessService,
    private readonly profesionalesService: ProfesionalesService,
  ) {}

  // Crear un proceso terapéutico
  @Post()
  async create(
    @Body() createDto: CreateTherapeuticProcessDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional =
      await this.profesionalesService.buscarPorUsuario(
        usuario.sub,
      );

    return this.processService.create(
      createDto,
      profesional.idProfesional,
    );
  }

  // Cambiar el estado de un proceso terapéutico
  @Patch(':id/estado')
  async changeState(
    @Param('id', ParseIntPipe) idProcesoTerapeutico: number,
    @Body() dto: ChangeTherapeuticProcessStateDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional =
      await this.profesionalesService.buscarPorUsuario(
        usuario.sub,
      );

    return this.processService.changeState(
      idProcesoTerapeutico,
      dto,
      profesional.idProfesional,
    );
  }
}
