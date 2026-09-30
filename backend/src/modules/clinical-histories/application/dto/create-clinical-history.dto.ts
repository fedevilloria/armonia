import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateClinicalHistoryDto {
    @IsNumber()
    @IsNotEmpty()
    idProcesoTerapeutico!: number;

    @IsString()
    @IsNotEmpty()
    motivoConsulta!: string;

    @IsString()
    @IsNotEmpty()
    antecedentes!: string;

    @IsString()
    @IsNotEmpty()
    diagnostico!: string;

}