
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatients1793800000000 implements MigrationInterface {
    name = 'CreatePatients1793800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "patients" (
                "idPaciente" SERIAL NOT NULL,
                "nombre" character varying NOT NULL,
                "apellido" character varying NOT NULL,
                "telefono" character varying NOT NULL,
                "correoElectronico" character varying NOT NULL,
                "idTipoDocumento" integer NOT NULL,
                "numeroDocumento" character varying NOT NULL,
                "fechaNacimiento" date NOT NULL,
                "direccion" character varying NOT NULL,
                "nombreContactoEmergencia" character varying,
                "telefonoContactoEmergencia" character varying,
                CONSTRAINT "PK_patients_idPaciente"
                    PRIMARY KEY ("idPaciente")
            )
        `);

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
        await queryRunner.query(`
            ALTER TABLE "patients"
            DROP CONSTRAINT "FK_patients_tipo_documento"
        `);

        await queryRunner.query(`
            DROP TABLE "patients"
        `);
    }
}
