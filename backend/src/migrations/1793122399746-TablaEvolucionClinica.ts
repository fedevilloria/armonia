import { MigrationInterface, QueryRunner } from "typeorm";

export class TablaEvolucionClinica1793122399746 implements MigrationInterface {
    name = 'TablaEvolucionClinica1793122399746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "evoluciones_clinicas" ("idEvolucionClinica" SERIAL NOT NULL, "idHistoriaClinica" integer NOT NULL, "idTurno" integer NOT NULL, "descripcion" text NOT NULL, CONSTRAINT "PK_1de532547a3906d9cde9dd52c6c" PRIMARY KEY ("idEvolucionClinica"))`);
        await queryRunner.query(`ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "FK_3255ca44b9a70bb0896f47d28e8" FOREIGN KEY ("idHistoriaClinica") REFERENCES "historias_clinicas"("idHistorialClinica") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evoluciones_clinicas" DROP CONSTRAINT "FK_3255ca44b9a70bb0896f47d28e8"`);
        await queryRunner.query(`DROP TABLE "evoluciones_clinicas"`);
    }

}
