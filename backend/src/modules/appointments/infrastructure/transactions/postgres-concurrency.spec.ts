import { DataSource, type QueryRunner } from 'typeorm';
import { randomBytes } from 'node:crypto';

// Optativo: solo una base dedicada cuyo nombre empiece por armonia_appointments_test.
// No lee .env, no ejecuta migraciones y nunca usa la configuracion de desarrollo.
const connectionString = process.env.ARMONIA_BOOKING_TEST_URL;
const suite = connectionString ? describe : describe.skip;
suite('PostgreSQL concurrent appointment exclusion', () => {
  const schema = 'booking_test_' + randomBytes(6).toString('hex');
  const source = new DataSource({
    type: 'postgres',
    url: connectionString,
    entities: [],
    synchronize: false,
    logging: false,
    extra: { max: 4 },
  });
  const observer = source.createQueryRunner(),
    first = source.createQueryRunner(),
    second = source.createQueryRunner();
  const connected: QueryRunner[] = [];
  let initialized = false;
  async function query<T>(
    runner: QueryRunner,
    sql: string,
    parameters: unknown[] = [],
  ): Promise<T[]> {
    return (await runner.query(sql, parameters)) as T[];
  }
  beforeAll(async () => {
    let database: string;
    try {
      database = new URL(connectionString!).pathname.slice(1);
    } catch {
      throw new Error('URL de base de pruebas invalida');
    }
    if (!/^armonia_appointments_test[a-z0-9_]*$/.test(database))
      throw new Error(
        'Se requiere una base dedicada armonia_appointments_test',
      );
    await source.initialize();
    for (const runner of [observer, first, second]) {
      await runner.connect();
      connected.push(runner);
    }
    await observer.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    await observer.query('CREATE SCHEMA "' + schema + '"');
    initialized = true;
    await observer.query(
      `CREATE TABLE "${schema}".appointments (id serial PRIMARY KEY, professional_id integer NOT NULL, date date NOT NULL, start_time time NOT NULL, end_time time NOT NULL, status text NOT NULL, CHECK(start_time < end_time), CONSTRAINT "EX_appointments_professional_time" EXCLUDE USING gist (professional_id WITH =, tsrange(date + start_time,date + end_time,'[)') WITH &&) WHERE(status IN ('RESERVED','CONFIRMED','ATTENDED','NOT_ATTENDED')))`,
    );
  });
  afterAll(async () => {
    await Promise.allSettled(
      connected
        .filter((runner) => runner.isTransactionActive)
        .map((runner) => runner.rollbackTransaction()),
    );
    if (initialized)
      await observer.query('DROP SCHEMA "' + schema + '" CASCADE');
    await Promise.allSettled(connected.map((runner) => runner.release()));
    if (source.isInitialized) await source.destroy();
  });
  const insert = (
    runner: QueryRunner,
    owner: number,
    start: string,
    end: string,
    status = 'RESERVED',
  ) =>
    query<{ id: number }>(
      runner,
      'INSERT INTO "' +
        schema +
        '".appointments(professional_id,date,start_time,end_time,status) VALUES($1,$2,$3,$4,$5) RETURNING id',
      [owner, '2026-11-09', start, end, status],
    );
  it('prevents concurrent partial overlap on separate connections', async () => {
    await first.startTransaction();
    await second.startTransaction();
    const [pid] = await query<{ pid: number }>(
      second,
      'SELECT pg_backend_pid() AS pid',
    );
    await insert(first, 42, '09:00', '09:30');
    const pending = insert(second, 42, '09:15', '09:45').then(
      () => ({ code: 'unexpected-success' }),
      (error: { code: string; constraint: string }) => ({
        code: error.code,
        constraint: error.constraint,
      }),
    );
    let waiting = false;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        const [result] = await query<{ waiting: boolean }>(
          observer,
          'SELECT cardinality(pg_blocking_pids($1)) > 0 AS waiting',
          [pid.pid],
        );
        if (result.waiting) {
          waiting = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
    } finally {
      await first.commitTransaction();
    }
    expect(await pending).toEqual({
      code: '23P01',
      constraint: 'EX_appointments_professional_time',
    });
    await second.rollbackTransaction();
    const [result] = await query<{ count: number }>(
      observer,
      'SELECT count(*)::int AS count FROM "' +
        schema +
        '".appointments WHERE professional_id=42',
    );
    expect(result.count).toBe(1);
  }, 15000);
  it('permits adjacent appointments, different professionals and nonblocking statuses', async () => {
    await insert(observer, 43, '10:00', '10:30');
    await insert(observer, 43, '10:30', '11:00');
    await insert(observer, 44, '10:00', '10:30');
    await insert(observer, 43, '10:00', '10:30', 'CANCELLED');
    await insert(observer, 43, '10:00', '10:30', 'RESCHEDULED');
    await expect(insert(observer, 43, '10:00', '10:30')).rejects.toMatchObject({
      code: '23P01',
    });
  });
  it.each(['RESERVED', 'CONFIRMED', 'ATTENDED', 'NOT_ATTENDED'])(
    'enforces the constraint for %s',
    async (status) => {
      const owner =
        100 +
        ['RESERVED', 'CONFIRMED', 'ATTENDED', 'NOT_ATTENDED'].indexOf(status);
      await insert(observer, owner, '12:00', '12:30', status);
      await expect(
        insert(observer, owner, '12:00', '12:30'),
      ).rejects.toMatchObject({ code: '23P01' });
    },
  );
  it('rejects an update that reactivates an overlapping appointment', async () => {
    await insert(observer, 200, '12:00', '12:30');
    const [row] = await insert(observer, 200, '12:00', '12:30', 'CANCELLED');
    await expect(
      observer.query(
        'UPDATE "' + schema + '".appointments SET status=$1 WHERE id=$2',
        ['RESERVED', row.id],
      ),
    ).rejects.toMatchObject({ code: '23P01' });
  });
});
