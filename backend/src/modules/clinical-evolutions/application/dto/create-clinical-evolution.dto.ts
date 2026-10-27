import {IsInt, IsNotEmpty, IsString} from 'class-validator';

export class CreateClinicalEvolutionDto{
    @IsInt()
    @IsNotEmpty()
    idHistoriaClinica!: number;

    @IsInt()
    @IsNotEmpty()
    idTurno!: number;

    @IsString()
    @IsNotEmpty()
    descripcion!: string;
}