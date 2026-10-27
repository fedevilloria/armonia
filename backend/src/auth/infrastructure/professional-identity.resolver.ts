import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ProfesionalesService } from '../../profesionales/profesionales.service';
import { ProfessionalIdentityResolver } from '../professional-identity.resolver';

@Injectable()
export class PersistedProfessionalIdentityResolver implements ProfessionalIdentityResolver {
  constructor(private readonly professionalsService: ProfesionalesService) {}

  async resolve(userId: number): Promise<number | null> {
    if (!Number.isSafeInteger(userId) || userId <= 0) return null;
    try {
      const professional =
        await this.professionalsService.buscarPorUsuario(userId);
      if (
        professional.fechaBaja !== null ||
        !Number.isSafeInteger(professional.idProfesional) ||
        professional.idProfesional <= 0
      )
        return null;
      return professional.idProfesional;
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      // No revelar SQL ni datos personales si falla la consulta de identidad.
      throw new ServiceUnavailableException(
        'No se pudo verificar la identidad profesional',
      );
    }
  }
}
