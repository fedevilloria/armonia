import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '../../domain/enums/day-of-week.enum';

/**
 * Define los datos necesarios para registrar una nueva
 * disponibilidad horaria.
 *
 * Tambien realiza las validaciones basicas sobre los datos
 * recibidos desde la API.
 */
export class CreateAvailabilityDto {
  /**
   * Dia de la semana en el que el profesional estara disponible.
   */
  @IsNotEmpty({ message: 'El día de la semana es obligatorio.' })
  @IsEnum(DayOfWeek, {
    message: 'El día de la semana ingresado no es válido.',
  })
  dayOfWeek!: DayOfWeek;

  /**
   * Hora de inicio del bloque de disponibilidad.
   * Debe utilizar el formato HH:mm.
   */
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de inicio debe tener el formato HH:mm.',
  })
  startTime!: string;

  /**
   * Hora de finalizacion del bloque de disponibilidad.
   * Debe utilizar el formato HH:mm.
   */
  @IsNotEmpty({ message: 'La hora de finalización es obligatoria.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de finalización debe tener el formato HH:mm.',
  })
  endTime!: string;

  /**
   * Duracion de cada turno expresada en minutos.
   */
  @IsInt({ message: 'La duración debe ser un número entero.' })
  @IsPositive({ message: 'La duración debe ser mayor a cero.' })
  duration!: number;

  /**
   * Fecha desde la cual comienza a aplicarse la disponibilidad.
   */
  @IsNotEmpty({ message: 'La fecha de inicio de vigencia es obligatoria.' })
  @IsDateString(
    {},
    { message: 'La fecha de inicio de vigencia no es válida.' },
  )
  validFrom!: string;

  /**
   * Fecha hasta la cual se aplicara la disponibilidad.
   */
  @IsNotEmpty({ message: 'La fecha de finalización de vigencia es obligatoria.' })
  @IsDateString(
    {},
    { message: 'La fecha de finalización de vigencia no es válida.' },
  )
  validUntil!: string;
}