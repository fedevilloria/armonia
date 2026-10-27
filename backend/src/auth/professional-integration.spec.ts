import type { Server } from 'node:http';
import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, type EntityManager } from 'typeorm';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { AvailabilityModule } from '../modules/availabilities/availability.module';
import { AppointmentsModule } from '../modules/appointments/appointments.module';
import { Clock } from '../modules/appointments/application/ports/clock';
import { Profesional } from '../profesionales/entities/profesional.entity';
import { AvailabilityOrmEntity } from '../modules/availabilities/infrastructure/persistence/availability.orm-entity';
import { AppointmentOrmEntity } from '../modules/appointments/infrastructure/persistence/appointment.orm-entity';
import { DayOfWeek } from '../modules/availabilities/domain/enums/day-of-week.enum';

const professionalRepository = { findOne: jest.fn() };
const builder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  setLock: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};
const availabilityRepository = {
  find: jest.fn(),
  create: (value: Partial<AvailabilityOrmEntity>) => value,
  save: jest.fn(),
  createQueryBuilder: () => builder,
};
const appointmentRepository = { find: jest.fn(), save: jest.fn() };
function getRepository(entity: unknown) {
  if (entity === Profesional) return professionalRepository;
  if (entity === AvailabilityOrmEntity) return availabilityRepository;
  if (entity === AppointmentOrmEntity) return appointmentRepository;
  return {};
}
const manager = { getRepository };
const testDataSource = {
  options: { type: 'postgres' },
  entityMetadatas: [],
  getRepository,
  transaction: jest.fn(),
};
@Global()
@Module({
  providers: [{ provide: DataSource, useValue: testDataSource }],
  exports: [DataSource],
})
class TestPersistenceModule {}

// Se usan los modulos, resolver y guards reales, con persistencia simulada y sin .env.
describe('Professional integration across scheduling modules', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const body = {
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    duration: 30,
    validFrom: '2026-10-19',
    validUntil: '2026-10-26',
  };
  const row = Object.assign(new AvailabilityOrmEntity(), {
    id: 11,
    professionalId: 42,
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: '09:00:00',
    endTime: '10:00:00',
    duration: 30,
    validFrom: '2026-10-19',
    validUntil: '2026-10-26',
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TestPersistenceModule,
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          ignoreEnvVars: true,
          load: [
            () => ({ JWT_SECRET: 'professional-integration-test-only-secret' }),
          ],
        }),
        AuthModule,
        AvailabilityModule,
        AppointmentsModule,
      ],
    })
      .overrideProvider(Clock)
      .useValue({ now: () => new Date('2026-10-18T12:00:00Z') })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = module.get(JwtService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    professionalRepository.findOne.mockResolvedValue({
      idProfesional: 42,
      fechaBaja: null,
    });
    availabilityRepository.find.mockResolvedValue([]);
    availabilityRepository.save.mockImplementation(
      (value: Partial<AvailabilityOrmEntity>) =>
        Promise.resolve({ ...value, id: 11 }),
    );
    appointmentRepository.find.mockResolvedValue([]);
    testDataSource.transaction.mockImplementation(
      (_level: string, work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    );
  });
  afterAll(async () => {
    await app?.close();
  });
  const token = (userId = 7, role = 'PROFESIONAL') =>
    jwt.sign({ sub: userId, rol: role });
  it('resolves once from user 7 to professional 42 when registering availability', async () => {
    const response = await request(app.getHttpServer())
      .post('/availabilities')
      .auth(token(), { type: 'bearer' })
      .send(body)
      .expect(201);
    expect((response.body as { professionalId: number }).professionalId).toBe(
      42,
    );
    expect(professionalRepository.findOne).toHaveBeenCalledTimes(1);
    expect(professionalRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuario: { idUsuario: 7 } } }),
    );
    expect(availabilityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ professionalId: 42 }),
    );
  });
  it('uses the same resolved owner for free slots without patient information', async () => {
    availabilityRepository.find.mockResolvedValue([row]);
    const response = await request(app.getHttpServer())
      .get('/appointments/free-slots')
      .auth(token(), { type: 'bearer' })
      .query({ date: '2026-10-19' })
      .expect(200);
    expect(response.body).toEqual({
      date: '2026-10-19',
      slots: [
        { startTime: '09:00', endTime: '09:30', duration: 30 },
        { startTime: '09:30', endTime: '10:00', duration: 30 },
      ],
    });
    expect(professionalRepository.findOne).toHaveBeenCalledTimes(1);
    expect(availabilityRepository.find).toHaveBeenCalledWith({
      where: { professionalId: 42, dayOfWeek: 'MONDAY' },
    });
    expect(appointmentRepository.find).toHaveBeenCalledTimes(1);
    const [query] = appointmentRepository.find.mock.calls[0] as [
      { where: { professionalId: number; date: string } },
    ];
    expect(query.where).toMatchObject({
      professionalId: 42,
      date: '2026-10-19',
    });
  });
  it.each(['missing', 'inactive'])(
    'rejects a %s professional for all scheduling endpoints',
    async (state) => {
      professionalRepository.findOne.mockResolvedValue(
        state === 'missing'
          ? null
          : { idProfesional: 42, fechaBaja: new Date('2026-10-01') },
      );
      await request(app.getHttpServer())
        .post('/availabilities')
        .auth(token(), { type: 'bearer' })
        .send(body)
        .expect(403);
      await request(app.getHttpServer())
        .get('/appointments/free-slots')
        .auth(token(), { type: 'bearer' })
        .query({ date: '2026-10-19' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/appointments')
        .auth(token(), { type: 'bearer' })
        .send({ patientId: 25, date: '2026-10-19', startTime: '09:00' })
        .expect(403);
      expect(testDataSource.transaction).not.toHaveBeenCalled();
      expect(availabilityRepository.save).not.toHaveBeenCalled();
    },
  );
  it('keeps real patient authorization closed even with an active professional', async () => {
    const response = await request(app.getHttpServer())
      .post('/appointments')
      .auth(token(), { type: 'bearer' })
      .send({ patientId: 25, date: '2026-10-19', startTime: '09:00' })
      .expect(404);
    expect((response.body as { message: string }).message).toBe(
      'Paciente no encontrado o no disponible',
    );
    expect(testDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(appointmentRepository.save).not.toHaveBeenCalled();
  });
  it('does not allow a client to select another professional', async () => {
    await request(app.getHttpServer())
      .post('/availabilities')
      .auth(token(), { type: 'bearer' })
      .send({ ...body, professionalId: 99 })
      .expect(400);
    await request(app.getHttpServer())
      .get('/appointments/free-slots')
      .auth(token(), { type: 'bearer' })
      .query({ date: '2026-10-19', professionalId: 99 })
      .expect(400);
    expect(availabilityRepository.find).not.toHaveBeenCalled();
    expect(availabilityRepository.save).not.toHaveBeenCalled();
  });
  it('retains global JWT validation before reading professional persistence', async () => {
    await request(app.getHttpServer())
      .get('/appointments/free-slots')
      .expect(401);
    await request(app.getHttpServer())
      .get('/appointments/free-slots')
      .auth(jwt.sign({ sub: '7', rol: 'PROFESIONAL' }), { type: 'bearer' })
      .expect(401);
    expect(professionalRepository.findOne).not.toHaveBeenCalled();
  });
  it('retains the role guard before resolving a professional', async () => {
    await request(app.getHttpServer())
      .post('/availabilities')
      .auth(token(7, 'ADMINISTRADOR'), { type: 'bearer' })
      .send(body)
      .expect(403);
    expect(professionalRepository.findOne).not.toHaveBeenCalled();
  });
});
