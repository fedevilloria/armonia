import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  correoElectronico!: string;

  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}