import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient, RiskAlert, KnowledgeBase } from './entities/doctor.entity';

import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

/**
 * 医生管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([DoctorPatient, RiskAlert, KnowledgeBase])],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService, TypeOrmModule],
})
export class DoctorModule { }
