import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ProfesionalesModule } from './profesionales/profesionales.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseEntities } from './database/entities';
import { AppointmentsModule } from './modules/appointments/appointments.module';
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
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        entities: databaseEntities,

        synchronize: false,
      }),
    }),

    AvailabilityModule,
    AppointmentsModule,
    UsuariosModule,
    AuthModule,
    ProfesionalesModule,
    EspecialidadesModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
