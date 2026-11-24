import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTherapeuticProcessDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  idPaciente!: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}