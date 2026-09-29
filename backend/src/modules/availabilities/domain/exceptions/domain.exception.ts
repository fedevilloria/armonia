/**
 * Representa un error producido por el incumplimiento
 * de una regla del dominio.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'DomainException';
  }
}