import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AVAILABILITY_REPOSITORY,
  type AvailabilityRepository,
} from '../../../availabilities/domain/repositories/availability.repository';
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository,
} from '../../domain/repositories/appointment.repository';
import { AppointmentException } from '../../domain/exceptions/appointment.exception';
import { blockingAppointmentStatuses } from '../../domain/policies/blocking-appointment-statuses';
import {
  buildSlots,
  dayOfWeek,
  excludeOccupiedSlots,
} from '../../domain/services/slot-calculator';
import { isCivilDate } from '../../domain/value-objects/civil-date';
import { GetFreeSlotsDto } from '../dto/get-free-slots.dto';
import { FreeSlotsResponseDto } from '../dto/free-slots-response.dto';
@Injectable()
export class GetFreeSlotsService {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: AvailabilityRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}
  async execute(
    professionalId: number,
    dto: GetFreeSlotsDto,
  ): Promise<FreeSlotsResponseDto> {
    if (!isCivilDate(dto.date))
      throw new BadRequestException(
        'La fecha debe ser una fecha válida con formato YYYY-MM-DD',
      );
    try {
      const blocks = await this.availabilityRepository.findByProfessionalAndDay(
        professionalId,
        dayOfWeek(dto.date),
      );
      const slots = buildSlots(professionalId, dto.date, blocks);
      if (!slots.length) return { date: dto.date, slots: [] };
      const appointments =
        await this.appointmentRepository.findByProfessionalAndDate(
          professionalId,
          new Date(dto.date + 'T00:00:00.000Z'),
          [...blockingAppointmentStatuses],
        );
      return {
        date: dto.date,
        slots: excludeOccupiedSlots(
          professionalId,
          dto.date,
          slots,
          appointments,
        ),
      };
    } catch (error) {
      if (
        error instanceof AppointmentException &&
        error.code === 'invalid-schedule'
      )
        throw new InternalServerErrorException(error.message);
      throw error;
    }
  }
}
