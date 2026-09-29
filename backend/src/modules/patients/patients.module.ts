import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

// se importa el controlador (Presentacion)
import {PatientController} from './presentation/controllers/patient.controller';

//se importa el servicio (Aplicacion)
import {PatientService} from './application/services/patient.service';

//se importa la entidad y el repositorio (Infraestructura / Persistencia)
import {PatientRepository} from './infrastructure/repositories/patient.repository';
import {PatientOrmEntity} from './infrastructure/persistence/patient.orm-entity';


@Module({
  imports: [
    // se registra la entidad de typeORM para que nestJs sepa que pertence a este modulo
    TypeOrmModule.forFeature([PatientOrmEntity])
],
  controllers: [
    // registrmaos el controlados para habilitat las rutas HTTP
    PatientController
],
  providers: [
    // se registra el servicio
    PatientService,

    // se le dice a nestJS: "cuando alguien pida la interfaz "IPatientRepository"", se entrega la clase real "PatientRepository" que se conecta a PostgreSQL
    { 
        provide: 'PatientRepository', 
        useClass: PatientRepository 
    }
],
exports: [
    // se exporta el servicio por si el modulo de tunos o procesos terapeuticos se necesita más adelante  
    PatientService,
]
})
export class PatientsModule {}