import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Tenant } from "./entities/tenant.entity";
import { CreateTenantDto, UpdateTenantDto, TenantDto } from "./dto";

/**
 * 租户服务
 */
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * 创建租户
   */
  async create(createDto: CreateTenantDto): Promise<TenantDto> {
    // 检查用户名是否已存在
    const existing = await this.tenantRepository.findOne({
      where: { username: createDto.username },
    });

    if (existing) {
      throw new ConflictException("用户名已存在");
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const tenant = this.tenantRepository.create({
      ...createDto,
      password: hashedPassword,
      display_name: createDto.displayName,
    });

    const saved = await this.tenantRepository.save(tenant);
    return this.toDto(saved);
  }

  /**
   * 获取所有租户
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: TenantDto[]; total: number }> {
    const [items, total] = await this.tenantRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { created_at: "DESC" },
    });

    return {
      items: items.map((item) => this.toDto(item)),
      total,
    };
  }

  /**
   * 获取单个租户
   */
  async findOne(id: string): Promise<TenantDto> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException("租户不存在");
    }

    return this.toDto(tenant);
  }

  /**
   * 根据用户名获取租户
   */
  async findByUsername(username: string): Promise<TenantDto | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { username },
    });

    return tenant ? this.toDto(tenant) : null;
  }

  /**
   * 更新租户
   */
  async update(id: string, updateDto: UpdateTenantDto): Promise<TenantDto> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException("租户不存在");
    }

    // 如果要更新密码，需要加密
    if ((updateDto as any).password) {
      (updateDto as any).password = await bcrypt.hash(
        (updateDto as any).password,
        10,
      );
    }

    Object.assign(tenant, updateDto);
    const updated = await this.tenantRepository.save(tenant);
    return this.toDto(updated);
  }

  /**
   * 删除租户
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException("租户不存在");
    }

    await this.tenantRepository.remove(tenant);
  }

  /**
   * 转换为 DTO（不包含密码）
   */
  private toDto(tenant: Tenant): TenantDto {
    return {
      id: tenant.id,
      username: tenant.username,
      display_name: tenant.display_name,
      email: tenant.email || undefined,
      phone: tenant.phone || undefined,
      avatar_url: tenant.avatar_url || undefined,
      is_active: tenant.is_active,
      settings: tenant.settings || undefined,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
    };
  }
}
