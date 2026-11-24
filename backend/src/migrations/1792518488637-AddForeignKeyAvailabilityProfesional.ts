import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForeignKeyAvailabilityProfesional1792518488637 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "availabilities"
        ADD CONSTRAINT "FK_availabilities_profesional"
        FOREIGN KEY ("professional_id")
        REFERENCES "profesionales"("idProfesional")
        ON DELETE RESTRICT
        ON UPDATE NO ACTION
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "availabilities"
        DROP CONSTRAINT "FK_availabilities_profesional"
    `);
    }

}
