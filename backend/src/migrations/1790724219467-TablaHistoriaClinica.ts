import { MigrationInterface, QueryRunner } from "typeorm";

export class TablaHistoriaClinica1790724219467 implements MigrationInterface {
    name = 'TablaHistoriaClinica1790724219467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "historias_clinicas" ("idHistorialClinica" SERIAL NOT NULL, "idProcesoTerapeutico" integer NOT NULL, "motivoconsulta" text NOT NULL, "diagnostico" text NOT NULL, CONSTRAINT "REL_99bea3b5f1d3273a49c933e995" UNIQUE ("idProcesoTerapeutico"), CONSTRAINT "PK_c5d8865dcc961d25b5537c65aa9" PRIMARY KEY ("idHistorialClinica"))`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" ADD CONSTRAINT "FK_99bea3b5f1d3273a49c933e9956" FOREIGN KEY ("idProcesoTerapeutico") REFERENCES "procesos_terapeuticos"("idProcesoTerapeutico") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historias_clinicas" DROP CONSTRAINT "FK_99bea3b5f1d3273a49c933e9956"`);
        await queryRunner.query(`DROP TABLE "historias_clinicas"`);
    }

}
