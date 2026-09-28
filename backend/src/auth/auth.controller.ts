import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil() {
    return {
      mensaje: 'Acceso autorizado',
    };
  }

  @Get('admin')
  @Roles('ADMINISTRADOR')
  @UseGuards(JwtAuthGuard, RolesGuard)
  soloAdministrador() {
    return {
      mensaje: 'Acceso autorizado como administrador',
    };
  }
}