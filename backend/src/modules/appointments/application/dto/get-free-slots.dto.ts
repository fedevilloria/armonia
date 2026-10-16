import { ValidateBy } from 'class-validator';
import { isCivilDate } from '../../domain/value-objects/civil-date';

export class GetFreeSlotsDto {
  @ValidateBy(
    { name: 'isCivilDate', validator: { validate: isCivilDate } },
    { message: 'La fecha debe ser una fecha válida con formato YYYY-MM-DD' },
  )
  date!: string;
}
