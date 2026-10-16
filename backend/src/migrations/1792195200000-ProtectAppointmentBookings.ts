import { MigrationInterface, QueryRunner } from 'typeorm';
// No ejecutar sin autorizacion. No corrige ni elimina registros incompatibles.
export class ProtectAppointmentBookings1792195200000 implements MigrationInterface {
  name = 'ProtectAppointmentBookings1792195200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "created_at" timestamptz NOT NULL DEFAULT now(), ADD "updated_at" timestamptz NOT NULL DEFAULT now(), ADD "created_by_user_id" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_creator" FOREIGN KEY ("created_by_user_id") REFERENCES "usuarios"("idUsuario") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "CK_appointments_time_order" CHECK ("start_time" < "end_time")`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "EX_appointments_professional_time" EXCLUDE USING gist ("professional_id" WITH =, tsrange("date" + "start_time", "date" + "end_time", '[)') WITH &&) WHERE ("status" IN ('RESERVED','CONFIRMED','ATTENDED','NOT_ATTENDED'))`,
    );
  }
  down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    return Promise.reject(
      new Error(
        'La reversión requiere revisión manual para conservar auditoría y protección de turnos',
      ),
    );
  }
}
