
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatients1793800000000 implements MigrationInterface {
  name = 'CreatePatients1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // La tabla patients ya fue creada por la migración Tablas.
    // Agregamos la relación con tipos_documento.

    await queryRunner.query(`
      ALTER TABLE "patients"
      ADD CONSTRAINT "FK_patients_tipo_documento"
      FOREIGN KEY ("idTipoDocumento")
      REFERENCES "tipos_documento"("idTipoDocumento")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir únicamente los cambios de esta migración.

    await queryRunner.query(`
      ALTER TABLE "patients"
      DROP CONSTRAINT "FK_patients_tipo_documento"
    `);
  }
}
