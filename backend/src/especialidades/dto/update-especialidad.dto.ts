import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateEspecialidadDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}