import { CreateAppointmentService } from './application/services/create-appointment.service';
import { AppointmentTransaction } from './application/ports/appointment-transaction';
import { Clock } from './application/ports/clock';
import { SystemClock } from './infrastructure/system-clock';
import { TypeOrmAppointmentTransaction } from './infrastructure/transactions/typeorm-appointment.transaction';
import {
  PatientAccessFactory,
  UnconfiguredPatientAccessFactory,
} from './infrastructure/transactions/patient-access.factory';
import { AuthModule } from '../../auth/auth.module';
import { AvailabilityModule } from '../availabilities/availability.module';
import { GetFreeSlotsService } from './application/services/get-free-slots.service';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment.repository';
import { AppointmentOrmEntity } from './infrastructure/persistence/appointment.orm-entity';
import { TypeOrmAppointmentRepository } from './infrastructure/repositories/typeorm-appointment.repository';

@Module({
  imports: [
    AuthModule,
    AvailabilityModule,
    TypeOrmModule.forFeature([AppointmentOrmEntity]),
  ],
  controllers: [AppointmentController],
  providers: [
    GetFreeSlotsService,
    CreateAppointmentService,
    { provide: Clock, useClass: SystemClock },
    {
      provide: AppointmentTransaction,
      useClass: TypeOrmAppointmentTransaction,
    },
    {
      provide: PatientAccessFactory,
      useClass: UnconfiguredPatientAccessFactory,
    },
    { provide: APPOINTMENT_REPOSITORY, useClass: TypeOrmAppointmentRepository },
  ],
  exports: [APPOINTMENT_REPOSITORY],
})
export class AppointmentsModule {}
