import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
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

  @Post()
  @Roles('ADMINISTRADOR')
  crear(
    @Body() createProfesionalDto: CreateProfesionalDto,
  ) {
    return this.profesionalesService.crear(
      createProfesionalDto,
    );
  }
}