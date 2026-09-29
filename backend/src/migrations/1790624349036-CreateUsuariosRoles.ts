import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsuariosRoles1790624349036 implements MigrationInterface {
    name = 'CreateUsuariosRoles1790624349036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("idRol" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre"), CONSTRAINT "PK_6020a637d4c3c6a727ffd476113" PRIMARY KEY ("idRol"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("idUsuario" SERIAL NOT NULL, "nombre" character varying NOT NULL, "apellido" character varying NOT NULL, "correoElectronico" character varying NOT NULL, "contrasena" character varying NOT NULL, "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(), "idRol" integer NOT NULL, CONSTRAINT "UQ_d5ba0870256945c08f3965e0fb7" UNIQUE ("correoElectronico"), CONSTRAINT "PK_23e41f215fc91d01207123f74af" PRIMARY KEY ("idUsuario"))`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_1cd486e9216c66d450ef9b70740" FOREIGN KEY ("idRol") REFERENCES "roles"("idRol") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_1cd486e9216c66d450ef9b70740"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
