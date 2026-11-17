import { DataSource } from 'typeorm';
import { databaseEntities } from './entities';
import { PatientOrmEntity } from '../modules/patients/infrastructure/persistence/patient.orm-entity';
import { TherapeuticProcessOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { TherapeuticProcessStateOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process-state.orm-entity';

class ClinicalMetadataDataSource extends DataSource {
  async inspect() {
    await this.buildMetadatas();
  }
}

describe('Clinical ORM metadata matches existing SQL migrations', () => {
  const source = new ClinicalMetadataDataSource({
    type: 'postgres',
    entities: databaseEntities,
    synchronize: false,
  });
  beforeAll(async () => {
    await source.inspect();
  });

  it('uses the original tables and registers every entity exactly once', () => {
    expect(source.getMetadata(PatientOrmEntity).tableName).toBe('patients');
    expect(source.getMetadata(TherapeuticProcessOrmEntity).tableName).toBe(
      'procesos_terapeuticos',
    );
    expect(source.getMetadata(TherapeuticProcessStateOrmEntity).tableName).toBe(
      'estados_proceso_terapeutico',
    );
    expect(source.entityMetadatas).toHaveLength(10);
    expect(new Set(databaseEntities).size).toBe(10);
    expect(source.isInitialized).toBe(false);
    expect(source.options.synchronize).toBe(false);
  });

  it('maps the document FK without creating another document identifier column', () => {
    const patient = source.getMetadata(PatientOrmEntity);
    const fk = patient.foreignKeys.find(
      (k) => k.name === 'FK_patients_tipo_documento',
    )!;
    expect(fk.columnNames).toEqual(['idTipoDocumento']);
    expect(fk.referencedTablePath).toBe('tipos_documento');
    expect(fk.referencedColumnNames).toEqual(['idTipoDocumento']);
    expect(fk.onDelete).toBe('NO ACTION');
    expect(fk.onUpdate).toBe('NO ACTION');
    expect(
      patient.columns.filter((c) => c.databaseName === 'idTipoDocumento'),
    ).toHaveLength(1);
    expect(
      patient.relations.find((r) => r.propertyName === 'documentType')
        ?.isNullable,
    ).toBe(false);
    expect(fk.columns[0].isNullable).toBe(false);
  });

  it('preserves document uniqueness and existing field types', () => {
    const patient = source.getMetadata(PatientOrmEntity);
    const unique = patient.uniques.find(
      (u) => u.name === 'UQ_patients_tipo_numero_documento',
    )!;
    expect(unique.columns.map((c) => c.databaseName)).toEqual([
      'idTipoDocumento',
      'numeroDocumento',
    ]);
    expect(
      patient.columns.find((c) => c.databaseName === 'fechaNacimiento')?.type,
    ).toBe('date');
    expect(
      patient.columns.find((c) => c.databaseName === 'numeroDocumento')
        ?.isNullable,
    ).toBe(false);
  });

  it.each([
    ['FK_f44e41450be30579e7a719a65aa', 'idPaciente', 'patients', 'idPaciente'],
    [
      'FK_proceso_profesional',
      'idProfesional',
      'profesionales',
      'idProfesional',
    ],
    [
      'FK_proceso_estado',
      'idEstadoProcesoTerapeutico',
      'estados_proceso_terapeutico',
      'idEstadoProcesoTerapeutico',
    ],
  ])('preserves mandatory process FK %s', (name, column, table, reference) => {
    const process = source.getMetadata(TherapeuticProcessOrmEntity);
    const fk = process.foreignKeys.find((k) => k.name === name)!;
    expect(fk.columnNames).toEqual([column]);
    expect(fk.referencedTablePath).toBe(table);
    expect(fk.referencedColumnNames).toEqual([reference]);
    expect(fk.onDelete).toBe('NO ACTION');
    expect(fk.onUpdate).toBe('NO ACTION');
    expect(fk.columns[0].isNullable).toBe(false);
    expect(
      process.columns.filter((c) => c.databaseName === column),
    ).toHaveLength(1);
    expect(
      process.relations.find((r) =>
        r.joinColumns.some((c) => c.databaseName === column),
      )?.isNullable,
    ).toBe(false);
  });

  it('represents exactly the existing partial active-process index', () => {
    const process = source.getMetadata(TherapeuticProcessOrmEntity);
    const index = process.indices.find(
      (i) => i.name === 'IDX_proceso_activo_por_paciente',
    )!;
    expect(index.isUnique).toBe(true);
    expect(index.columns.map((c) => c.databaseName)).toEqual(['idPaciente']);
    expect(index.where).toBe('"idEstadoProcesoTerapeutico" = 1');
    expect(process.uniques).toHaveLength(0);
    expect(process.indices).toHaveLength(1);
  });

  it('maps the persisted state catalog without inventing enum values or defaults', () => {
    const state = source.getMetadata(TherapeuticProcessStateOrmEntity);
    expect(state.columns.map((c) => c.databaseName)).toEqual([
      'idEstadoProcesoTerapeutico',
      'nombre',
    ]);
    expect(state.primaryColumns.map((c) => c.databaseName)).toEqual([
      'idEstadoProcesoTerapeutico',
    ]);
    expect(state.primaryColumns[0].primaryKeyConstraintName).toBe(
      'PK_estados_proceso',
    );
    expect(state.primaryColumns[0].generationStrategy).toBe('increment');
    expect(state.columns.every((c) => !c.isNullable)).toBe(true);
    expect(
      state.uniques
        .find((u) => u.name === 'UQ_estados_proceso_nombre')
        ?.columns.map((c) => c.databaseName),
    ).toEqual(['nombre']);
    expect(
      state.columns.every(
        (c) => c.enum === undefined && c.default === undefined,
      ),
    ).toBe(true);
    expect(
      source.driver.normalizeType(
        state.columns.find((c) => c.databaseName === 'nombre')!,
      ),
    ).toBe('character varying');
  });

  it('does not add direct patient-professional or appointment-process relations', () => {
    expect(
      source
        .getMetadata(PatientOrmEntity)
        .foreignKeys.some((k) => k.referencedTablePath === 'profesionales'),
    ).toBe(false);
    expect(
      source.entityMetadatas
        .find((m) => m.tableName === 'appointments')!
        .foreignKeys.some(
          (k) => k.referencedTablePath === 'procesos_terapeuticos',
        ),
    ).toBe(false);
  });
});
