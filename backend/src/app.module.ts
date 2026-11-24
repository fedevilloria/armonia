
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistoriesModule } from './modules/clinical-histories/clinical-histories.module';
import { TherapeuticProcessesModule } from './modules/therapeutic-processes/therapeutic-processes.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ClinicalEvolutionsModule } from './modules/clinical-evolutions/clinical-evolutions.module';

import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ProfesionalesModule } from './profesionales/profesionales.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';
import { AvailabilityModule } from './modules/availabilities/availability.module';


/**
 * Modulo raiz de la aplicacion.
 *
 * Configura los componentes globales y registra
 * los modulos funcionales del sistema.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    ClinicalHistoriesModule,
    
    AvailabilityModule,
    UsuariosModule,
    AuthModule,
    ProfesionalesModule,
    EspecialidadesModule,
    PatientsModule,
    TherapeuticProcessesModule,
    PatientsModule,
    ClinicalEvolutionsModule,
  ],
})

export class AppModule {}
