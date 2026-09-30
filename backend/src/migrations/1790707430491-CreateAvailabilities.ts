import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvailabilities1790707430491 implements MigrationInterface {
    name = 'CreateAvailabilities1790707430491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."availabilities_day_of_week_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`CREATE TABLE "availabilities" ("id" SERIAL NOT NULL, "professional_id" integer NOT NULL, "day_of_week" "public"."availabilities_day_of_week_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "duration" integer NOT NULL, "valid_from" date NOT NULL, "valid_until" date NOT NULL, CONSTRAINT "PK_9562bd8681d40361b1a124ea52c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "availabilities"`);
        await queryRunner.query(`DROP TYPE "public"."availabilities_day_of_week_enum"`);
    }

}
