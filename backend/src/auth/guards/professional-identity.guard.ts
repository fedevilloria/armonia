import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../authenticated-request';
import { ProfessionalIdentityResolver } from '../professional-identity.resolver';

@Injectable()
export class ProfessionalIdentityGuard implements CanActivate {
  constructor(private readonly resolver: ProfessionalIdentityResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    delete request.professionalId;
    if (!request.user)
      throw new UnauthorizedException('Autenticación requerida');
    const professionalId = await this.resolver.resolve(request.user.sub);
    if (
      professionalId === null ||
      !Number.isSafeInteger(professionalId) ||
      professionalId <= 0
    ) {
      throw new ForbiddenException(
        'No tiene un profesional habilitado asociado',
      );
    }
    request.professionalId = professionalId;
    return true;
  }
}
