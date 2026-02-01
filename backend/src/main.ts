import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';
import { join } from 'path';

/**
 * 应用程序入口
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  const apiPrefix = process.env.API_PREFIX || 'api/v1';

  // 语音/多模态等大体积请求体需要更高上限
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  // 静态文件服务 - 提供 uploads 目录中的文件
  app.use('/uploads', json({ limit: '20mb' }), require('express').static(join(__dirname, '..', 'uploads')));

  // 语音识别日志在服务层输出，这里不重复记录

  app.setGlobalPrefix(apiPrefix);

  // API 版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // CORS 配置
  const corsEnabled = process.env.CORS_ENABLED === 'true';
  if (corsEnabled) {
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  }

  // 全局验证管道
  const validationLogger = new Logger('Validation');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果有未定义的属性则抛出错误
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        validationLogger.error(`Validation failed: ${JSON.stringify(details)}`);
        return new BadRequestException(details);
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger 文档配置（无需认证）
  const config = new DocumentBuilder()
    .setTitle('MindCareAI API')
    .setDescription('MindCareAI 后端 API 文档 - 租户模式')
    .setVersion('1.0')
    .addTag('auth', '认证相关接口（简单用户名/密码）')
    .addTag('users', '用户管理接口')
    .addTag('tenants', '租户管理接口')
    .addTag('ai', 'AI 服务接口')
    .addTag('emotion-diaries', '情绪日记接口')
    .addTag('assessments', '评估记录接口')
    .addTag('healing', '疗愈内容接口')
    .addTag('community', '社区接口')
    .addTag('doctor', '医生管理接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`🔌 API Prefix: /${apiPrefix}`);
  console.log(`🏠 Mode: Tenant (Simple Username/Password)`);
}

bootstrap();
