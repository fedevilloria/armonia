import { IsInt, IsPositive, Matches } from 'class-validator';
import { GetFreeSlotsDto } from './get-free-slots.dto';
export class CreateAppointmentDto extends GetFreeSlotsDto {
  @IsInt({ message: 'El paciente debe tener un identificador entero' })
  @IsPositive({ message: 'El identificador del paciente debe ser positivo' })
  patientId!: number;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  startTime!: string;
}
