import { IsBoolean, IsDateString, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
    @IsString()
    nombre!: string;

    @IsString()
    apellido!: string;

    @IsString()
    telefono!: string;

    @IsEmail()
    correoElectronico!: string;

    @IsNumber()
    idTipoDocumento!: number;

    @IsString()
    numeroDocumento!: string;

    @IsDateString()
    fechaNacimiento!: Date;

    @IsString()
    direccion!: string;

    @IsOptional()
    @IsString()
    nombreContactoEmergencia?: string;

    @IsOptional()
    @IsString()
    telefonoContactoEmergencia?: string;
    
    @IsOptional()
    @IsBoolean()
    pareja?: boolean;
}   