import { DataSource } from 'typeorm';
import { databaseEntities } from './entities';
import { PatientOrmEntity } from '../modules/patients/infrastructure/persistence/patient.orm-entity';
import { TherapeuticProcessOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { TherapeuticProcessStateOrmEntity } from '../modules/therapeutic-processes/infrastructure/persistence/therapeutic-process-state.orm-entity';
import { ClinicalHistoryOrmEntity } from '../modules/clinical-histories/infrastructure/persistence/clinical-history.orm-entity';
import { ClinicalEvolutionOrmEntity } from '../modules/clinical-evolutions/infrastructure/persistence/clinical-evolution.orm-entity';

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
    expect(source.entityMetadatas).toHaveLength(12);
    expect(new Set(databaseEntities).size).toBe(12);
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

  it('maps coherent history-process and history-evolution inverses without connecting', () => {
    const process = source.getMetadata(TherapeuticProcessOrmEntity);
    const history = source.getMetadata(ClinicalHistoryOrmEntity);
    const evolution = source.getMetadata(ClinicalEvolutionOrmEntity);
    const processHistory = process.relations.find(
      (r) => r.propertyName === 'historiaClinica',
    )!;
    const historyProcess = history.relations.find(
      (r) => r.propertyName === 'procesoTerapeutico',
    )!;
    expect(processHistory.inverseRelation).toBe(historyProcess);
    expect(historyProcess.inverseRelation).toBe(processHistory);
    expect(historyProcess.isNullable).toBe(false);
    expect(
      history.uniques.some((unique) =>
        unique.columns.some(
          (column) => column.databaseName === 'idProcesoTerapeutico',
        ),
      ),
    ).toBe(true);
    expect(historyProcess.joinColumns.map((c) => c.databaseName)).toEqual([
      'idProcesoTerapeutico',
    ]);
    expect(
      history.foreignKeys.find(
        (k) => k.name === 'FK_99bea3b5f1d3273a49c933e9956',
      )?.referencedTablePath,
    ).toBe('procesos_terapeuticos');
    const evolutionHistory = evolution.relations.find(
      (r) => r.propertyName === 'historiaClinica',
    )!;
    expect(evolutionHistory.inverseRelation?.propertyName).toBe('evoluciones');
    expect(evolutionHistory.isNullable).toBe(false);
    expect(
      evolution.foreignKeys.find(
        (k) => k.name === 'FK_3255ca44b9a70bb0896f47d28e8',
      )?.referencedTablePath,
    ).toBe('historias_clinicas');
    expect(
      evolution.foreignKeys.some(
        (k) => k.referencedTablePath === 'appointments',
      ),
    ).toBe(false);
    expect(source.isInitialized).toBe(false);
  });
  it('maps pareja as a nonnullable boolean with default false', () => {
    const column = source
      .getMetadata(PatientOrmEntity)
      .columns.find((c) => c.propertyName === 'pareja')!;
    expect(column.type).toBe('boolean');
    expect(column.isNullable).toBe(false);
    expect(column.default).toBe(false);
    expect(
      source
        .getMetadata(PatientOrmEntity)
        .relations.some((r) => r.isManyToMany),
    ).toBe(false);
  });
});
