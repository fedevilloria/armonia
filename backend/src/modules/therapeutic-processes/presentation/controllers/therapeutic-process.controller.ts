
import { Controller, Post, Body } from '@nestjs/common';
import { TherapeuticProcessService } from '../../application/services/therapeutic-process.service';
import { CreateTherapeuticProcessDto } from '../../application/dto/create-therapeutic-process.dto';
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

  @Post()
  async create(
    @Body() createDto: CreateTherapeuticProcessDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    const profesional = await this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );

    return this.processService.create(
      createDto,
      profesional.idProfesional,
    );
  }
}
