import { Availability } from '../entities/availability.entity';
import { DayOfWeek } from '../enums/day-of-week.enum';

/**
 * Token utilizado por NestJS para identificar
 * la implementacion del repositorio de disponibilidades.
 */
export const AVAILABILITY_REPOSITORY = Symbol(
  'AVAILABILITY_REPOSITORY',
);

/**
 * Define las operaciones necesarias para acceder y persistir
 * disponibilidades horarias.
 *
 * Esta interfaz pertenece al dominio y no depende de una tecnologia
 * especifica de persistencia.
 */
export interface AvailabilityRepository {
  /**
   * Guarda una disponibilidad horaria.
   *
   * @param availability Disponibilidad que se desea persistir.
   * @returns Disponibilidad almacenada con su identificador asignado.
   */
  save(availability: Availability): Promise<Availability>;

  /**
   * Busca las disponibilidades de un profesional para un dia determinado.
   *
   * Esta operacion permite verificar posteriormente si existen bloques
   * horarios que puedan superponerse con una nueva disponibilidad.
   *
   * @param professionalId Identificador del profesional.
   * @param dayOfWeek Dia de la semana que se desea consultar.
   * @returns Disponibilidades encontradas para el profesional y dia indicados.
   */
  findByProfessionalAndDay(
    professionalId: number,
    dayOfWeek: DayOfWeek,
  ): Promise<Availability[]>;
}