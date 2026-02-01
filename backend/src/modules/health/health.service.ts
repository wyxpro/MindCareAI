import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WearableData } from './entities/wearable-data.entity';

@Injectable()
export class HealthService {
    constructor(
        @InjectRepository(WearableData)
        private readonly wearableRepository: Repository<WearableData>,
    ) { }

    /**
     * 获取用户的健康数据列表
     */
    async findWearableData(userId: string, limit: number = 30): Promise<WearableData[]> {
        return this.wearableRepository.find({
            where: { user_id: userId },
            order: { record_date: 'DESC' } as any,
            take: limit,
        });
    }

    /**
     * 创建/更新健康数据
     */
    async createWearableData(userId: string, data: Partial<WearableData>): Promise<WearableData> {
        const wearable = this.wearableRepository.create({
            ...data,
            user_id: userId,
        });
        return this.wearableRepository.save(wearable);
    }
}
