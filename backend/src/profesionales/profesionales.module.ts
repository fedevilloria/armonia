import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Profesional } from './entities/profesional.entity';
import { TipoDocumento } from './entities/tipo-documento.entity';

import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../usuarios/entities/rol.entity';
import { Especialidad } from '../especialidades/entities/especialidad.entity';

import { ProfesionalesService } from './profesionales.service';
import { ProfesionalesController } from './profesionales.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profesional,
      TipoDocumento,
      Usuario,
      Rol,
      Especialidad,
    ]),
  ],

  controllers: [
    ProfesionalesController,
  ],

  providers: [
    ProfesionalesService,
  ],

  exports: [
    ProfesionalesService,
  ],
})
export class ProfesionalesModule {}