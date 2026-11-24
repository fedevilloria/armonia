import type { Server } from 'node:http';
import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import request from 'supertest';
import { PatientsModule } from '../modules/patients/patients.module';
import { TherapeuticProcessesModule } from '../modules/therapeutic-processes/therapeutic-processes.module';
import { Profesional } from '../profesionales/entities/profesional.entity';
import { PatientOrmEntity } from '../modules/patients/infrastructure/persistence/patient.orm-entity';
import { TherapeuticProcessOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { ClinicalHistoriesModule } from '../modules/clinical-histories/clinical-histories.module';
import { ClinicalEvolutionsModule } from '../modules/clinical-evolutions/clinical-evolutions.module';
import { ClinicalHistoryOrmEntity } from '../modules/clinical-histories/infrastructure/persistence/clinical-history.orm-entity';
import { ClinicalEvolutionOrmEntity } from '../modules/clinical-evolutions/infrastructure/persistence/clinical-evolution.orm-entity';

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
const histories = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const evolutions = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
const persistence = {
  options: { type: 'postgres' },
  entityMetadatas: [],
  manager,
  getRepository: (entity: unknown) => {
    if (entity === Profesional) return professionalRepository;
    if (entity === TherapeuticProcessOrmEntity) return processes;
    if (entity === ClinicalHistoryOrmEntity) return histories;
    if (entity === ClinicalEvolutionOrmEntity) return evolutions;
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
    [
      'post',
      '/historias-clinicas',
      {
        idProcesoTerapeutico: 1,
        motivoConsulta: 'Ensayo ficticio',
        antecedentes: 'Sin datos reales',
        diagnostico: 'Ficticio',
      },
    ],
    ['get', '/evoluciones-clinicas/historia-clinica/1', {}],
    [
      'post',
      '/evoluciones-clinicas',
      { idHistoriaClinica: 1, idTurno: 11, descripcion: 'Ensayo ficticio' },
    ],
  ] as const;
  const token = (role = 'PROFESIONAL', userId = 7) =>
    jwt.sign({ sub: userId, rol: role });
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
        ClinicalHistoriesModule,
        ClinicalEvolutionsModule,
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
    patients.create.mockImplementation((value: object) =>
      Promise.resolve({ ...value, idPaciente: 1 }),
    );
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
    histories.findOne.mockImplementation(
      (options: {
        where: {
          idHistoriaClinica: number;
          procesoTerapeutico: { idProfesional: number };
        };
      }) =>
        Promise.resolve(
          options.where.idHistoriaClinica === 1 &&
            options.where.procesoTerapeutico.idProfesional === 42
            ? { idHistoriaClinica: 1 }
            : null,
        ),
    );
    histories.create.mockImplementation((value: object) => value);
    histories.save.mockImplementation((value: object) =>
      Promise.resolve({ ...value, idHistoriaClinica: 1 }),
    );
    evolutions.find.mockResolvedValue([
      {
        idEvolucionClinica: 1,
        idHistoriaClinica: 1,
        idTurno: 11,
        descripcion: 'Evolucion ficticia',
      },
    ]);
  });
  afterAll(async () => {
    await app?.close();
  });

  it.each(routes)(
    'allows an active professional: %s %s',
    async (method, path, body) => {
      await send(method, path, body, token()).expect(
        path === '/evoluciones-clinicas' ? 503 : method === 'post' ? 201 : 200,
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
        expect(histories.save).not.toHaveBeenCalled();
        expect(evolutions.save).not.toHaveBeenCalled();
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

  it('rejects empty updates before checking any patient', async () => {
    for (const id of [1, 4, 999]) {
      await send('put', `/patients/${id}`, {}, token()).expect(400);
    }
    expect(patients.findByIdAndProfessional).not.toHaveBeenCalled();
    expect(patients.update).not.toHaveBeenCalled();
  });
  it.each([
    'nombre',
    'apellido',
    'telefono',
    'correoElectronico',
    'idTipoDocumento',
    'numeroDocumento',
    'fechaNacimiento',
    'direccion',
  ])('rejects null in mandatory patient field %s', async (field) => {
    await send('put', '/patients/1', { [field]: null }, token()).expect(400);
    expect(patients.update).not.toHaveBeenCalled();
  });
  it('passes explicit null contacts through as a valid partial update', async () => {
    const body = {
      nombreContactoEmergencia: null,
      telefonoContactoEmergencia: null,
    };
    patients.update.mockResolvedValue({ idPaciente: 1, ...body });
    const response = await send('put', '/patients/1', body, token()).expect(
      200,
    );
    expect(response.body).toMatchObject(body);
    expect(patients.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining(body),
      42,
    );
  });
  it('keeps inaccessible patient errors generic even with an unknown document type', async () => {
    patients.findByIdAndProfessional.mockResolvedValue(null);
    const foreign = await send(
      'put',
      '/patients/4',
      { idTipoDocumento: 999 },
      token(),
    ).expect(404);
    const absent = await send(
      'put',
      '/patients/999',
      { idTipoDocumento: 999 },
      token(),
    ).expect(404);
    expect(foreign.body).toEqual(absent.body);
    expect(patients.update).not.toHaveBeenCalled();
  });
  it.each([
    ['23505', 'IDX_proceso_activo_por_paciente', 409],
    ['23505', 'other_unique', 500],
    ['23503', 'IDX_proceso_activo_por_paciente', 500],
  ])(
    'safely handles process insert failure %s %s',
    async (code, constraint, status) => {
      processes.save.mockRejectedValueOnce(
        new QueryFailedError(
          'SENTINEL_SQL',
          ['SENTINEL_DOCUMENT'],
          Object.assign(new Error('SENTINEL_EMAIL'), {
            code,
            constraint,
            detail: 'SENTINEL_CLINICAL_NOTE',
          }),
        ),
      );
      const response = await send(
        'post',
        '/procesos-terapeuticos',
        { idPaciente: 1 },
        token(),
      ).expect(status);
      expect(JSON.stringify(response.body)).not.toContain('SENTINEL');
      expect(response.body).toMatchObject({
        message:
          status === 409
            ? 'No se pudo crear el proceso porque existe un proceso activo.'
            : 'No se pudo completar la operación.',
      });
    },
  );
  it.each([
    'patient-create',
    'patient-list',
    'patient-access',
    'patient-update',
    'process-patient-read',
    'process-read',
    'process-update',
    'history-process-read',
    'history-save',
    'evolution-history-read',
    'evolution-list',
  ])(
    'sanitizes unexpected %s errors without forwarding them to logs',
    async (step) => {
      const failure = new QueryFailedError(
        'SENTINEL_SQL',
        ['SENTINEL_DOCUMENT', 'SENTINEL_EMAIL'],
        Object.assign(new Error('SENTINEL_CLINICAL_NOTE'), {
          detail: 'SENTINEL_CLINICAL_NOTE',
        }),
      );
      const logger = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      try {
        let method = 'post',
          path = '/patients',
          body: object = patient;
        if (step === 'patient-create')
          patients.create.mockRejectedValueOnce(failure);
        if (step === 'patient-list') {
          method = 'get';
          patients.findAllByProfessional.mockRejectedValueOnce(failure);
        }
        if (step === 'patient-access' || step === 'patient-update') {
          method = 'put';
          path = '/patients/1';
          body = { telefono: '1100000001' };
          if (step === 'patient-access')
            patients.findByIdAndProfessional.mockRejectedValueOnce(failure);
          else patients.update.mockRejectedValueOnce(failure);
        }
        if (step === 'process-patient-read') {
          path = '/procesos-terapeuticos';
          body = { idPaciente: 1 };
          manager.findOne.mockRejectedValueOnce(failure);
        }
        if (step === 'process-read' || step === 'process-update') {
          method = 'patch';
          path = '/procesos-terapeuticos/1/estado';
          body = { idEstadoProcesoTerapeutico: 3 };
          if (step === 'process-read')
            processes.findOne.mockRejectedValueOnce(failure);
          else processBuilder.execute.mockRejectedValueOnce(failure);
        }
        if (step === 'history-process-read' || step === 'history-save') {
          method = 'post';
          path = '/historias-clinicas';
          body = {
            idProcesoTerapeutico: 1,
            motivoConsulta: 'Ficticio',
            antecedentes: 'Ficticios',
            diagnostico: 'Ficticio',
          };
          if (step === 'history-process-read')
            processes.findOne.mockRejectedValueOnce(failure);
          else histories.save.mockRejectedValueOnce(failure);
        }
        if (step === 'evolution-history-read' || step === 'evolution-list') {
          method = 'get';
          path = '/evoluciones-clinicas/historia-clinica/1';
          body = {};
          if (step === 'evolution-history-read')
            histories.findOne.mockRejectedValueOnce(failure);
          else evolutions.find.mockRejectedValueOnce(failure);
        }
        const response = await send(method, path, body, token()).expect(500);
        expect(response.body).toEqual({
          statusCode: 500,
          message: 'No se pudo completar la operación.',
          error: 'Internal Server Error',
        });
        expect(
          JSON.stringify([
            response.body,
            logger.mock.calls,
            consoleError.mock.calls,
            consoleWarn.mock.calls,
          ]),
        ).not.toContain('SENTINEL');
        expect(logger).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
        expect(consoleWarn).not.toHaveBeenCalled();
      } finally {
        logger.mockRestore();
        consoleError.mockRestore();
        consoleWarn.mockRestore();
      }
    },
  );

  it('creates a history only for the process scoped to the JWT professional', async () => {
    const body = {
      idProcesoTerapeutico: 1,
      motivoConsulta: 'Ficticio',
      antecedentes: 'Ficticios',
      diagnostico: 'Ficticio',
    };
    const response = await send(
      'post',
      '/historias-clinicas',
      body,
      token(),
    ).expect(201);
    expect(response.body).toMatchObject(body);
    expect(processes.findOne).toHaveBeenCalledWith({
      where: { idProcesoTerapeutico: 1, idProfesional: 42 },
    });
  });
  it('keeps history creation restricted to active processes', async () => {
    processes.findOne.mockResolvedValue({
      idProcesoTerapeutico: 1,
      idProfesional: 42,
      idEstadoProcesoTerapeutico: 3,
    });
    await send(
      'post',
      '/historias-clinicas',
      {
        idProcesoTerapeutico: 1,
        motivoConsulta: 'Ficticio',
        antecedentes: 'Ficticios',
        diagnostico: 'Ficticio',
      },
      token(),
    ).expect(400);
    expect(histories.save).not.toHaveBeenCalled();
  });
  it('hides foreign and absent histories or processes without writes', async () => {
    const results: unknown[] = [];
    for (const id of [4, 999]) {
      const history = await send(
        'post',
        '/historias-clinicas',
        {
          idProcesoTerapeutico: id,
          motivoConsulta: 'Ficticio',
          antecedentes: 'Ficticios',
          diagnostico: 'Ficticio',
        },
        token(),
      ).expect(404);
      const list = await send(
        'get',
        `/evoluciones-clinicas/historia-clinica/${id}`,
        {},
        token(),
      ).expect(404);
      const create = await send(
        'post',
        '/evoluciones-clinicas',
        { idHistoriaClinica: id, idTurno: 11, descripcion: 'Ficticio' },
        token(),
      ).expect(404);
      results.push(history.body, list.body, create.body);
    }
    for (const result of results)
      expect(result).toEqual({
        statusCode: 404,
        message: 'Recurso no encontrado',
        error: 'Not Found',
      });
    expect(histories.save).not.toHaveBeenCalled();
    expect(evolutions.save).not.toHaveBeenCalled();
    expect(evolutions.find).not.toHaveBeenCalled();
  });
  it('does not grant the second professional access to the first professional history', async () => {
    professionalRepository.findOne.mockResolvedValue({
      idProfesional: 99,
      fechaBaja: null,
    });
    await send(
      'get',
      '/evoluciones-clinicas/historia-clinica/1',
      {},
      token('PROFESIONAL', 8),
    ).expect(404);
    expect(histories.findOne).toHaveBeenCalledWith({
      where: {
        idHistoriaClinica: 1,
        procesoTerapeutico: { idProfesional: 99 },
      },
    });
    expect(evolutions.find).not.toHaveBeenCalled();
  });
  it('lists evolutions only within an accessible history and professional', async () => {
    const response = await send(
      'get',
      '/evoluciones-clinicas/historia-clinica/1',
      {},
      token(),
    ).expect(200);
    expect(response.body).toEqual([
      {
        idEvolucionClinica: 1,
        idHistoriaClinica: 1,
        idTurno: 11,
        descripcion: 'Evolucion ficticia',
      },
    ]);
    expect(evolutions.find).toHaveBeenCalledWith({
      where: {
        idHistoriaClinica: 1,
        historiaClinica: { procesoTerapeutico: { idProfesional: 42 } },
      },
    });
  });
  it.each([11, 99999])(
    'keeps evolution creation closed even for an accessible history and turn %s',
    async (idTurno) => {
      await send(
        'post',
        '/evoluciones-clinicas',
        { idHistoriaClinica: 1, idTurno, descripcion: 'Ficticio' },
        token(),
      ).expect(503);
      expect(evolutions.create).not.toHaveBeenCalled();
      expect(evolutions.save).not.toHaveBeenCalled();
    },
  );
  it.each([
    [
      'post',
      '/historias-clinicas',
      {
        idProcesoTerapeutico: 1,
        motivoConsulta: 'Ficticio',
        antecedentes: 'Ficticios',
        diagnostico: 'Ficticio',
        idProfesional: 99,
      },
    ],
    [
      'post',
      '/evoluciones-clinicas',
      {
        idHistoriaClinica: 1,
        idTurno: 11,
        descripcion: 'Ficticio',
        professionalId: 99,
      },
    ],
    ['get', '/evoluciones-clinicas/historia-clinica/abc', {}],
  ])(
    'preserves validation on new clinical routes %s %s',
    async (method, path, body) => {
      await send(method, path, body, token()).expect(400);
      expect(histories.save).not.toHaveBeenCalled();
      expect(evolutions.save).not.toHaveBeenCalled();
    },
  );
  it.each([undefined, true, false])(
    'creates a single patient with pareja %s',
    async (pareja) => {
      const response = await send(
        'post',
        '/patients',
        { ...patient, ...(pareja === undefined ? {} : { pareja }) },
        token(),
      ).expect(201);
      expect(response.body).toMatchObject({ pareja: pareja ?? false });
      expect(patients.create).toHaveBeenCalledTimes(1);
      expect(patients.create).toHaveBeenCalledWith(
        expect.objectContaining({ pareja: pareja ?? false }),
        42,
      );
    },
  );
  it.each([true, false])(
    'permits a pareja-only update to %s',
    async (pareja) => {
      patients.update.mockResolvedValue({ idPaciente: 1, pareja });
      await send('put', '/patients/1', { pareja }, token()).expect(200);
      expect(patients.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ pareja }),
        42,
      );
    },
  );
  it.each([null, 'true', 1])(
    'rejects nonboolean pareja %s in POST and PUT',
    async (pareja) => {
      await send('post', '/patients', { ...patient, pareja }, token()).expect(
        400,
      );
      await send('put', '/patients/1', { pareja }, token()).expect(400);
      expect(patients.create).not.toHaveBeenCalled();
      expect(patients.update).not.toHaveBeenCalled();
    },
  );
});
