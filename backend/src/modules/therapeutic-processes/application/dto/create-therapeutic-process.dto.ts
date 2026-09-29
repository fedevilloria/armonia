import {IsInt, IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class CreateTherapeuticProcessDto {
    @IsInt()
    @IsNotEmpty()
    idPaciente!: number;

    @IsInt()
    @IsNotEmpty()
    idProfesional!: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
}

  