import { MigrationInterface, QueryRunner } from 'typeorm';

// Migracion aditiva del modelo existente; no define nuevas reglas de negocio.
export class CreateAppointments1792108800000 implements MigrationInterface {
  name = 'CreateAppointments1792108800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_enum" AS ENUM('RESERVED', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'RESCHEDULED', 'NOT_ATTENDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" SERIAL NOT NULL, "professional_id" integer NOT NULL, "patient_id" integer NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'RESERVED', CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"))`,
    );
  }

  down(_queryRunner: QueryRunner): Promise<void> {
    void _queryRunner;
    return Promise.reject(
      new Error(
        'La reversión requiere revisión manual para evitar pérdida de turnos',
      ),
    );
  }
}
