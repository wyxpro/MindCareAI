import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Profile } from './entities/profile.entity';

/**
 * 用户模块
 * 处理用户档案管理
 */
@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
