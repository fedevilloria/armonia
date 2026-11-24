
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTherapeuticProcesses1793800000001
  implements MigrationInterface
{
  name = 'CreateTherapeuticProcesses1793800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear la tabla de estados del proceso terapéutico
    await queryRunner.query(`
      CREATE TABLE "estados_proceso_terapeutico" (
        "idEstadoProcesoTerapeutico" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        CONSTRAINT "UQ_estados_proceso_nombre" UNIQUE ("nombre"),
        CONSTRAINT "PK_estados_proceso"
          PRIMARY KEY ("idEstadoProcesoTerapeutico")
      )
    `);

    // 2. Registrar los estados iniciales
    await queryRunner.query(`
      INSERT INTO "estados_proceso_terapeutico"
        ("idEstadoProcesoTerapeutico", "nombre")
      VALUES
        (1, 'Activo'),
        (2, 'Dado de alta'),
        (3, 'Inactivo'),
        (4, 'Derivado')
    `);

    // 3. Ajustar la secuencia
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence(
          'estados_proceso_terapeutico',
          'idEstadoProcesoTerapeutico'
        ),
        4
      )
    `);

    // 4. Agregar la relación con profesionales
    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      ADD CONSTRAINT "FK_proceso_profesional"
      FOREIGN KEY ("idProfesional")
      REFERENCES "profesionales"("idProfesional")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    // 5. Agregar la relación con estados
    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      ADD CONSTRAINT "FK_proceso_estado"
      FOREIGN KEY ("idEstadoProcesoTerapeutico")
      REFERENCES "estados_proceso_terapeutico"("idEstadoProcesoTerapeutico")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    // 6. Exigir que cada proceso tenga un paciente
    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      ALTER COLUMN "idPaciente" SET NOT NULL
    `);

    // 7. Impedir más de un proceso activo por paciente
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_proceso_activo_por_paciente"
      ON "procesos_terapeuticos" ("idPaciente")
      WHERE "idEstadoProcesoTerapeutico" = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir únicamente los cambios de esta migración
    await queryRunner.query(`
      DROP INDEX "IDX_proceso_activo_por_paciente"
    `);

    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      ALTER COLUMN "idPaciente" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      DROP CONSTRAINT "FK_proceso_estado"
    `);

    await queryRunner.query(`
      ALTER TABLE "procesos_terapeuticos"
      DROP CONSTRAINT "FK_proceso_profesional"
    `);

    await queryRunner.query(`
      DROP TABLE "estados_proceso_terapeutico"
    `);
  }
}
