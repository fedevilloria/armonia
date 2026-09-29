import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTiposDocumento1790705382288 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "tipos_documento" ("descripcion")
            VALUES
            ('DNI'),
            ('Pasaporte'),
            ('Cédula de identidad')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM "tipos_documento"
        WHERE "descripcion" IN (
        'DNI',
        'Pasaporte',
        'Cédula de identidad'
        )
    `);
    }

}
