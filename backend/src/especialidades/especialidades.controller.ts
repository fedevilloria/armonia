import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { EspecialidadesService } from './especialidades.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('especialidades')
export class EspecialidadesController {
  constructor(
    private readonly especialidadesService: EspecialidadesService,
  ) {}

  @Post()
  @Roles('ADMINISTRADOR')
  crear(
    @Body() createEspecialidadDto: CreateEspecialidadDto,
  ) {
    return this.especialidadesService.crear(
      createEspecialidadDto,
    );
  }

  @Get()
  listar() {
    return this.especialidadesService.listarActivas();
  }

  @Get(':id')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.especialidadesService.buscarPorId(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR')
  modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEspecialidadDto: UpdateEspecialidadDto,
  ) {
    return this.especialidadesService.modificar(
      id,
      updateEspecialidadDto,
    );
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  darDeBaja(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.especialidadesService.darDeBaja(id);
  }
}