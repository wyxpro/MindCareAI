import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPatient, RiskAlert, KnowledgeBase } from './entities/doctor.entity';

@Injectable()
export class DoctorService {
    constructor(
        @InjectRepository(DoctorPatient)
        private readonly patientRepository: Repository<DoctorPatient>,
        @InjectRepository(RiskAlert)
        private readonly alertRepository: Repository<RiskAlert>,
        @InjectRepository(KnowledgeBase)
        private readonly knowledgeRepository: Repository<KnowledgeBase>,
    ) { }

    /**
     * 获取医生的患者列表
     */
    async findPatients(doctorId: string): Promise<DoctorPatient[]> {
        return this.patientRepository.find({
            where: { doctor_id: doctorId, status: 'active' },
            order: { created_at: 'DESC' } as any,
        });
    }

    /**
     * 获取患者的医生列表
     */
    async findDoctors(patientId: string): Promise<DoctorPatient[]> {
        return this.patientRepository.find({
            where: { patient_id: patientId, status: 'active' },
            order: { created_at: 'DESC' } as any,
        });
    }

    /**
     * 获取风险预警
     */
    async findAlerts(doctorId: string, isHandled: boolean = false): Promise<RiskAlert[]> {
        // 实际上需要根据医生管辖的患者来过滤预警
        // 这里简化处理，假设风险预警已经带有了患者ID
        return this.alertRepository.find({
            where: { is_handled: isHandled },
            order: { created_at: 'DESC' } as any,
        });
    }

    /**
     * 获取知识库内容
     */
    async findKnowledge(category?: string): Promise<KnowledgeBase[]> {
        if (category) {
            return this.knowledgeRepository.find({
                where: { category, is_active: true },
                order: { created_at: 'DESC' } as any,
            });
        }
        return this.knowledgeRepository.find({
            where: { is_active: true },
            order: { created_at: 'DESC' } as any,
        });
    }

    /**
     * 创建风险预警
     */
    async createAlert(alertData: Partial<RiskAlert>): Promise<RiskAlert> {
        const alert = this.alertRepository.create(alertData);
        return this.alertRepository.save(alert);
    }

    /**
     * 处理预警
     */
    async handleAlert(alertId: string, userId: string, notes?: string): Promise<RiskAlert> {
        const alert = await this.alertRepository.findOne({ where: { id: alertId } });
        if (!alert) {
            throw new NotFoundException('预警不存在');
        }
        alert.is_handled = true;
        alert.handled_by = userId;
        alert.handled_at = new Date();
        alert.notes = notes;
        return this.alertRepository.save(alert);
    }
}
