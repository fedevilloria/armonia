import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEspecialidadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcion!: string;
}