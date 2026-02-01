import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantDto } from './dto';

/**
 * 租户控制器
 */
@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * 创建租户
   */
  @Post()
  @ApiOperation({ summary: '创建租户' })
  @ApiResponse({ status: 201, description: '创建成功', type: TenantDto })
  async create(@Body() createDto: CreateTenantDto): Promise<TenantDto> {
    return this.tenantsService.create(createDto);
  }

  /**
   * 获取所有租户
   */
  @Get()
  @ApiOperation({ summary: '获取所有租户' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: TenantDto[]; total: number }> {
    return this.tenantsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  /**
   * 获取单个租户
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个租户' })
  @ApiResponse({ status: 200, description: '获取成功', type: TenantDto })
  async findOne(@Param('id') id: string): Promise<TenantDto> {
    return this.tenantsService.findOne(id);
  }

  /**
   * 更新租户
   */
  @Put(':id')
  @ApiOperation({ summary: '更新租户' })
  @ApiResponse({ status: 200, description: '更新成功', type: TenantDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTenantDto,
  ): Promise<TenantDto> {
    return this.tenantsService.update(id, updateDto);
  }

  /**
   * 删除租户
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除租户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }
}
