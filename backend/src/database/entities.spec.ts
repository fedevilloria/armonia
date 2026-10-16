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
