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
import { DataSource, EntityManager } from 'typeorm';
import request from 'supertest';
import { PatientsModule } from '../modules/patients/patients.module';
import { TherapeuticProcessesModule } from '../modules/therapeutic-processes/therapeutic-processes.module';
import { Profesional } from '../profesionales/entities/profesional.entity';
import { PatientOrmEntity } from '../modules/patients/infrastructure/persistence/patient.orm-entity';
import { TherapeuticProcessOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';

const professionalRepository = { findOne: jest.fn() };
const patients = {
  findByIdAndProfessional: jest.fn(),
  findAllByProfessional: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const processBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};
const processes = {
  findOne: jest.fn(),
  createQueryBuilder: () => processBuilder,
  create: jest.fn(),
  save: jest.fn(),
};
const manager = { findOne: jest.fn() };
const persistence = {
  options: { type: 'postgres' },
  entityMetadatas: [],
  manager,
  getRepository: (entity: unknown) => {
    if (entity === Profesional) return professionalRepository;
    if (entity === TherapeuticProcessOrmEntity) return processes;
    return {};
  },
};
@Global()
@Module({
  providers: [
    { provide: DataSource, useValue: persistence },
    { provide: EntityManager, useValue: manager },
  ],
  exports: [DataSource, EntityManager],
})
class ClinicalTestPersistenceModule {}

// Modulos y guards reales; sin conexiones, credenciales ni datos de PostgreSQL.
describe('Clinical HTTP security', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  const patient = {
    nombre: 'Paciente',
    apellido: 'Ficticio',
    telefono: '1100000000',
    correoElectronico: 'clinical-test@example.com',
    idTipoDocumento: 1,
    numeroDocumento: '99000001',
    fechaNacimiento: '2000-01-01',
    direccion: 'Calle ficticia',
  };
  const routes = [
    ['post', '/patients', patient],
    ['get', '/patients', {}],
    ['put', '/patients/1', { telefono: '1100000001' }],
    ['post', '/procesos-terapeuticos', { idPaciente: 1 }],
    [
      'patch',
      '/procesos-terapeuticos/1/estado',
      { idEstadoProcesoTerapeutico: 3 },
    ],
  ] as const;
  const token = (role = 'PROFESIONAL') => jwt.sign({ sub: 7, rol: role });
  const send = (method: string, path: string, body: object, auth?: string) => {
    const client = request(app.getHttpServer());
    const call =
      method === 'get'
        ? client.get(path)
        : method === 'post'
          ? client.post(path)
          : method === 'put'
            ? client.put(path)
            : client.patch(path);
    if (auth) call.auth(auth, { type: 'bearer' });
    return call.send(body);
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ClinicalTestPersistenceModule,
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          ignoreEnvVars: true,
          load: [() => ({ JWT_SECRET: 'clinical-security-test-only-secret' })],
        }),
        PatientsModule,
        TherapeuticProcessesModule,
      ],
    })
      .overrideProvider('IPatientRepository')
      .useValue(patients)
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
    patients.create.mockResolvedValue({ ...patient, idPaciente: 1 });
    patients.findAllByProfessional.mockResolvedValue([{ idPaciente: 1 }]);
    patients.findByIdAndProfessional.mockResolvedValue({ idPaciente: 1 });
    patients.update.mockResolvedValue({
      idPaciente: 1,
      telefono: '1100000001',
    });
    manager.findOne.mockResolvedValue({ idPaciente: 1 });
    processBuilder.getOne.mockResolvedValue(null);
    processBuilder.execute.mockResolvedValue({ affected: 1 });
    processes.findOne.mockImplementation(
      (options: {
        where: { idProcesoTerapeutico?: number; idProfesional?: number };
      }) =>
        Promise.resolve(
          options.where.idProcesoTerapeutico === 1 &&
            options.where.idProfesional === 42
            ? {
                idProcesoTerapeutico: 1,
                idProfesional: 42,
                idEstadoProcesoTerapeutico: 1,
              }
            : null,
        ),
    );
    processes.create.mockImplementation((value: object) => value);
    processes.save.mockImplementation((value: object) =>
      Promise.resolve({ ...value, idProcesoTerapeutico: 2 }),
    );
  });
  afterAll(async () => {
    await app?.close();
  });

  it.each(routes)(
    'allows an active professional: %s %s',
    async (method, path, body) => {
      await send(method, path, body, token()).expect(
        method === 'post' ? 201 : 200,
      );
      expect(professionalRepository.findOne).toHaveBeenCalledTimes(1);
      expect(professionalRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuario: { idUsuario: 7 } } }),
      );
      if (path === '/patients' && method === 'post')
        expect(patients.create).toHaveBeenCalledWith(expect.anything(), 42);
      if (path === '/patients' && method === 'get')
        expect(patients.findAllByProfessional).toHaveBeenCalledWith(42);
      if (method === 'put')
        expect(patients.update).toHaveBeenCalledWith(1, body, 42);
      if (path === '/procesos-terapeuticos')
        expect(processes.create).toHaveBeenCalledWith(
          expect.objectContaining({ idProfesional: 42 }),
        );
      if (method === 'patch')
        expect(processes.findOne).toHaveBeenCalledWith({
          where: { idProcesoTerapeutico: 1, idProfesional: 42 },
        });
    },
  );

  describe.each(['inactive', 'missing'])('%s professional', (state) => {
    it.each(routes)(
      'rejects %s %s before clinical persistence',
      async (method, path, body) => {
        professionalRepository.findOne.mockResolvedValue(
          state === 'missing'
            ? null
            : { idProfesional: 42, fechaBaja: new Date() },
        );
        await send(method, path, body, token()).expect(403);
        expect(patients.create).not.toHaveBeenCalled();
        expect(patients.update).not.toHaveBeenCalled();
        expect(patients.findAllByProfessional).not.toHaveBeenCalled();
        expect(manager.findOne).not.toHaveBeenCalled();
        expect(processes.findOne).not.toHaveBeenCalled();
        expect(processes.save).not.toHaveBeenCalled();
        expect(processBuilder.execute).not.toHaveBeenCalled();
      },
    );
  });
  describe.each(['missing', 'invalid', 'expired', 'administrator'])(
    '%s JWT',
    (kind) => {
      it.each(routes)('rejects %s %s', async (method, path, body) => {
        const auth =
          kind === 'missing'
            ? undefined
            : kind === 'invalid'
              ? 'invalid-token'
              : kind === 'expired'
                ? jwt.sign({ sub: 7, rol: 'PROFESIONAL' }, { expiresIn: -1 })
                : token('ADMINISTRADOR');
        await send(method, path, body, auth).expect(
          kind === 'administrator' ? 403 : 401,
        );
        expect(professionalRepository.findOne).not.toHaveBeenCalled();
        expect(patients.update).not.toHaveBeenCalled();
        expect(processes.save).not.toHaveBeenCalled();
        expect(processBuilder.execute).not.toHaveBeenCalled();
      });
    },
  );
  it('returns identical generic patient errors without writing', async () => {
    patients.findByIdAndProfessional.mockResolvedValue(null);
    const foreign = await send(
      'put',
      '/patients/4',
      { telefono: '1100000001' },
      token(),
    ).expect(404);
    const absent = await send(
      'put',
      '/patients/999',
      { telefono: '1100000001' },
      token(),
    ).expect(404);
    expect(foreign.body).toEqual({
      statusCode: 404,
      message: 'Recurso no encontrado',
      error: 'Not Found',
    });
    expect(absent.body).toEqual(foreign.body);
    expect(patients.update).not.toHaveBeenCalled();
  });
  it('queries processes within the authenticated owner and hides foreign or absent IDs', async () => {
    const foreign = await send(
      'patch',
      '/procesos-terapeuticos/4/estado',
      { idEstadoProcesoTerapeutico: 3 },
      token(),
    ).expect(404);
    const absent = await send(
      'patch',
      '/procesos-terapeuticos/999/estado',
      { idEstadoProcesoTerapeutico: 3 },
      token(),
    ).expect(404);
    expect(absent.body).toEqual(foreign.body);
    expect(foreign.body).toMatchObject({ message: 'Recurso no encontrado' });
    expect(processes.findOne).toHaveBeenCalledWith({
      where: { idProcesoTerapeutico: 4, idProfesional: 42 },
    });
    expect(processBuilder.execute).not.toHaveBeenCalled();
  });
  it('hides foreign patient associations when creating processes', async () => {
    processBuilder.getOne.mockResolvedValue({ idProfesional: 99 });
    const foreign = await send(
      'post',
      '/procesos-terapeuticos',
      { idPaciente: 4 },
      token(),
    ).expect(404);
    manager.findOne.mockResolvedValue(null);
    const absent = await send(
      'post',
      '/procesos-terapeuticos',
      { idPaciente: 999 },
      token(),
    ).expect(404);
    expect(absent.body).toEqual(foreign.body);
    expect(foreign.body).toMatchObject({ message: 'Recurso no encontrado' });
    expect(processes.save).not.toHaveBeenCalled();
  });
  it.each([
    ['put', '/patients/abc', { telefono: '1100000001' }],
    [
      'patch',
      '/procesos-terapeuticos/abc/estado',
      { idEstadoProcesoTerapeutico: 3 },
    ],
    ['post', '/procesos-terapeuticos', { idPaciente: 'abc' }],
    ['post', '/patients', { ...patient, professionalId: 99 }],
    ['post', '/procesos-terapeuticos', { idPaciente: 1, idProfesional: 99 }],
  ])('preserves input validation: %s %s', async (method, path, body) => {
    await send(method, path, body as object, token()).expect(400);
    expect(patients.update).not.toHaveBeenCalled();
    expect(processes.save).not.toHaveBeenCalled();
    expect(processBuilder.execute).not.toHaveBeenCalled();
  });
  it('keeps rejection of a second active process', async () => {
    processes.findOne.mockResolvedValue({ idEstadoProcesoTerapeutico: 1 });
    await send(
      'post',
      '/procesos-terapeuticos',
      { idPaciente: 1 },
      token(),
    ).expect(400);
    expect(processes.save).not.toHaveBeenCalled();
  });
  it('keeps rejection of state changes on closed processes', async () => {
    processes.findOne.mockResolvedValue({
      idProfesional: 42,
      idEstadoProcesoTerapeutico: 3,
    });
    await send(
      'patch',
      '/procesos-terapeuticos/1/estado',
      { idEstadoProcesoTerapeutico: 2 },
      token(),
    ).expect(400);
    expect(processBuilder.execute).not.toHaveBeenCalled();
  });
  it('uses the original patient entity when preserving creation rules', async () => {
    await send(
      'post',
      '/procesos-terapeuticos',
      { idPaciente: 1 },
      token(),
    ).expect(201);
    expect(manager.findOne).toHaveBeenCalledWith(PatientOrmEntity, {
      where: { idPaciente: 1 },
    });
  });
});
