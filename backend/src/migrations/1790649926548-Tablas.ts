import { MigrationInterface, QueryRunner } from "typeorm";

export class Tablas1790649926548 implements MigrationInterface {
    name = 'Tablas1790649926548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patients" ("idPaciente" SERIAL NOT NULL, "nombre" character varying NOT NULL, "apellido" character varying NOT NULL, "telefono" character varying NOT NULL, "correoElectronico" character varying NOT NULL, "idTipoDocumento" integer NOT NULL, "numeroDocumento" character varying NOT NULL, "fechaNacimiento" date NOT NULL, "direccion" character varying NOT NULL, "nombreContactoEmergencia" character varying, "telefonoContactoEmergencia" character varying, CONSTRAINT "PK_53f046212c81219558acc9c004a" PRIMARY KEY ("idPaciente"))`);
        await queryRunner.query(`CREATE TABLE "procesos_terapeuticos" ("idProcesoTerapeutico" SERIAL NOT NULL, "idProfesional" integer NOT NULL, "idEstadoProcesoTerapeutico" integer NOT NULL, "observaciones" text, "fechaInicio" date NOT NULL, "fechaFinalizacion" date, "motivoFinalizacion" text, "idPaciente" integer, CONSTRAINT "PK_e9f1805d9614c89a27e79b30593" PRIMARY KEY ("idProcesoTerapeutico"))`);
        await queryRunner.query(`ALTER TABLE "procesos_terapeuticos" ADD CONSTRAINT "FK_f44e41450be30579e7a719a65aa" FOREIGN KEY ("idPaciente") REFERENCES "patients"("idPaciente") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "procesos_terapeuticos" DROP CONSTRAINT "FK_f44e41450be30579e7a719a65aa"`);
        await queryRunner.query(`DROP TABLE "procesos_terapeuticos"`);
        await queryRunner.query(`DROP TABLE "patients"`);
    }

}
