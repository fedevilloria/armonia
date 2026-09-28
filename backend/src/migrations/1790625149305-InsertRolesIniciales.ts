import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertRolesIniciales1790625149305 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("nombre", "descripcion")
      VALUES
        ('ADMINISTRADOR', 'Administrador del sistema'),
        ('PROFESIONAL', 'Profesional del centro de salud')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "nombre" IN ('ADMINISTRADOR', 'PROFESIONAL')
    `);
  }
}