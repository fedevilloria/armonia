import type { DataSource, QueryRunner } from 'typeorm';
import {
  cleanupTestDatabase,
  validateTestDatabaseUrl,
  verifyTestDatabaseIdentity,
} from './postgres-test-support';

const validUrl =
  'postgresql://test_user:example_password@localhost:5432/armonia_appointments_test';
const target = () => validateTestDatabaseUrl(validUrl);
const schema = 'booking_test_012345abcdef';
const identity = {
  database: 'armonia_appointments_test',
  address: '::1/128',
  port: 5432,
  serverVersion: '180003',
};
function fixture() {
  const runner = {
    isTransactionActive: true,
    query: jest.fn((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT') ? [identity] : []),
    ),
    rollbackTransaction: jest.fn(() => Promise.resolve()),
    release: jest.fn(() => Promise.resolve()),
  };
  const source = {
    isInitialized: true,
    destroy: jest.fn(() => Promise.resolve()),
  };
  return {
    runner,
    source,
    asRunner: runner as unknown as QueryRunner,
    asSource: source as unknown as DataSource,
  };
}

describe('PostgreSQL test destination safety', () => {
  it.each(['localhost', '127.0.0.1'])(
    'accepts only explicit local target %s',
    (host) => {
      expect(
        validateTestDatabaseUrl(validUrl.replace('localhost', host)),
      ).toMatchObject({
        host,
        port: 5432,
        database: 'armonia_appointments_test',
      });
    },
  );
  it('accepts a suffixed testing database and percent-encoded credentials', () => {
    expect(
      validateTestDatabaseUrl(
        'postgres://user:p%40ss@127.0.0.1:5432/armonia_appointments_test_ci',
      ),
    ).toMatchObject({
      password: 'p@ss',
      database: 'armonia_appointments_test_ci',
    });
  });
  it.each([
    '',
    'invalid',
    validUrl.replace('localhost', 'remote.example.com'),
    validUrl.replace('localhost', '[::1]'),
    validUrl.replace('localhost', '127.1'),
    validUrl.replace('localhost', '2130706433'),
    validUrl.replace('localhost', '%6cocalhost'),
    validUrl.replace(':5432', ''),
    validUrl.replace(':5432', ':5433'),
    validUrl.replace('/armonia_appointments_test', '/armonia'),
    validUrl.replace('/armonia_appointments_test', '/armonia_test'),
    validUrl + '?host=remote.example.com',
    validUrl + '?database=armonia',
    validUrl + '?options=x',
    validUrl + '#ignored',
    validUrl + '/',
    validUrl.replace('postgresql:', 'https:'),
    validUrl.replace('example_password', ''),
    validUrl.replace('test_user', ''),
    validUrl.replace('example_password', '%XX'),
    validUrl.replace('example_password', '%00'),
  ])('rejects ambiguous or unauthorized URL case %#', (url) => {
    expect(() => validateTestDatabaseUrl(url)).toThrow('Destino de pruebas');
    try {
      validateTestDatabaseUrl(url);
    } catch (error) {
      expect((error as Error).message).not.toContain('example_password');
    }
  });
  it('verifies the effective connection using only a SELECT', async () => {
    const f = fixture();
    await expect(
      verifyTestDatabaseIdentity(f.asRunner, target()),
    ).resolves.toBeUndefined();
    expect(f.runner.query).toHaveBeenCalledTimes(1);
    expect(f.runner.query.mock.calls[0][0]).toMatch(/^SELECT /);
  });
  it.each([
    { database: 'armonia' },
    { database: 'armonia_appointments_test_other' },
    { port: 5433 },
    { address: '192.0.2.1/32' },
    { address: null },
    { serverVersion: 'unknown' },
  ])('rejects effective identity mismatch %j', async (patch) => {
    const f = fixture();
    f.runner.query.mockResolvedValue([{ ...identity, ...patch }] as never);
    await expect(
      verifyTestDatabaseIdentity(f.asRunner, target()),
    ).rejects.toThrow('identidad real');
  });
});

describe('PostgreSQL test resource cleanup', () => {
  it('rolls back, drops only its schema, releases and closes in order', async () => {
    const f = fixture();
    await cleanupTestDatabase(f.asSource, [f.asRunner], f.asRunner, schema);
    expect(f.runner.query).toHaveBeenCalledWith(
      'DROP SCHEMA "' + schema + '" CASCADE',
    );
    expect(
      f.runner.rollbackTransaction.mock.invocationCallOrder[0],
    ).toBeLessThan(f.runner.query.mock.invocationCallOrder[0]);
    expect(f.runner.query.mock.invocationCallOrder[0]).toBeLessThan(
      f.runner.release.mock.invocationCallOrder[0],
    );
    expect(f.runner.release.mock.invocationCallOrder[0]).toBeLessThan(
      f.source.destroy.mock.invocationCallOrder[0],
    );
  });
  it.each(['rollback', 'drop', 'release', 'pool'])(
    'always attempts remaining cleanup after %s failure',
    async (stage) => {
      const f = fixture();
      const secretError = new Error('postgres://private:password@host/db');
      if (stage === 'rollback')
        f.runner.rollbackTransaction.mockRejectedValue(secretError);
      if (stage === 'drop') f.runner.query.mockRejectedValue(secretError);
      if (stage === 'release') f.runner.release.mockRejectedValue(secretError);
      if (stage === 'pool') f.source.destroy.mockRejectedValue(secretError);
      await expect(
        cleanupTestDatabase(f.asSource, [f.asRunner], f.asRunner, schema),
      ).rejects.toThrow('Limpieza de pruebas incompleta');
      expect(f.runner.release).toHaveBeenCalled();
      expect(f.source.destroy).toHaveBeenCalled();
    },
  );
  it('aggregates failures without leaking underlying errors', async () => {
    const f = fixture();
    f.runner.query.mockRejectedValue(new Error(validUrl));
    f.runner.release.mockRejectedValue(new Error(validUrl));
    let message = '';
    try {
      await cleanupTestDatabase(f.asSource, [f.asRunner], f.asRunner, schema);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('eliminación');
    expect(message).toContain('liberación');
    expect(message).not.toContain('example_password');
    expect(f.source.destroy).toHaveBeenCalled();
  });
  it('does not run DDL when setup never created a schema', async () => {
    const f = fixture();
    await cleanupTestDatabase(f.asSource, [f.asRunner], f.asRunner, undefined);
    expect(f.runner.query).not.toHaveBeenCalled();
  });
  it('refuses unsafe schema names while still releasing resources', async () => {
    const f = fixture();
    await expect(
      cleanupTestDatabase(f.asSource, [f.asRunner], f.asRunner, 'public'),
    ).rejects.toThrow('nombre de esquema');
    expect(f.runner.query).not.toHaveBeenCalled();
    expect(f.source.destroy).toHaveBeenCalled();
  });
  it('handles a failure before source creation', async () => {
    await expect(
      cleanupTestDatabase(undefined, [], undefined, undefined),
    ).resolves.toBeUndefined();
  });
  it('releases attempted connections even without an active transaction', async () => {
    const f = fixture();
    f.runner.isTransactionActive = false;
    f.source.isInitialized = false;
    await cleanupTestDatabase(f.asSource, [f.asRunner], undefined, undefined);
    expect(f.runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(f.runner.release).toHaveBeenCalled();
    expect(f.source.destroy).not.toHaveBeenCalled();
  });
});
