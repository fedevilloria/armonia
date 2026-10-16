import { CreateAppointmentService } from '../modules/appointments/application/services/create-appointment.service';
import {
  AppointmentTransaction,
  type AppointmentTransactionContext,
} from '../modules/appointments/application/ports/appointment-transaction';
import { Clock } from '../modules/appointments/application/ports/clock';
import { Appointment } from '../modules/appointments/domain/entities/appointment.entity';
import { AppointmentException } from '../modules/appointments/domain/exceptions/appointment.exception';
import { AppointmentController } from '../modules/appointments/presentation/controllers/appointment.controller';
import { GetFreeSlotsService } from '../modules/appointments/application/services/get-free-slots.service';
import { APPOINTMENT_REPOSITORY } from '../modules/appointments/domain/repositories/appointment.repository';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ProfessionalIdentityGuard } from './guards/professional-identity.guard';
import {
  ProfessionalIdentityResolver,
  UnconfiguredProfessionalIdentityResolver,
} from './professional-identity.resolver';
import { AvailabilityController } from '../modules/availabilities/presentation/controllers/availability.controller';
import { CreateAvailabilityService } from '../modules/availabilities/application/services/create-availability.service';
import { AVAILABILITY_REPOSITORY } from '../modules/availabilities/domain/repositories/availability.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('HTTP authentication and professional ownership', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const resolver = { resolve: jest.fn() };
  const repository = { findByProfessionalAndDay: jest.fn(), save: jest.fn() };
  const bookingAppointments = {
    findByProfessionalAndDate: jest.fn(),
    save: jest.fn(),
  };
  const patientAccess = { canAssign: jest.fn() };
  const bookingTransaction = { run: jest.fn() };
  const bookingClock = { now: () => new Date('2026-10-18T12:00:00Z') };
  const body = {
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    duration: 30,
    validFrom: '2026-10-19',
    validUntil: '2026-10-26',
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'security-test-only-secret' })],
      controllers: [
        AvailabilityController,
        AuthController,
        AppointmentController,
      ],
      providers: [
        CreateAvailabilityService,
        GetFreeSlotsService,
        CreateAppointmentService,
        { provide: AppointmentTransaction, useValue: bookingTransaction },
        { provide: Clock, useValue: bookingClock },
        {
          provide: APPOINTMENT_REPOSITORY,
          useValue: bookingAppointments,
        },
        ProfessionalIdentityGuard,
        { provide: ProfessionalIdentityResolver, useValue: resolver },
        { provide: AVAILABILITY_REPOSITORY, useValue: repository },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ access_token: 'test-only' }),
          },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
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
    patientAccess.canAssign.mockResolvedValue(false);
    bookingAppointments.findByProfessionalAndDate.mockResolvedValue([]);
    bookingAppointments.save.mockImplementation((value: Appointment) =>
      Promise.resolve(
        new Appointment(
          77,
          value.professionalId,
          value.patientId,
          value.date,
          value.startTime,
          value.endTime,
          value.status,
          new Date(),
          new Date(),
          value.createdByUserId,
        ),
      ),
    );
    bookingTransaction.run.mockImplementation(
      (
        _professionalId: number,
        _date: string,
        work: (context: AppointmentTransactionContext) => Promise<unknown>,
      ) =>
        work({
          appointments: bookingAppointments,
          availabilities: repository,
          patientAccess,
        }),
    );
    resolver.resolve.mockResolvedValue(null);
    repository.findByProfessionalAndDay.mockResolvedValue([]);
    repository.save.mockImplementation(async (value) => value);
  });
  afterAll(async () => {
    await app?.close();
  });
  const post = () => request(app.getHttpServer()).post('/availabilities');
  const token = (sub: unknown = 7, rol = 'PROFESIONAL') =>
    jwt.sign({ sub, rol });
  const getSlots = () =>
    request(app.getHttpServer()).get('/appointments/free-slots');
  it('protects free slots without authentication', async () => {
    await getSlots().query({ date: '2026-10-19' }).expect(401);
    expect(repository.findByProfessionalAndDay).not.toHaveBeenCalled();
  });
  it('protects free slots with an invalid token', async () => {
    await getSlots()
      .auth('invalid', { type: 'bearer' })
      .query({ date: '2026-10-19' })
      .expect(401);
  });
  it.each(['ADMINISTRADOR', 'UNKNOWN'])(
    'denies free slots for role %s',
    async (role) => {
      await getSlots()
        .auth(token(7, role), { type: 'bearer' })
        .query({ date: '2026-10-19' })
        .expect(403);
      expect(resolver.resolve).not.toHaveBeenCalled();
    },
  );
  it('keeps free slots closed with the provisional resolver', async () => {
    await getSlots()
      .auth(token(), { type: 'bearer' })
      .query({ date: '2026-10-19' })
      .expect(403);
    expect(repository.findByProfessionalAndDay).not.toHaveBeenCalled();
  });
  it('returns only free intervals using the resolved professional identity', async () => {
    resolver.resolve.mockResolvedValue(42);
    repository.findByProfessionalAndDay.mockResolvedValue([
      {
        id: 1,
        professionalId: 42,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
        duration: 30,
        validFrom: new Date('2026-10-19'),
        validUntil: new Date('2026-10-19'),
      },
    ]);
    const response = await getSlots()
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
    expect(repository.findByProfessionalAndDay).toHaveBeenCalledWith(
      42,
      'MONDAY',
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { date: '2026-02-30' },
    { date: '2026-10-19T00:00:00Z' },
    { date: '2026-10-19', professionalId: 99 },
  ])('rejects invalid or foreign agenda queries: %p', async (query) => {
    resolver.resolve.mockResolvedValue(42);
    await getSlots().auth(token(), { type: 'bearer' }).query(query).expect(400);
    expect(repository.findByProfessionalAndDay).not.toHaveBeenCalled();
  });
  const createBooking = () =>
    request(app.getHttpServer()).post('/appointments');
  const bookingInput = {
    patientId: 25,
    date: '2026-10-19',
    startTime: '09:30',
  };
  it('requires authentication for booking', async () => {
    await createBooking().send(bookingInput).expect(401);
    expect(bookingTransaction.run).not.toHaveBeenCalled();
  });
  it('rejects an expired booking token', async () => {
    await createBooking()
      .auth(jwt.sign({ sub: 7, rol: 'PROFESIONAL' }, { expiresIn: -1 }), {
        type: 'bearer',
      })
      .send(bookingInput)
      .expect(401);
  });
  it('requires a professional role for booking', async () => {
    await createBooking()
      .auth(token(7, 'ADMINISTRADOR'), { type: 'bearer' })
      .send(bookingInput)
      .expect(403);
    expect(bookingTransaction.run).not.toHaveBeenCalled();
  });
  it('keeps booking closed with unresolved professional identity', async () => {
    await createBooking()
      .auth(token(), { type: 'bearer' })
      .send(bookingInput)
      .expect(403);
    expect(bookingTransaction.run).not.toHaveBeenCalled();
  });
  it.each([
    'professionalId',
    'duration',
    'endTime',
    'status',
    'createdByUserId',
  ])('rejects client field %s', async (field) => {
    resolver.resolve.mockResolvedValue(42);
    await createBooking()
      .auth(token(), { type: 'bearer' })
      .send({ ...bookingInput, [field]: 99 })
      .expect(400);
    expect(bookingTransaction.run).not.toHaveBeenCalled();
  });
  it.each([
    { patientId: 0 },
    { patientId: '25' },
    { date: '2026-02-30' },
    { startTime: '09:99' },
  ])('rejects invalid booking input: %p', async (changes) => {
    resolver.resolve.mockResolvedValue(42);
    await createBooking()
      .auth(token(), { type: 'bearer' })
      .send({ ...bookingInput, ...changes })
      .expect(400);
  });
  it('returns a generic 404 when patient access is denied', async () => {
    resolver.resolve.mockResolvedValue(42);
    const response = await createBooking()
      .auth(token(), { type: 'bearer' })
      .send(bookingInput)
      .expect(404);
    expect(response.body.message).toBe(
      'Paciente no encontrado o no disponible',
    );
    expect(bookingAppointments.save).not.toHaveBeenCalled();
  });
  it('creates a booking with server-derived owner, creator, duration and status', async () => {
    resolver.resolve.mockResolvedValue(42);
    patientAccess.canAssign.mockResolvedValue(true);
    repository.findByProfessionalAndDay.mockResolvedValue([
      {
        id: 1,
        professionalId: 42,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
        duration: 30,
        validFrom: new Date('2026-10-19'),
        validUntil: new Date('2026-10-19'),
      },
    ]);
    const response = await createBooking()
      .auth(token(), { type: 'bearer' })
      .send(bookingInput)
      .expect(201);
    expect(response.body).toEqual({
      id: 77,
      patientId: 25,
      date: '2026-10-19',
      startTime: '09:30',
      endTime: '10:00',
      status: 'RESERVED',
    });
    expect(bookingAppointments.save).toHaveBeenCalledWith(
      expect.objectContaining({ professionalId: 42, createdByUserId: 7 }),
    );
  });
  it.each([
    ['occupied', 409],
    ['ambiguous', 409],
    ['persistence', 503],
  ] as const)('maps booking %s to %s', async (code, status) => {
    resolver.resolve.mockResolvedValue(42);
    bookingTransaction.run.mockRejectedValue(
      new AppointmentException(code, 'No se pudo registrar el turno'),
    );
    await createBooking()
      .auth(token(), { type: 'bearer' })
      .send(bookingInput)
      .expect(status);
  });
  it('keeps login public', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correoElectronico: 'test@example.com',
        contrasena: 'example-password',
      })
      .expect(201);
  });
  it('rejects missing authentication', async () => {
    await post().send(body).expect(401);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it.each(['invalid', 'expired', 'invalid-sub', 'missing-role'])(
    'rejects %s tokens',
    async (kind) => {
      const value =
        kind === 'invalid'
          ? 'invalid'
          : kind === 'expired'
            ? jwt.sign({ sub: 7, rol: 'PROFESIONAL' }, { expiresIn: -1 })
            : kind === 'invalid-sub'
              ? token('7')
              : jwt.sign({ sub: 7 });
      await post().auth(value, { type: 'bearer' }).send(body).expect(401);
      expect(resolver.resolve).not.toHaveBeenCalled();
    },
  );
  it.each(['ADMINISTRADOR', 'UNKNOWN'])(
    'does not grant implicit agenda access to %s',
    async (role) => {
      await post()
        .auth(token(7, role), { type: 'bearer' })
        .send(body)
        .expect(403);
      expect(resolver.resolve).not.toHaveBeenCalled();
    },
  );
  it('denies an unresolved identity without writing', async () => {
    await post().auth(token(), { type: 'bearer' }).send(body).expect(403);
    expect(resolver.resolve).toHaveBeenCalledWith(7);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('keeps the default resolver closed', async () => {
    expect(
      await new UnconfiguredProfessionalIdentityResolver().resolve(7),
    ).toBeNull();
  });
  it('uses the server professional identity instead of the user id', async () => {
    resolver.resolve.mockResolvedValue(42);
    const response = await post()
      .auth(token(), { type: 'bearer' })
      .send(body)
      .expect(201);
    expect(response.body.professionalId).toBe(42);
    expect(repository.findByProfessionalAndDay).toHaveBeenCalledWith(
      42,
      'MONDAY',
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ professionalId: 42 }),
    );
  });
  it('rejects a client-supplied professional id', async () => {
    resolver.resolve.mockResolvedValue(42);
    await post()
      .auth(token(), { type: 'bearer' })
      .send({ ...body, professionalId: 99 })
      .expect(400);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('preserves domain validation', async () => {
    resolver.resolve.mockResolvedValue(42);
    await post()
      .auth(token(), { type: 'bearer' })
      .send({ ...body, endTime: '08:00' })
      .expect(400);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('preserves overlap rejection', async () => {
    resolver.resolve.mockResolvedValue(42);
    repository.findByProfessionalAndDay.mockResolvedValue([
      {
        startTime: '09:00',
        endTime: '10:00',
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
      },
    ]);
    await post().auth(token(), { type: 'bearer' }).send(body).expect(400);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
