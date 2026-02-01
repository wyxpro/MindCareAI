import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Profile } from "./entities/profile.entity";
import { UpdateProfileDto, ProfileDto } from "./dto";

/**
 * 用户服务
 * 处理用户档案的 CRUD 操作
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * 根据用户 ID 获取用户档案
   */
  async findOne(id: string): Promise<ProfileDto> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException("用户不存在");
    }
    return this.toDto(profile);
  }

  /**
   * 获取所有用户（仅管理员/医生）
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: ProfileDto[]; total: number }> {
    const [items, total] = await this.profileRepository.findAndCount({
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
   * 更新用户档案
   */
  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<ProfileDto> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException("用户不存在");
    }

    // 权限检查：只能更新自己的档案，或者管理员可以更新任何档案
    const isAdmin = currentUserRole === "admin";
    if (id !== currentUserId && !isAdmin) {
      throw new ForbiddenException("无权更新其他用户的档案");
    }

    // 非管理员不能修改角色
    if (!isAdmin && updateProfileDto.hasOwnProperty("role")) {
      delete (updateProfileDto as any).role;
    }

    Object.assign(profile, updateProfileDto);
    const updated = await this.profileRepository.save(profile);
    return this.toDto(updated);
  }

  /**
   * 删除用户（仅管理员）
   */
  async remove(id: string, currentUserRole: string): Promise<void> {
    if (currentUserRole !== "admin") {
      throw new ForbiddenException("只有管理员可以删除用户");
    }

    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException("用户不存在");
    }

    await this.profileRepository.remove(profile);
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<ProfileDto | null> {
    const profile = await this.profileRepository.findOne({
      where: { username },
    });
    return profile ? this.toDto(profile) : null;
  }

  /**
   * 转换为 DTO
   */
  private toDto(profile: Profile): ProfileDto {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || undefined,
      phone: profile.phone || undefined,
      role: profile.role,
      avatar_url: profile.avatar_url || undefined,
      full_name: profile.full_name || undefined,
      gender: profile.gender || undefined,
      birth_date: profile.birth_date
        ? profile.birth_date.toISOString().split("T")[0]
        : undefined,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}
