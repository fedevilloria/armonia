import {
  Controller,
  Get,
} from '@nestjs/common';

import { ProfesionalesService } from './profesionales.service';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';

import type { UsuarioAutenticado } from '../auth/interfaces/usuario-autenticado.interface';

@Controller('profesionales')
export class ProfesionalesController {
  constructor(
    private readonly profesionalesService: ProfesionalesService,
  ) {}

  @Get('me')
  obtenerProfesionalActual(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.profesionalesService.buscarPorUsuario(
      usuario.sub,
    );
  }
}