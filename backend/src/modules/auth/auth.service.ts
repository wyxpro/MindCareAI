import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { LoginDto, LoginResponseDto, RegisterDto } from "./dto";
import { Tenant } from "../tenants/entities/tenant.entity";
import { Profile } from "../users/entities/profile.entity";

/**
 * 认证服务
 * 简单的用户名/密码验证，支持租户模式
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 用户登录
   * 验证用户名和密码，返回租户信息和 Token
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`login attempt: ${loginDto.username}`);
    const tenant = await this.tenantRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!tenant) {
      this.logger.warn(`login failed: user not found: ${loginDto.username}`);
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      tenant.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(`login failed: invalid password: ${loginDto.username}`);
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 生成 JWT Token
    const payload = {
      username: tenant.username,
      sub: tenant.id,
      role: "user", // 默认角色
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // 返回登录成功信息
    this.logger.log(`login success: ${tenant.username} (${tenant.id})`);
    return {
      success: true,
      username: tenant.username,
      tenantId: tenant.id,
      displayName: tenant.display_name || tenant.username,
      accessToken,
      message: "登录成功",
    };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const { username, password, email, phone } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.tenantRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      this.logger.warn(`register failed: username exists: ${username}`);
      throw new ConflictException("用户名已存在");
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 使用事务确保 Tenant 和 Profile 同时创建成功
    try {
      this.logger.log(`register attempt: ${username}`);
      return await this.dataSource.transaction(async (manager) => {
        // 1. 创建并保存租户
        const newTenant = manager.create(Tenant, {
          username,
          password: hashedPassword,
          email,
          phone,
          display_name: username,
        });

        const savedTenant = await manager.save(newTenant);

        // 2. 创建并保存用户档案
        const newProfile = manager.create(Profile, {
          id: savedTenant.id,
          username: savedTenant.username,
          email: savedTenant.email,
          phone: savedTenant.phone,
          full_name: savedTenant.display_name,
          role: "user",
        });

        const savedProfile = await manager.save(newProfile);

        // 3. 自动登录: 生成 JWT Token
        const payload = {
          username: savedTenant.username,
          sub: savedTenant.id,
          role: savedProfile.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);

        this.logger.log(
          `register success: ${savedTenant.username} (${savedTenant.id})`,
        );
        return {
          success: true,
          username: savedTenant.username,
          tenantId: savedTenant.id,
          displayName: savedTenant.display_name,
          accessToken,
          message: "注册成功",
        };
      });
    } catch (error) {
      this.logger.error(
        `register failed: ${username}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 验证租户凭证（用于中间件）
   */
  async validateTenant(
    username: string,
    password: string,
  ): Promise<Tenant | null> {
    const tenant = await this.tenantRepository.findOne({
      where: { username },
    });

    if (!tenant) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, tenant.password);
    if (!isPasswordValid) {
      return null;
    }

    return tenant;
  }
}
