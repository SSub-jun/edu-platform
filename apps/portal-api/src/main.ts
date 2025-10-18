import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure Prisma can read DATABASE_URL when only PORTAL_DATABASE_URL is provided
  if (process.env.PORTAL_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.PORTAL_DATABASE_URL;
  }
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: process.env.PORTAL_BASE_URL || 'http://localhost:3100',
    credentials: true,
  });

  // 전역 유효성 검사 파이프
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Portal Exam System API')
    .setDescription('Portal Exam System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT ?? '8080', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`✅ portal-api listening on ${port}`);
}

bootstrap();




