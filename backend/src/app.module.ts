import { Module } from "@nestjs/common";
import { join } from "path";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { configuration } from "./config/configuration";
import { TypeOrmConfigService } from "./config/typeorm.config";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { UsersModule } from "./modules/users/users.module";
import { AiModule } from "./modules/ai/ai.module";
import { EmotionDiariesModule } from "./modules/emotion-diaries/emotion-diaries.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { HealingModule } from "./modules/healing/healing.module";
import { CommunityModule } from "./modules/community/community.module";
import { DoctorModule } from "./modules/doctor/doctor.module";

/**
 * 根模块
 * 负责导入和配置所有子模块
 * 使用简单的租户模式，无需 JWT 认证
 */
@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env", ".env.local"],
    }),

    // 速率限制配置
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60秒时间窗口
        limit: 100, // 最多100次请求
      },
    ]),

    // TypeORM 配置 - 使用异步配置以便使用环境变量
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),

    // 健康检查模块
    HealthModule,

    // 认证模块（简化版，仅用户名/密码验证）
    AuthModule,

    // 租户模块
    TenantsModule,

    // 用户模块
    UsersModule,

    // AI 服务模块
    AiModule,

    // 情绪日记模块
    EmotionDiariesModule,

    // 评估记录模块
    AssessmentsModule,

    // 疗愈内容模块
    HealingModule,

    // 社区模块
    CommunityModule,

    // 医生管理模块
    DoctorModule,

    // 静态文件服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
