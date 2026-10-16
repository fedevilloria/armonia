import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../usuarios/entities/rol.entity';
import { AvailabilityOrmEntity } from '../modules/availabilities/infrastructure/persistence/availability.orm-entity';
import { AppointmentOrmEntity } from '../modules/appointments/infrastructure/persistence/appointment.orm-entity';

// Registro compartido por la aplicacion y el CLI de migraciones.
export const databaseEntities = [
  Usuario,
  Rol,
  AvailabilityOrmEntity,
  AppointmentOrmEntity,
];
