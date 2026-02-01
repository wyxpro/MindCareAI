import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Profile } from '../users/entities/profile.entity';

/**
 * 认证模块
 * 简单的用户名/密码验证
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Profile]),
    JwtModule.registerAsync({
      // 全局提供 JwtService，供各模块的 JwtAuthGuard 使用
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
