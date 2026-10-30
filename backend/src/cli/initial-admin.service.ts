import { validateSync } from 'class-validator';
import { DataSource } from 'typeorm';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../usuarios/entities/rol.entity';
import { UsuariosService } from '../usuarios/usuarios.service';

export class InitialAdminError extends Error {}

export interface InitialAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function initializeFirstAdmin(
  source: DataSource,
  input: InitialAdminInput,
): Promise<void> {
  if (
    source.options.type !== 'postgres' ||
    source.options.host !== 'localhost' ||
    source.options.port !== 5432 ||
    source.options.database !== 'armonia' ||
    source.options.synchronize !== false ||
    source.options.dropSchema === true ||
    (source.options.schema !== undefined &&
      source.options.schema !== 'public') ||
    source.options.migrationsRun === true
  ) {
    throw new InitialAdminError(
      'El destino debe ser la base local armonia en localhost:5432, sin sincronización ni migraciones automáticas.',
    );
  }
  try {
    await source.initialize();
    await source.transaction('READ COMMITTED', async (manager) => {
      const [identity] = await manager.query<
        {
          database: string;
          schema: string;
          address: string;
          port: number;
          version: string;
        }[]
      >(
        "SELECT current_database() AS database, current_schema() AS schema, inet_server_addr()::text AS address, inet_server_port() AS port, current_setting('server_version') AS version",
      );
      if (
        !identity ||
        identity.database !== 'armonia' ||
        identity.schema !== 'public' ||
        identity.port !== 5432 ||
        !['127.0.0.1/32', '::1/128'].includes(identity.address) ||
        identity.version !== '18.3'
      ) {
        throw new InitialAdminError(
          'La instancia conectada no coincide con PostgreSQL 18.3 local, base armonia y esquema public.',
        );
      }
      // Serializa las inicializaciones y bloquea otras escrituras hasta confirmar.
      await manager.query('LOCK TABLE public.roles IN SHARE MODE');
      await manager.query(
        'LOCK TABLE public.usuarios IN SHARE ROW EXCLUSIVE MODE',
      );
      const roles = manager.getRepository(Rol);
      const users = manager.getRepository(Usuario);
      const role = await roles.findOne({ where: { nombre: 'ADMINISTRADOR' } });
      if (!role) throw new InitialAdminError('No existe el rol ADMINISTRADOR.');
      if (await users.exists({ where: { rol: { idRol: role.idRol } } })) {
        throw new InitialAdminError(
          'Ya existe un administrador. La inicialización fue rechazada.',
        );
      }
      const dto = Object.assign(new CreateUsuarioDto(), {
        nombre: input.firstName.trim(),
        apellido: input.lastName.trim(),
        correoElectronico: input.email.trim(),
        contrasena: input.password,
        idRol: role.idRol,
      });
      if (
        validateSync(dto).length ||
        Buffer.byteLength(input.password, 'utf8') > 72
      ) {
        throw new InitialAdminError(
          'Datos inválidos: revise nombre, apellido, correo y contraseña (mínimo 8 caracteres y máximo 72 bytes UTF-8).',
        );
      }
      try {
        await new UsuariosService(users, roles).crear(dto);
      } catch {
        throw new InitialAdminError(
          'No se pudo crear el administrador. Verifique los datos y que el correo no esté registrado.',
        );
      } finally {
        dto.contrasena = '';
      }
    });
  } catch (error) {
    if (error instanceof InitialAdminError) throw error;
    throw new InitialAdminError(
      'No se pudo completar la inicialización. Verifique la conexión, los permisos y las migraciones.',
    );
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}
