import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../usuarios/entities/rol.entity';
import { initializeFirstAdmin } from './initial-admin.service';

const valid = () => ({
  firstName: 'Ana',
  lastName: 'Prueba',
  email: 'ana@example.com',
  password: 'Example-123!',
});
function fixture() {
  let admin = false;
  let saved: Usuario | undefined;

  let lock = Promise.resolve();
  const users = {
    exists: jest.fn(() => Promise.resolve(admin)),
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((dto: Usuario) => dto),
    save: jest.fn((dto: Usuario) => {
      saved = dto;
      admin = true;
      return Promise.resolve({ ...dto, idUsuario: 1 });
    }),
  };
  const roles = {
    findOne: jest.fn(() =>
      Promise.resolve({ idRol: 7, nombre: 'ADMINISTRADOR' }),
    ),
  };
  const manager = {
    query: jest.fn(async (sql: string) => {
      if (sql.startsWith('SELECT'))
        return [
          {
            database: 'armonia',
            schema: 'public',
            address: '::1/128',
            port: 5432,
            version: '18.3',
          },
        ];
      if (sql.includes('usuarios')) {
        let unlock!: () => void;
        const previous = lock;
        lock = new Promise<void>((resolve) => {
          unlock = resolve;
        });
        await previous;
        return [{ unlock }];
      }
      return [];
    }),
    getRepository: jest.fn((entity: unknown) =>
      entity === Rol ? roles : users,
    ),
  };
  // Cada conexion retiene el bloqueo hasta finalizar su transaccion.
  const makeSource = () => ({
    options: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'armonia',
      synchronize: false,
    },
    isInitialized: true,
    initialize: jest.fn(() => Promise.resolve(undefined)),
    destroy: jest.fn(() => Promise.resolve(undefined)),
    transaction: jest.fn(
      async (
        _level: string,
        action: (transactionManager: {
          query: (sql: string) => ReturnType<typeof manager.query>;
          getRepository: typeof manager.getRepository;
        }) => Promise<void>,
      ) => {
        let ownRelease: (() => void) | undefined;
        const local = {
          ...manager,
          query: async (sql: string) => {
            const result = await manager.query(sql);
            if (sql.includes('usuarios'))
              ownRelease = (result[0] as unknown as { unlock: () => void })
                .unlock;
            return result;
          },
        };
        try {
          return await action(local);
        } finally {
          ownRelease?.();
        }
      },
    ),
  });
  const source = makeSource();
  return {
    source,
    makeSource,
    manager,
    users,
    roles,
    get saved() {
      return saved;
    },
    asSource: source as unknown as DataSource,
  };
}

describe('Initial administrator', () => {
  it('reuses user creation, hashes the password and selects the persisted role', async () => {
    const f = fixture();
    await initializeFirstAdmin(f.asSource, valid());
    expect(f.saved?.rol.idRol).toBe(7);
    expect(await bcrypt.compare(valid().password, f.saved!.contrasena)).toBe(
      true,
    );
    expect(f.saved?.contrasena).not.toBe(valid().password);
    expect(f.source.transaction).toHaveBeenCalledWith(
      'READ COMMITTED',
      expect.any(Function),
    );
    expect(f.source.destroy).toHaveBeenCalled();
  });
  it('rejects a second initialization', async () => {
    const f = fixture();
    await initializeFirstAdmin(f.asSource, valid());
    await expect(
      initializeFirstAdmin(f.makeSource() as unknown as DataSource, valid()),
    ).rejects.toThrow('Ya existe un administrador');
    expect(f.users.save).toHaveBeenCalledTimes(1);
  });
  it('serializes concurrent initializations through the database table lock', async () => {
    const f = fixture();
    const results = await Promise.allSettled([
      initializeFirstAdmin(f.asSource, valid()),
      initializeFirstAdmin(f.makeSource() as unknown as DataSource, {
        ...valid(),
        email: 'other@example.com',
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(f.users.save).toHaveBeenCalledTimes(1);
    expect(f.manager.query).toHaveBeenCalledWith(
      'LOCK TABLE public.usuarios IN SHARE ROW EXCLUSIVE MODE',
    );
  });
  it.each([
    { email: 'invalid' },
    { password: 'short' },
    { firstName: ' ' },
    { lastName: '' },
    { password: 'é'.repeat(37) },
  ])('rejects invalid input %j', async (patch) => {
    const f = fixture();
    await expect(
      initializeFirstAdmin(f.asSource, { ...valid(), ...patch }),
    ).rejects.toThrow('Datos inválidos');
    expect(f.users.save).not.toHaveBeenCalled();
  });
  it('requires the administrator role', async () => {
    const f = fixture();
    f.roles.findOne.mockResolvedValue(null as never);
    await expect(initializeFirstAdmin(f.asSource, valid())).rejects.toThrow(
      'No existe el rol',
    );
    expect(f.users.save).not.toHaveBeenCalled();
  });
  it.each([
    { host: 'remote' },
    { port: 5433 },
    { database: 'other' },
    { synchronize: true },
    { migrationsRun: true },
    { dropSchema: true },
    { schema: 'other' },
  ])('rejects unsafe configuration %j', async (patch) => {
    const f = fixture();
    Object.assign(f.source.options, patch);
    await expect(initializeFirstAdmin(f.asSource, valid())).rejects.toThrow(
      'El destino',
    );
    expect(f.source.initialize).not.toHaveBeenCalled();
  });
  it('checks actual server identity before locking or writing', async () => {
    const f = fixture();
    f.manager.query.mockResolvedValueOnce([{ database: 'other' }] as never);
    await expect(initializeFirstAdmin(f.asSource, valid())).rejects.toThrow(
      'La instancia',
    );
    expect(f.users.save).not.toHaveBeenCalled();
  });
  it('sanitizes connection failures', async () => {
    const f = fixture();
    f.source.initialize.mockRejectedValue(
      new Error('secret connection details'),
    );
    await expect(initializeFirstAdmin(f.asSource, valid())).rejects.toThrow(
      'Verifique la conexión',
    );
    expect(f.source.transaction).not.toHaveBeenCalled();
  });
  it('propagates failure out of the transaction without exposing database details', async () => {
    const f = fixture();
    f.users.save.mockRejectedValue(new Error('secret SQL'));
    await expect(initializeFirstAdmin(f.asSource, valid())).rejects.toThrow(
      'No se pudo crear',
    );
    expect(f.source.destroy).toHaveBeenCalled();
  });
});
