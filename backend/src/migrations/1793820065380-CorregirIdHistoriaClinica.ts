import { MigrationInterface, QueryRunner } from "typeorm";

export class CorregirIdHistoriaClinica1793820065380 implements MigrationInterface {
    name = 'CorregirIdHistoriaClinica1793820065380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historias_clinicas" RENAME COLUMN "idHistorialClinica" TO "idHistoriaClinica"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" RENAME CONSTRAINT "PK_c5d8865dcc961d25b5537c65aa9" TO "PK_328c23f9af4af13f1a8ef7b291c"`);
        await queryRunner.query(`ALTER SEQUENCE "historias_clinicas_idHistorialClinica_seq" RENAME TO "historias_clinicas_idHistoriaClinica_seq"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER SEQUENCE "historias_clinicas_idHistoriaClinica_seq" RENAME TO "historias_clinicas_idHistorialClinica_seq"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" RENAME CONSTRAINT "PK_328c23f9af4af13f1a8ef7b291c" TO "PK_c5d8865dcc961d25b5537c65aa9"`);
        await queryRunner.query(`ALTER TABLE "historias_clinicas" RENAME COLUMN "idHistoriaClinica" TO "idHistorialClinica"`);
    }

}
