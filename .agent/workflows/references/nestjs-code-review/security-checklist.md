# NestJS 安全性检查清单

本文档提供 NestJS 应用的全面安全检查清单，基于 OWASP 最佳实践和 NestJS 特定的安全考虑。

## 目录
- [认证与授权](#认证与授权)
- [输入验证与数据清理](#输入验证与数据清理)
- [SQL 注入防护](#sql-注入防护)
- [XSS 防护](#xss-防护)
- [CSRF 防护](#csrf-防护)
- [安全头部](#安全头部)
- [密码与敏感数据](#密码与敏感数据)
- [速率限制](#速率限制)
- [文件上传安全](#文件上传安全)
- [错误处理与日志](#错误处理与日志)
- [依赖安全](#依赖安全)

---

## 认证与授权

### JWT 最佳实践

**安全的 JWT 配置**：
```typescript
// ✅ 好：安全的 JWT 配置
JwtModule.register({
  secret: process.env.JWT_SECRET, // 从环境变量读取
  signOptions: {
    expiresIn: '15m',     // 短期访问令牌
    algorithm: 'HS256',   // 明确指定算法
  },
});

// ❌ 坏：不安全的配置
JwtModule.register({
  secret: 'hardcoded-secret', // 硬编码密钥
  signOptions: {
    expiresIn: '30d',         // 过长的过期时间
  },
});
```

**检查清单**：
- [ ] JWT 密钥存储在环境变量中
- [ ] JWT 密钥足够复杂（至少 256 位）
- [ ] 访问令牌有短过期时间（15-30 分钟）
- [ ] 实现刷新令牌机制
- [ ] 使用 HTTPS 传输令牌
- [ ] 令牌存储在 HttpOnly cookie 中（不是 localStorage）
- [ ] 实现令牌黑名单或撤销机制

### 刷新令牌模式

```typescript
@Injectable()
export class AuthService {
  async login(user: User) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '15m', // 短期访问令牌
      }),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: '7d', // 长期刷新令牌
        secret: process.env.JWT_REFRESH_SECRET, // 不同的密钥
      }),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // 检查令牌是否在黑名单中
      const isBlacklisted = await this.checkBlacklist(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('令牌已失效');
      }

      return {
        access_token: this.jwtService.sign({
          username: payload.username,
          sub: payload.sub,
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }
}
```

### 基于角色的访问控制（RBAC）

```typescript
// ✅ 好：正确的 RBAC 实现
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // 未认证
    }

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用
@Post('admin/users')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async createUser(@Body() dto: CreateUserDto) {
  // 只有管理员可以访问
}
```

**检查清单**：
- [ ] 所有受保护的路由都有守卫
- [ ] 角色检查在后端执行（不依赖前端）
- [ ] 使用最小权限原则
- [ ] 实现基于资源的授权（用户只能访问自己的资源）
- [ ] 记录授权失败

---

## 输入验证与数据清理

### 全局验证管道

```typescript
// main.ts
// ✅ 好：严格的全局验证
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // 剥离未在 DTO 中定义的属性
    forbidNonWhitelisted: true, // 拒绝包含未知属性的请求
    transform: true,            // 自动类型转换
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境隐藏详细错误
  }),
);
```

### DTO 验证

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '请提供有效的邮箱地址' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: '密码至少需要 8 个字符' })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '密码必须包含大写字母、小写字母、数字和特殊字符' }
  )
  password: string;

  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s]*$/, { message: '姓名只能包含字母和空格' })
  name?: string;
}
```

### 自定义验证器

```typescript
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPassword implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    // 自定义密码强度验证
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[@$!%*?&]/.test(password)
    );
  }

  defaultMessage(): string {
    return '密码强度不足';
  }
}
```

**检查清单**：
- [ ] 所有输入都经过验证
- [ ] 使用 whitelist 和 forbidNonWhitelisted
- [ ] 验证数据类型、长度、格式
- [ ] 对用户输入进行清理
- [ ] 验证文件上传
- [ ] 验证 URL 参数和查询参数

---

## SQL 注入防护

### 使用参数化查询

```typescript
// ✅ 好：参数化查询
async findByEmail(email: string): Promise<User> {
  return this.repository
    .createQueryBuilder('user')
    .where('user.email = :email', { email }) // 参数化
    .getOne();
}

async searchUsers(searchTerm: string): Promise<User[]> {
  return this.repository
    .createQueryBuilder('user')
    .where('user.name LIKE :term', { term: `%${searchTerm}%` })
    .getMany();
}

// ❌ 危险：字符串拼接
async findByEmail(email: string): Promise<User> {
  return this.repository
    .createQueryBuilder('user')
    .where(`user.email = '${email}'`) // SQL 注入风险！
    .getOne();
}
```

### 原始查询安全

```typescript
// ✅ 好：参数化原始查询
async customQuery(userId: string): Promise<any> {
  return this.repository.query(
    'SELECT * FROM users WHERE id = $1',
    [userId] // 参数化
  );
}

// ❌ 危险：拼接原始查询
async customQuery(userId: string): Promise<any> {
  return this.repository.query(
    `SELECT * FROM users WHERE id = '${userId}'` // SQL 注入风险！
  );
}
```

**检查清单**：
- [ ] 所有查询都使用参数化
- [ ] 避免字符串拼接构建 SQL
- [ ] 使用 TypeORM QueryBuilder 而非原始查询
- [ ] 如果必须使用原始查询，使用参数化
- [ ] 限制数据库用户权限

---

## XSS 防护

### 输出编码

```typescript
// ✅ 好：清理 HTML 内容
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class PostService {
  async createPost(dto: CreatePostDto): Promise<Post> {
    // 清理 HTML 内容
    const sanitizedContent = sanitizeHtml(dto.content, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
      allowedAttributes: {
        'a': ['href']
      },
    });

    return this.repository.save({
      ...dto,
      content: sanitizedContent,
    });
  }
}
```

### Content-Security-Policy

```typescript
// main.ts
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);
```

**检查清单**：
- [ ] 使用 helmet 设置安全头部
- [ ] 清理用户生成的 HTML 内容
- [ ] 实施 Content-Security-Policy
- [ ] 对输出进行编码
- [ ] 避免使用 dangerouslySetInnerHTML

---

## CSRF 防护

### CSRF 令牌

```typescript
import * as csurf from 'csurf';

// main.ts
app.use(csurf({ cookie: true }));

// 为前端提供 CSRF 令牌
@Controller('auth')
export class AuthController {
  @Get('csrf-token')
  getCsrfToken(@Req() req): { csrfToken: string } {
    return { csrfToken: req.csrfToken() };
  }
}
```

### SameSite Cookie

```typescript
// 设置 SameSite cookie
@Injectable()
export class AuthService {
  async login(@Res() res: Response, user: User) {
    const token = this.jwtService.sign({ sub: user.id });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CSRF 防护
      maxAge: 3600000,
    });

    return res.send({ message: '登录成功' });
  }
}
```

**检查清单**：
- [ ] 状态改变操作使用 CSRF 令牌
- [ ] Cookie 设置 SameSite 属性
- [ ] 使用 HttpOnly 和 Secure cookie
- [ ] 验证 Origin 和 Referer 头部

---

## 安全头部

### 使用 Helmet

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet()); // 应用所有安全头部

// 或自定义配置
app.use(
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // 防止点击劫持
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
```

**检查清单**：
- [ ] X-Frame-Options（防止点击劫持）
- [ ] X-Content-Type-Options（防止 MIME 嗅探）
- [ ] X-XSS-Protection
- [ ] Strict-Transport-Security（HSTS）
- [ ] Content-Security-Policy
- [ ] Referrer-Policy

---

## 密码与敏感数据

### 密码哈希

```typescript
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // ✅ 好：使用 bcrypt 哈希密码
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // 12 轮（推荐）
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(dto: RegisterDto): Promise<User> {
    const hashedPassword = await this.hashPassword(dto.password);

    return this.userRepository.save({
      ...dto,
      password: hashedPassword,
    });
  }
}

// ❌ 坏：明文存储密码
async register(dto: RegisterDto): Promise<User> {
  return this.userRepository.save(dto); // 密码未哈希！
}
```

### 敏感数据排除

```typescript
// ✅ 好：从响应中排除密码
@Entity()
export class User {
  @Column({ select: false }) // 默认不选择
  password: string;

  toJSON() {
    delete this.password; // 序列化时删除
    return this;
  }
}

// 或使用 class-transformer
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;

  @Exclude() // 从响应中排除
  password: string;
}
```

### 环境变量

```typescript
// ✅ 好：使用环境变量
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
      }),
    }),
  ],
})
export class AppModule {}

// ❌ 坏：硬编码密钥
const jwtSecret = 'my-secret-key'; // 不要这样做！
```

**检查清单**：
- [ ] 使用 bcrypt 或 argon2 哈希密码
- [ ] Salt 轮数至少为 10-12
- [ ] 从 API 响应中排除密码
- [ ] 敏感数据存储在环境变量中
- [ ] 不在日志中记录敏感数据
- [ ] 使用 HTTPS 传输敏感数据
- [ ] 实施密码强度要求
- [ ] 实施账户锁定机制

---

## 速率限制

### 使用 @nestjs/throttler

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 时间窗口（秒）
      limit: 10,    // 限制请求数
    }),
  ],
})
export class AppModule {}

// 在控制器中应用
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 覆盖：60 秒内 5 次尝试
  async login(@Body() dto: LoginDto) {
    // 登录逻辑
  }
}
```

### 自定义速率限制

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // 基于用户 ID 而非 IP
    return req.user?.id || req.ip;
  }
}
```

**检查清单**：
- [ ] 登录端点实施速率限制
- [ ] API 端点实施全局速率限制
- [ ] 敏感操作有更严格的限制
- [ ] 考虑基于用户的速率限制
- [ ] 记录速率限制违规

---

## 文件上传安全

### 文件验证

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  private readonly maxSize = 5 * 1024 * 1024; // 5MB

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    // 检查文件大小
    if (file.size > this.maxSize) {
      throw new BadRequestException('文件大小超过 5MB');
    }

    // 检查文件扩展名
    const ext = extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(`不允许的文件类型: ${ext}`);
    }

    // 检查 MIME 类型
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('无效的文件类型');
    }

    return file;
  }
}

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // 生成唯一文件名
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const ext = extname(file.originalname);
          cb(null, `${uniqueName}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File) {
    return { filename: file.filename };
  }
}
```

**检查清单**：
- [ ] 验证文件类型（扩展名和 MIME 类型）
- [ ] 限制文件大小
- [ ] 生成唯一文件名（不使用用户提供的名称）
- [ ] 将上传文件存储在 web 根目录之外
- [ ] 扫描病毒/恶意软件
- [ ] 限制上传速率

---

## 错误处理与日志

### 安全错误处理

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // ✅ 好：记录详细错误，但不暴露给客户端
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // 生产环境隐藏详细错误
    const message =
      process.env.NODE_ENV === 'production' && status === 500
        ? '内部服务器错误'
        : exception instanceof HttpException
        ? exception.getResponse()
        : '发生错误';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### 安全日志

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class SecureLoggerService {
  private readonly logger = new Logger('Security');

  logAuthSuccess(userId: string, ip: string) {
    this.logger.log(`用户 ${userId} 从 ${ip} 成功登录`);
  }

  logAuthFailure(email: string, ip: string) {
    // ✅ 好：记录失败但不泄露用户是否存在
    this.logger.warn(`从 ${ip} 登录尝试失败`);
  }

  logSensitiveOperation(userId: string, operation: string) {
    this.logger.log(`用户 ${userId} 执行了 ${operation}`);
  }

  // ❌ 坏：记录敏感数据
  logUserData(user: User) {
    this.logger.log(`用户数据: ${JSON.stringify(user)}`); // 可能包含密码！
  }
}
```

**检查清单**：
- [ ] 不在错误响应中暴露堆栈追踪
- [ ] 记录安全事件（登录、授权失败）
- [ ] 不在日志中记录敏感数据
- [ ] 实施日志轮转和保留策略
- [ ] 监控异常日志模式
- [ ] 使用结构化日志

---

## 依赖安全

### 定期更新依赖

```bash
# 检查漏洞
npm audit

# 修复漏洞
npm audit fix

# 使用 Snyk
npm install -g snyk
snyk test
snyk monitor
```

### Package.json 安全

```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

**检查清单**：
- [ ] 定期运行 `npm audit`
- [ ] 及时更新依赖
- [ ] 使用 `package-lock.json` 锁定版本
- [ ] 审查新依赖
- [ ] 使用 Snyk 或 Dependabot 监控
- [ ] 最小化依赖数量

---

## 其他安全最佳实践

### HTTPS

```typescript
// main.ts - 强制 HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### CORS 配置

```typescript
// ✅ 好：限制性 CORS
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ❌ 坏：允许所有来源
app.enableCors({
  origin: '*', // 不安全！
});
```

### 安全检查清单总览

**认证**：
- [ ] 实施强 JWT 策略
- [ ] 使用 HTTPS
- [ ] 实施刷新令牌
- [ ] 账户锁定机制

**授权**：
- [ ] 基于角色的访问控制
- [ ] 最小权限原则
- [ ] 基于资源的授权

**输入验证**：
- [ ] 所有输入都经过验证
- [ ] 使用 DTO 和 ValidationPipe
- [ ] 数据清理

**数据保护**：
- [ ] 密码哈希（bcrypt/argon2）
- [ ] 敏感数据加密
- [ ] 环境变量中的密钥

**SQL 注入**：
- [ ] 参数化查询
- [ ] 避免原始 SQL
- [ ] 使用 ORM

**XSS**：
- [ ] 输出编码
- [ ] CSP 头部
- [ ] 清理 HTML

**CSRF**：
- [ ] CSRF 令牌
- [ ] SameSite cookies

**速率限制**：
- [ ] API 速率限制
- [ ] 登录速率限制

**文件上传**：
- [ ] 文件类型验证
- [ ] 文件大小限制
- [ ] 唯一文件名

**错误处理**：
- [ ] 安全错误消息
- [ ] 详细日志
- [ ] 不泄露敏感信息

**依赖**：
- [ ] 定期审计
- [ ] 及时更新
- [ ] 监控漏洞
