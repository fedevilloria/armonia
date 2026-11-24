import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProfesionalesEspecialidades1790702655133 implements MigrationInterface {
    name = 'CreateProfesionalesEspecialidades1790702655133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tipos_documento" ("idTipoDocumento" SERIAL NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "PK_407ecb7ccf28cef8a43ea576519" PRIMARY KEY ("idTipoDocumento"))`);
        await queryRunner.query(`CREATE TABLE "especialidades" ("idEspecialidad" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "UQ_e86aa92137833eed8ba2656dbc0" UNIQUE ("nombre"), CONSTRAINT "PK_dfaae907144c726c85912044430" PRIMARY KEY ("idEspecialidad"))`);
        await queryRunner.query(`CREATE TABLE "profesionales" ("idProfesional" SERIAL NOT NULL, "nroDNI" character varying NOT NULL, "matricula" character varying NOT NULL, "telefono" character varying NOT NULL, "descripcionProfesional" character varying NOT NULL, "fechaBaja" TIMESTAMP, "idUsuario" integer NOT NULL, "idTipoDocumento" integer NOT NULL, "idEspecialidad" integer NOT NULL, CONSTRAINT "UQ_5dbeca7185b312a21fbac28a945" UNIQUE ("nroDNI"), CONSTRAINT "UQ_44b4d72ab03679b3ac88c16f34c" UNIQUE ("matricula"), CONSTRAINT "REL_0c90402ca898346925fac41411" UNIQUE ("idUsuario"), CONSTRAINT "PK_91e6264feb4c77c8f1427ce961c" PRIMARY KEY ("idProfesional"))`);
        await queryRunner.query(`ALTER TABLE "profesionales" ADD CONSTRAINT "FK_0c90402ca898346925fac414117" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("idUsuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profesionales" ADD CONSTRAINT "FK_7c0ff4d019e74460714dfd53d21" FOREIGN KEY ("idTipoDocumento") REFERENCES "tipos_documento"("idTipoDocumento") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profesionales" ADD CONSTRAINT "FK_3cd639345faa833665a40808dd4" FOREIGN KEY ("idEspecialidad") REFERENCES "especialidades"("idEspecialidad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profesionales" DROP CONSTRAINT "FK_3cd639345faa833665a40808dd4"`);
        await queryRunner.query(`ALTER TABLE "profesionales" DROP CONSTRAINT "FK_7c0ff4d019e74460714dfd53d21"`);
        await queryRunner.query(`ALTER TABLE "profesionales" DROP CONSTRAINT "FK_0c90402ca898346925fac414117"`);
        await queryRunner.query(`DROP TABLE "profesionales"`);
        await queryRunner.query(`DROP TABLE "especialidades"`);
        await queryRunner.query(`DROP TABLE "tipos_documento"`);
    }

}
