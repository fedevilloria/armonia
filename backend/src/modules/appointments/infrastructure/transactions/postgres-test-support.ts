import type { DataSource, QueryRunner } from 'typeorm';

export class PostgresTestSafetyError extends Error {}

export interface TestDatabaseTarget {
  host: 'localhost' | '127.0.0.1';
  port: 5432;
  database: string;
  username: string;
  password: string;
}

export function validateTestDatabaseUrl(value: string): TestDatabaseTarget {
  try {
    // Sin parametros, fragmentos, hosts alternativos ni credenciales del entorno.
    const match =
      /^(postgres|postgresql):\/\/([^@/?#\s]+)@(localhost|127\.0\.0\.1):5432\/(armonia_appointments_test[a-z0-9_]*)$/.exec(
        value,
      );
    if (!match) throw new Error();
    const url = new URL(value);
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    if (
      !username ||
      !password ||
      Array.from(username + password).some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      )
    )
      throw new Error();
    return {
      host: match[3] as TestDatabaseTarget['host'],
      port: 5432,
      database: match[4],
      username,
      password,
    };
  } catch {
    throw new PostgresTestSafetyError(
      'Destino de pruebas inválido: use PostgreSQL local, puerto 5432 y una base armonia_appointments_test, sin parámetros adicionales.',
    );
  }
}

export async function verifyTestDatabaseIdentity(
  runner: QueryRunner,
  target: TestDatabaseTarget,
): Promise<void> {
  const rows: unknown = await runner.query(
    `SELECT current_database() AS database, inet_server_addr()::text AS address, inet_server_port() AS port, current_setting('server_version_num') AS "serverVersion"`,
  );
  const [identity] = rows as {
    database: string;
    address: string;
    port: number;
    serverVersion: string;
  }[];
  if (
    !identity ||
    identity.database !== target.database ||
    !/^armonia_appointments_test[a-z0-9_]*$/.test(identity.database) ||
    identity.port !== 5432 ||
    !['127.0.0.1/32', '::1/128'].includes(identity.address) ||
    !/^\d{5,6}$/.test(identity.serverVersion)
  ) {
    throw new PostgresTestSafetyError(
      'La identidad real del servidor no coincide con el destino local exclusivo de pruebas.',
    );
  }
}

export async function cleanupTestDatabase(
  source: DataSource | undefined,
  runners: QueryRunner[],
  observer: QueryRunner | undefined,
  schema: string | undefined,
): Promise<void> {
  const failures: string[] = [];
  try {
    const rollbacks = await Promise.allSettled(
      runners
        .filter((r) => r.isTransactionActive)
        .map((r) => Promise.resolve().then(() => r.rollbackTransaction())),
    );
    if (rollbacks.some((r) => r.status === 'rejected'))
      failures.push('rollback');
    if (schema && observer) {
      if (!/^booking_test_[a-f0-9]{12}$/.test(schema))
        failures.push('nombre de esquema');
      else {
        try {
          await observer.query('DROP SCHEMA "' + schema + '" CASCADE');
        } catch {
          failures.push('eliminación del esquema temporal');
        }
      }
    }
  } finally {
    try {
      const releases = await Promise.allSettled(
        runners.map((r) => Promise.resolve().then(() => r.release())),
      );
      if (releases.some((r) => r.status === 'rejected'))
        failures.push('liberación de conexiones');
    } finally {
      if (source?.isInitialized) {
        try {
          await source.destroy();
        } catch {
          failures.push('cierre del pool');
        }
      }
    }
  }
  if (failures.length)
    throw new PostgresTestSafetyError(
      'Limpieza de pruebas incompleta: ' +
        failures.join(', ') +
        '. Revise los esquemas booking_test_* en la base de testing.',
    );
}
