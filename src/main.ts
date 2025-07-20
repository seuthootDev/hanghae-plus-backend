import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('항해+ E-Commerce Swagger')
    .setDescription('E-Commerce API 문서')
    .setVersion('1.0')
    .addTag('users', '사용자 관련 API')
    .addTag('products', '상품 관련 API')
    .addTag('orders', '주문 관련 API')
    .addTag('coupons', '쿠폰 관련 API')
    .addTag('payments', '결제 관련 API')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
