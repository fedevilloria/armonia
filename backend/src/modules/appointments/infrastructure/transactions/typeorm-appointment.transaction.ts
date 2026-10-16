import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AppointmentTransaction,
  type AppointmentTransactionContext,
} from '../../application/ports/appointment-transaction';
import { AppointmentException } from '../../domain/exceptions/appointment.exception';
import { dayOfWeek } from '../../domain/services/slot-calculator';
import { AppointmentOrmEntity } from '../persistence/appointment.orm-entity';
import { TypeOrmAppointmentRepository } from '../repositories/typeorm-appointment.repository';
import { AvailabilityOrmEntity } from '../../../availabilities/infrastructure/persistence/availability.orm-entity';
import { TypeOrmAvailabilityRepository } from '../../../availabilities/infrastructure/repositories/typeorm-availability.repository';
import { PatientAccessFactory } from './patient-access.factory';
export const appointmentExclusionConstraint =
  'EX_appointments_professional_time';
@Injectable()
export class TypeOrmAppointmentTransaction implements AppointmentTransaction {
  constructor(
    private readonly dataSource: DataSource,
    private readonly patientAccessFactory: PatientAccessFactory,
  ) {}
  async run<T>(
    professionalId: number,
    date: string,
    work: (context: AppointmentTransactionContext) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.dataSource.transaction(
        'READ COMMITTED',
        async (manager) => {
          // Orden consistente de bloqueos; FOR SHARE impide cambios en los bloques leidos.
          await manager
            .getRepository(AvailabilityOrmEntity)
            .createQueryBuilder('availability')
            .where('availability.professional_id = :professionalId', {
              professionalId,
            })
            .andWhere('availability.day_of_week = :day', {
              day: dayOfWeek(date),
            })
            .orderBy('availability.id', 'ASC')
            .setLock('pessimistic_read')
            .getMany();
          return work({
            appointments: new TypeOrmAppointmentRepository(
              manager.getRepository(AppointmentOrmEntity),
            ),
            availabilities: new TypeOrmAvailabilityRepository(
              manager.getRepository(AvailabilityOrmEntity),
            ),
            patientAccess: this.patientAccessFactory.create(manager),
          });
        },
      );
    } catch (error) {
      if (error instanceof AppointmentException) throw error;
      const failure = error as {
        code?: string;
        constraint?: string;
        driverError?: { code?: string; constraint?: string };
      };
      const driver = failure?.driverError ?? failure;
      if (
        driver?.code === '23P01' &&
        driver.constraint === appointmentExclusionConstraint
      )
        throw new AppointmentException(
          'occupied',
          'El horario solicitado ya no está disponible',
        );
      // No propagar SQL, parametros ni mensajes del controlador PostgreSQL.
      throw new AppointmentException(
        'persistence',
        'No se pudo registrar el turno. Intente nuevamente',
      );
    }
  }
}
