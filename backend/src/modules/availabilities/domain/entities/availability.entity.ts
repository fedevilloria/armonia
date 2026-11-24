import { DayOfWeek } from '../enums/day-of-week.enum';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Representa la disponibilidad horaria configurada por un profesional.
 *
 * Define el dia, rango horario, duración de los turnos y periodo
 * durante el cual dicha disponibilidad se encuentra vigente.
 */
export class Availability {
  constructor(
    /** Identificador único de la disponibilidad. Es null antes de persistirse. */
    public readonly id: number | null,

    /** Identificador del profesional al que pertenece la disponibilidad. */
    public readonly professionalId: number,

    /** Dia de la semana en el que el profesional se encuentra disponible. */
    public readonly dayOfWeek: DayOfWeek,

    /** Hora a partir de la cual comienza la disponibilidad. Formato HH:mm. */
    public readonly startTime: string,

    /** Hora en la que finaliza la disponibilidad. Formato HH:mm. */
    public readonly endTime: string,

    /** Duracion de cada turno expresada en minutos. */
    public readonly duration: number,

    /** Fecha a partir de la cual comienza a aplicarse esta disponibilidad. */
    public readonly validFrom: Date,

    /** Fecha hasta la cual se aplica esta disponibilidad. */
    public readonly validUntil: Date,
  ) {
    this.validate();
  }

  /**
   * Valida las reglas propias de una disponibilidad horaria.
   *
   * @throws Error si alguno de los datos no cumple con las reglas
   * del dominio.
   */
  private validate(): void {
    if (this.duration <= 0) {
      throw new DomainException('La duración del turno debe ser mayor a cero.');
    }

    if (this.startTime >= this.endTime) {
      throw new DomainException(
        'La hora de inicio debe ser anterior a la hora de finalización.',
      );
    }

    if (this.validFrom > this.validUntil) {
      throw new DomainException(
        'La fecha de inicio de vigencia debe ser anterior a la fecha de finalización.',
      );
    }
  }
}