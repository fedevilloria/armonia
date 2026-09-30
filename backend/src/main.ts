import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Inicializa y configura la aplicacion NestJS.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Valida automaticamente los DTO recibidos por los endpoints.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();