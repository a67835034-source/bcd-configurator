import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // rawBody: true preserves the exact request bytes on req.rawBody, needed
  // by LineWebhookController to verify LINE's HMAC signature - the default
  // JSON body parser only keeps the parsed object, which won't hash-match.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties from request bodies
      forbidNonWhitelisted: true, // reject requests that include them
      transform: true, // e.g. numeric strings in query params -> number
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
