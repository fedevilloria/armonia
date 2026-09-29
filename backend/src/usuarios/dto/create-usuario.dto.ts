import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsEmail()
  @IsNotEmpty()
  correoElectronico!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  contrasena!: string;

  @IsInt()
  idRol!: number;
}