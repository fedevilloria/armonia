import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistoriesModule } from './modules/clinical-histories/clinical-histories.module';
import { TherapeuticProcessesModule } from './modules/therapeutic-processes/therapeutic-processes.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ClinicalEvolutionsModule } from './modules/clinical-evolutions/clinical-evolutions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),

        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    ClinicalHistoriesModule,
    TherapeuticProcessesModule,
    PatientsModule,
    ClinicalEvolutionsModule,
  ],
})
export class AppModule {}