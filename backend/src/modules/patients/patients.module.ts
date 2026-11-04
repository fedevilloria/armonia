
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProfesionalesModule } from '../../profesionales/profesionales.module';

// Se importa el controlador (Presentacion)
import { PatientController } from './presentation/controllers/patient.controller';

// Se importa el servicio (Aplicacion)
import { PatientService } from './application/services/patient.service';

// Se importa la entidad y el repositorio (Infraestructura / Persistencia)
import { PatientRepository } from './infrastructure/repositories/patient.repository';
import { PatientOrmEntity } from './infrastructure/persistence/patient.orm-entity';

@Module({
  imports: [
    // Se registra la entidad de TypeORM para que NestJS sepa que pertenece a este modulo
    TypeOrmModule.forFeature([PatientOrmEntity]),

    // Permite utilizar ProfesionalesService desde el controlador de Pacientes
    ProfesionalesModule,
  ],

  controllers: [
    // Registramos el controlador para habilitar las rutas HTTP
    PatientController,
  ],

  providers: [
    // Se registra el servicio
    PatientService,

    // Cuando se solicite IPatientRepository, se utiliza PatientRepository
    // para acceder a PostgreSQL
    {
      provide: 'IPatientRepository',
      useClass: PatientRepository,
    },
  ],

  exports: [
    // Se exporta el servicio por si el modulo de turnos
    // o procesos terapeuticos lo necesita mas adelante
    PatientService,
  ],
})
export class PatientsModule {}
