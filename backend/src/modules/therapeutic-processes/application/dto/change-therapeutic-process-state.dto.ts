
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChangeTherapeuticProcessStateDto {
  @IsInt()
  @IsIn([2, 3, 4], {
    message:
      'El estado debe ser 2 (Dado de alta), 3 (Inactivo) o 4 (Derivado).',
  })
  idEstadoProcesoTerapeutico!: number;

  @IsOptional()
  @IsString()
  motivoFinalizacion?: string;
}
