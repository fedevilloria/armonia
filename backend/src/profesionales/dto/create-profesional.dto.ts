import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProfesionalDto {
  // Datos del usuario

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido!: string;

  @IsEmail()
  @IsNotEmpty()
  correoElectronico!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  contrasena!: string;

  // Datos profesionales

  @IsInt()
  idTipoDocumento!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nroDNI!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  matricula!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefono!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcionProfesional!: string;

  @IsInt()
  idEspecialidad!: number;
}