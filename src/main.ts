import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para permitir conexiones desde apps móviles
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Puerto
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚗 LLEEVAMEQ BACKEND - RUNNING         ║
  ╠══════════════════════════════════════════╣
  ║   Port: ${port}                         ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║   API: http://localhost:${port}/api       ║
  ║   Database: ${process.env.DATABASE_HOST || 'localhost'}              ║
  ╚══════════════════════════════════════════╝
  `);
}

bootstrap();
