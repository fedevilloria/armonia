import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { ProfessionalIdentityGuard } from './guards/professional-identity.guard';
import {
  ProfessionalIdentityResolver,
  UnconfiguredProfessionalIdentityResolver,
} from './professional-identity.resolver';

@Module({
  imports: [
    UsuariosModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  exports: [ProfessionalIdentityGuard, ProfessionalIdentityResolver],
  providers: [
    AuthService,
    ProfessionalIdentityGuard,
    {
      provide: ProfessionalIdentityResolver,
      useClass: UnconfiguredProfessionalIdentityResolver,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
