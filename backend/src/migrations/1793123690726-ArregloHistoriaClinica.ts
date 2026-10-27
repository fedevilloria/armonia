import { MigrationInterface, QueryRunner } from "typeorm";

export class ArregloHistoriaClinica1793123690726 implements MigrationInterface {
    name = 'ArregloHistoriaClinica1793123690726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historias_clinicas" DROP COLUMN "motivoconsulta"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" ADD "motivoConsulta" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" ADD "antecedentes" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historias_clinicas" DROP COLUMN "antecedentes"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" DROP COLUMN "motivoConsulta"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" ADD "motivoconsulta" text NOT NULL`);
    }

}
