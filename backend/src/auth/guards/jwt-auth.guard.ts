import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    delete request.user;
    const parts = request.headers.authorization?.split(' ') ?? [];
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new UnauthorizedException('Token no proporcionado o inválido');
    }
    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(
        parts[1],
      );
      if (
        !payload ||
        !Number.isSafeInteger(payload.sub) ||
        payload.sub <= 0 ||
        typeof payload.rol !== 'string' ||
        !payload.rol.trim()
      ) {
        throw new Error('Invalid identity');
      }
      request.user = { sub: payload.sub, rol: payload.rol };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return true;
  }
}
