import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseSeeder } from './database/seeder';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('항해+ E-Commerce Swagger')
    .setDescription('E-Commerce API 문서')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS 설정
  app.enableCors();
  
  // 글로벌 prefix 설정
  app.setGlobalPrefix('api');
  
  // 데이터베이스 시딩 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    try {
      // TypeORM이 테이블을 생성할 시간을 줍니다
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const dataSource = app.get(DataSource);
      const seeder = new DatabaseSeeder(dataSource);
      await seeder.seed();
    } catch (error) {
      console.log('⚠️ 시딩 중 오류 발생:', error.message);
    }
  }
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 애플리케이션이 포트 ${port}에서 실행 중입니다.`);
}
bootstrap();
