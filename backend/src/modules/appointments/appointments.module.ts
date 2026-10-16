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
    { provide: APPOINTMENT_REPOSITORY, useClass: TypeOrmAppointmentRepository },
  ],
  exports: [APPOINTMENT_REPOSITORY],
})
export class AppointmentsModule {}
