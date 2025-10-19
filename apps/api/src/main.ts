import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 정적 파일 서빙 설정 (uploads 폴더)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Validation Pipe 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS 설정 (프로덕션에서는 환경변수로 제어)
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Edu Platform API')
    .setDescription('교육 플랫폼 API 문서')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Railway는 PORT 환경변수를 자동 제공
  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Swagger documentation available at: /docs`);
}
bootstrap();
