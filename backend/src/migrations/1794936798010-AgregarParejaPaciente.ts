import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgregarParejaPaciente1794936798010 implements MigrationInterface {
  name = 'AgregarParejaPaciente1794936798010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patients" ADD "pareja" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "pareja"`);
  }
}
