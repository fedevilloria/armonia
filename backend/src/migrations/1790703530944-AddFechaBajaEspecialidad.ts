import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFechaBajaEspecialidad1790703530944 implements MigrationInterface {
    name = 'AddFechaBajaEspecialidad1790703530944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "especialidades" ADD "fechaBaja" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "especialidades" DROP COLUMN "fechaBaja"`);
    }

}
