import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { DoctorPatient, RiskAlert, KnowledgeBase } from './entities/doctor.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('doctor')
@Controller('doctor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) { }

    @Get('patients')
    @ApiOperation({ summary: '获取医生的患者列表' })
    async findPatients(@Request() req): Promise<DoctorPatient[]> {
        return this.doctorService.findPatients(req.user.userId);
    }

    @Get('my-doctors')
    @ApiOperation({ summary: '获取患者的医生列表' })
    async findDoctors(@Request() req): Promise<DoctorPatient[]> {
        return this.doctorService.findDoctors(req.user.userId);
    }

    @Get('alerts')
    @ApiOperation({ summary: '获取风险预警列表' })
    @ApiQuery({ name: 'isHandled', required: false, type: Boolean })
    async findAlerts(@Request() req, @Query('isHandled') isHandled?: boolean): Promise<RiskAlert[]> {
        return this.doctorService.findAlerts(req.user.userId, isHandled);
    }

    @Put('alerts/:id/handle')
    @ApiOperation({ summary: '处理风险预警' })
    async handleAlert(
        @Request() req,
        @Param('id') id: string,
        @Body('notes') notes?: string,
    ) {
        return this.doctorService.handleAlert(id, req.user.userId, notes);
    }

    @Public()
    @Get('knowledge')
    @ApiOperation({ summary: '获取知识库内容' })
    @ApiQuery({ name: 'category', required: false })
    async findKnowledge(@Query('category') category?: string): Promise<KnowledgeBase[]> {
        return this.doctorService.findKnowledge(category);
    }
}
