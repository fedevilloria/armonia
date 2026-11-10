import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsString()
  @IsNotEmpty()
  telefono!: string;

  @IsEmail()
  correoElectronico!: string;

  @IsInt()
  @Min(1)
  idTipoDocumento!: number;

  @IsString()
  @IsNotEmpty()
  numeroDocumento!: string;

  @IsDateString({ strict: true })
  fechaNacimiento!: string;

  @IsString()
  @IsNotEmpty()
  direccion!: string;

  @IsOptional()
  @IsString()
  nombreContactoEmergencia?: string;

  @IsOptional()
  @IsString()
  telefonoContactoEmergencia?: string;
}
