
import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class AddUniquePatientDocument1794400000000
  implements MigrationInterface
{
  name = 'AddUniquePatientDocument1794400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
      ADD CONSTRAINT "UQ_patients_tipo_numero_documento"
      UNIQUE ("idTipoDocumento", "numeroDocumento")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patients"
      DROP CONSTRAINT "UQ_patients_tipo_numero_documento"
    `);
  }
}
