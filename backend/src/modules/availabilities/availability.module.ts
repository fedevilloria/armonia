import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateAvailabilityService } from './application/services/create-availability.service';
import { AVAILABILITY_REPOSITORY } from './domain/repositories/availability.repository';
import { AvailabilityOrmEntity } from './infrastructure/persistence/availability.orm-entity';
import { TypeOrmAvailabilityRepository } from './infrastructure/repositories/typeorm-availability.repository';
import { AvailabilityController } from './presentation/controllers/availability.controller';

/**
 * Agrupa y configura los componentes relacionados con
 * la gestion de disponibilidades horarias.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilityOrmEntity]),
  ],

  controllers: [
    AvailabilityController,
  ],

  providers: [
    CreateAvailabilityService,

    {
      provide: AVAILABILITY_REPOSITORY,
      useClass: TypeOrmAvailabilityRepository,
    },
  ],
})
export class AvailabilityModule {}