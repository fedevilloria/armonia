import 'dotenv/config';
import { DataSource } from 'typeorm';
import { AvailabilityOrmEntity } from './modules/availabilities/infrastructure/persistence/availability.orm-entity';

export const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [
    __dirname + '/**/*.entity{.ts,.js}',
    AvailabilityOrmEntity,
  ],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: false,
});