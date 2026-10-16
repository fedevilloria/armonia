import { Injectable } from '@nestjs/common';

// Implementar una consulta del servidor cuando se defina Usuario-Profesional.
export abstract class ProfessionalIdentityResolver {
  abstract resolve(userId: number): Promise<number | null>;
}

@Injectable()
export class UnconfiguredProfessionalIdentityResolver implements ProfessionalIdentityResolver {
  resolve(_userId: number): Promise<number | null> {
    // No inferir la identidad desde el rol, el JWT o datos del cliente.
    void _userId;
    return Promise.resolve(null);
  }
}
