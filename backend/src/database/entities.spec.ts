import { DataSource } from 'typeorm';
import { databaseEntities } from './entities';
import { AppointmentOrmEntity } from '../modules/appointments/infrastructure/persistence/appointment.orm-entity';

class MetadataDataSource extends DataSource {
  async inspect() {
    await this.buildMetadatas();
  }
}

describe('Shared TypeORM entity registration', () => {
  it('builds all four ORM metadata entries without connecting to a database', async () => {
    const source = new MetadataDataSource({
      type: 'postgres',
      entities: databaseEntities,
      synchronize: false,
    });
    await source.inspect();
    expect(
      source.entityMetadatas.map((entity) => entity.tableName).sort(),
    ).toEqual(['appointments', 'availabilities', 'roles', 'usuarios']);
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
