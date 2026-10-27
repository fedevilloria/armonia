import { DataSource } from 'typeorm';
import { databaseEntities } from './entities';
import { AppointmentOrmEntity } from '../modules/appointments/infrastructure/persistence/appointment.orm-entity';

class MetadataDataSource extends DataSource {
  async inspect() {
    await this.buildMetadatas();
  }
}

describe('Shared TypeORM entity registration', () => {
  it('builds all registered ORM metadata entries without connecting to a database', async () => {
    const source = new MetadataDataSource({
      type: 'postgres',
      entities: databaseEntities,
      synchronize: false,
    });
    await source.inspect();
    expect(
      source.entityMetadatas.map((entity) => entity.tableName).sort(),
    ).toEqual([
      'appointments',
      'availabilities',
      'especialidades',
      'profesionales',
      'roles',
      'tipos_documento',
      'usuarios',
    ]);
    expect(new Set(databaseEntities).size).toBe(databaseEntities.length);
    const availability = source.entityMetadatas.find(
      (entity) => entity.tableName === 'availabilities',
    )!;
    expect(
      availability.columns.filter(
        (column) => column.databaseName === 'professional_id',
      ),
    ).toHaveLength(1);
    expect(
      availability.foreignKeys.find(
        (key) => key.name === 'FK_availabilities_profesional',
      )?.referencedTablePath,
    ).toBe('profesionales');
    const professional = source.entityMetadatas.find(
      (entity) => entity.tableName === 'profesionales',
    )!;
    const userRelation = professional.relations.find(
      (relation) => relation.propertyName === 'usuario',
    )!;
    expect(userRelation.isOneToOne).toBe(true);
    expect(userRelation.isNullable).toBe(false);
    expect(
      professional.foreignKeys.some(
        (key) =>
          key.columnNames.includes('idUsuario') &&
          key.referencedTablePath === 'usuarios',
      ),
    ).toBe(true);
    expect(
      professional.uniques.some((unique) =>
        unique.columns.some((column) => column.databaseName === 'idUsuario'),
      ),
    ).toBe(true);
    expect(
      userRelation.joinColumns.map((column) => column.databaseName),
    ).toEqual(['idUsuario']);
    const appointment = source.getMetadata(AppointmentOrmEntity);
    expect(appointment.checks.map((check) => check.name)).toContain(
      'CK_appointments_time_order',
    );
    expect(appointment.exclusions.map((exclusion) => exclusion.name)).toContain(
      'EX_appointments_professional_time',
    );
    expect(
      appointment.columns.find((column) => column.propertyName === 'createdAt')
        ?.isCreateDate,
    ).toBe(true);
    expect(
      appointment.columns.find((column) => column.propertyName === 'updatedAt')
        ?.isUpdateDate,
    ).toBe(true);
    expect(
      appointment.foreignKeys.find(
        (key) => key.name === 'FK_appointments_creator',
      )?.referencedTablePath,
    ).toBe('usuarios');
    expect(
      appointment.columns.find((column) => column.propertyName === 'status')
        ?.enum,
    ).toEqual([
      'RESERVED',
      'CONFIRMED',
      'ATTENDED',
      'CANCELLED',
      'RESCHEDULED',
      'NOT_ATTENDED',
    ]);
  });
});
