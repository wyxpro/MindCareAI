# Swagger API 文档最佳实践

## 核心原则

**文档即代码（Docs as Code）+ AI 辅助**

在 NestJS 项目中，API 文档通过 `@nestjs/swagger` 装饰器自动生成。前端/全栈成员通过 Swagger UI 或 AI 分析代码查看接口。

- **代码注释即文档** - 通过装饰器和 JSDoc 注释生成文档
- **文档与代码同步** - 代码更新时文档自动更新
- **AI 辅助理解** - 复杂逻辑通过 AI 分析代码理解

## 必备配置

### 基本配置（main.ts）

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('项目 API 文档')
    .setDescription('项目 API 接口文档')
    .setVersion('1.0')
    .addBearerAuth()  // 添加 JWT 认证
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

启动后访问：`http://localhost:3000/api-docs`

### 环境控制

```typescript
// 生产环境关闭 Swagger
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('api-docs', app, document);
}
```

## Controller 文档规范

### 基本装饰器

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

/**
 * 用户管理控制器
 * @description 处理用户相关的HTTP请求
 */
@Controller('user')
@ApiTags('用户管理')  // 接口分组
export class UserController {

  /**
   * 用户登录
   * @description 验证用户名密码，返回JWT Token
   * @param loginDto 登录信息
   * @returns 返回Token和用户信息
   */
  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '验证用户名密码，返回JWT Token。密码使用 bcrypt 加密比对。'
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponse
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.userService.validateUser(loginDto);
  }

  /**
   * 获取用户信息
   * @description 根据用户ID获取用户详细信息
   * @param id 用户ID
   * @returns 用户信息
   */
  @Get(':id')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserResponse
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async getUserById(@Param('id') id: number) {
    return this.userService.findById(id);
  }
}
```

### 装饰器完整列表

#### 控制器级别

- `@ApiTags('标签名')` - 接口分组（必须）
- `@ApiBearerAuth()` - 需要 JWT 认证的控制器

#### 方法级别

- `@ApiOperation({ summary, description })` - 接口说明（必须）
- `@ApiResponse({ status, description, type })` - 响应说明（必须）
- `@ApiParam({ name, description, type })` - 路径参数说明
- `@ApiQuery({ name, description, type, required })` - 查询参数说明
- `@ApiBody({ type, description })` - 请求体说明

## DTO 文档规范

### 请求 DTO

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

/**
 * 用户登录 DTO
 */
export class LoginDto {
  /**
   * 用户名或邮箱
   * @example admin
   */
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'admin',
    required: true,
  })
  @IsString()
  username: string;

  /**
   * 密码
   * @example 123456
   */
  @ApiProperty({
    description: '密码（6-20位）',
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsString()
  @MinLength(6)
  password: string;

  /**
   * 是否记住登录状态
   * @example true
   */
  @ApiProperty({
    description: '是否记住登录状态',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  remember?: boolean;
}
```

### 响应 DTO

```typescript
/**
 * 登录响应 DTO
 */
export class LoginResponse {
  /**
   * JWT Token
   */
  @ApiProperty({
    description: 'JWT Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  /**
   * Token 过期时间（秒）
   */
  @ApiProperty({
    description: 'Token 过期时间（秒）',
    example: 604800,
  })
  expiresIn: number;

  /**
   * 用户信息
   */
  @ApiProperty({
    description: '用户信息',
    type: UserInfo,
  })
  userInfo: UserInfo;
}

/**
 * 用户信息 DTO
 */
export class UserInfo {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'admin@example.com' })
  email: string;

  @ApiProperty({ description: '角色列表', example: ['admin', 'user'] })
  roles: string[];
}
```

### DTO 装饰器属性

```typescript
@ApiProperty({
  description: '字段描述',        // 必填，说明字段含义
  example: '示例值',             // 推荐，提供示例
  type: String,                 // 类型（可选，TS会自动推断）
  required: true,               // 是否必填
  default: '默认值',            // 默认值
  enum: ['value1', 'value2'],  // 枚举值
  minLength: 6,                // 最小长度
  maxLength: 20,               // 最大长度
  minimum: 0,                  // 最小值
  maximum: 100,                // 最大值
  format: 'email',             // 格式（email, url, date等）
})
```

## 复杂场景处理

### 1. 分页接口

```typescript
/**
 * 分页查询 DTO
 */
export class PaginationDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  pageSize?: number = 10;
}

/**
 * 分页响应 DTO
 */
export class PaginatedResponse<T> {
  @ApiProperty({ description: '数据列表' })
  data: T[];

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;
}

// Controller 中使用
@Get('list')
@ApiOperation({ summary: '获取用户列表（分页）' })
@ApiResponse({
  status: 200,
  description: '获取成功',
  type: PaginatedResponse<UserInfo>,
})
async getUserList(@Query() pagination: PaginationDto) {
  return this.userService.findAll(pagination);
}
```

### 2. 文件上传

```typescript
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Post('upload')
@ApiOperation({ summary: '上传用户头像' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@UseInterceptors(FileInterceptor('file'))
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  return this.userService.uploadAvatar(file);
}
```

### 3. 数组响应

```typescript
@Get('all')
@ApiOperation({ summary: '获取所有用户' })
@ApiResponse({
  status: 200,
  description: '获取成功',
  type: [UserInfo],  // 数组类型
})
async getAllUsers() {
  return this.userService.findAll();
}
```

### 4. 枚举类型

```typescript
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export class UpdateUserDto {
  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
```

### 5. 嵌套对象

```typescript
export class AddressDto {
  @ApiProperty({ description: '省份', example: '广东省' })
  province: string;

  @ApiProperty({ description: '城市', example: '深圳市' })
  city: string;

  @ApiProperty({ description: '详细地址', example: '南山区xxx' })
  detail: string;
}

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({
    description: '地址信息',
    type: AddressDto,
  })
  address: AddressDto;
}
```

## 认证文档

### JWT 认证

```typescript
// main.ts 配置
const config = new DocumentBuilder()
  .addBearerAuth()  // 添加 Bearer Token 认证
  .build();

// Controller 中使用
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('user')
@ApiTags('用户管理')
@ApiBearerAuth()  // 整个控制器需要认证
export class UserController {

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, type: UserInfo })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

## 代码审查检查点

### 必须检查项

- [ ] 所有 Controller 都添加了 `@ApiTags()` 装饰器
- [ ] 所有公开接口都添加了 `@ApiOperation()` 装饰器
- [ ] 所有接口都添加了 `@ApiResponse()` 装饰器（至少包含成功和失败响应）
- [ ] 所有 DTO 字段都添加了 `@ApiProperty()` 装饰器
- [ ] `@ApiProperty()` 都包含了 `description` 和 `example`
- [ ] 路径参数使用了 `@ApiParam()` 装饰器
- [ ] 查询参数使用了 `@ApiQuery()` 装饰器
- [ ] 需要认证的接口添加了 `@ApiBearerAuth()` 装饰器
- [ ] main.ts 中正确配置了 Swagger 文档路径

### 质量检查项

- [ ] 接口描述是否清晰准确
- [ ] 是否提供了合理的示例值
- [ ] 是否正确标注了必填/可选字段
- [ ] 错误响应是否完整（401, 403, 404, 500等）
- [ ] 分页接口是否使用了统一的分页 DTO
- [ ] 是否避免暴露敏感信息（密码、内部错误详情等）

### 团队协作要求

- [ ] 接口开发完成后，更新 Swagger 文档链接到飞书任务
- [ ] 接口变更时，在飞书群通知前端并说明变更内容
- [ ] 本地开发环境 Swagger 访问地址：`http://localhost:3000/api-docs`
- [ ] 测试环境 Swagger 访问地址需在项目 README 中说明

## 常见错误

### ❌ 错误示例 1：缺少必要装饰器

```typescript
@Controller('user')
export class UserController {
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }
}
```

**问题**：
- 缺少 `@ApiTags()`
- 缺少 `@ApiOperation()`
- 缺少 `@ApiResponse()`

### ❌ 错误示例 2：DTO 缺少文档

```typescript
export class LoginDto {
  username: string;
  password: string;
}
```

**问题**：
- 缺少 `@ApiProperty()` 装饰器
- 缺少示例值

### ❌ 错误示例 3：不完整的响应说明

```typescript
@Post('login')
@ApiOperation({ summary: '登录' })
@ApiResponse({ status: 200, description: '成功' })
async login(@Body() loginDto: LoginDto) {
  return this.userService.login(loginDto);
}
```

**问题**：
- `summary` 过于简单
- 缺少失败响应（401）
- `@ApiResponse` 缺少 `type` 属性

## ✅ 完整示例

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * 用户认证控制器
 */
@Controller('auth')
@ApiTags('用户认证')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   * @description 验证用户名和密码，返回JWT Token
   */
  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '验证用户名和密码，成功后返回JWT Token。密码使用bcrypt加密验证。',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回Token和用户信息',
    type: LoginResponse,
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误',
  })
  @ApiResponse({
    status: 403,
    description: '账号已被禁用',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }
}

/**
 * 登录请求 DTO
 */
export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'admin',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '密码（6-20位）',
    example: '123456',
    minLength: 6,
    maxLength: 20,
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}

/**
 * 登录响应 DTO
 */
export class LoginResponse {
  @ApiProperty({
    description: 'JWT访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Token过期时间（秒）',
    example: 604800,
  })
  expiresIn: number;

  @ApiProperty({
    description: '用户信息',
    type: UserInfo,
  })
  userInfo: UserInfo;
}
```

## 总结

Swagger 文档的核心是**代码即文档**：

1. **完整性** - 所有公开接口必须有完整的文档装饰器
2. **准确性** - 文档与代码保持同步，通过装饰器自动生成
3. **易用性** - 提供清晰的描述和示例，让前端无需看代码即可调用
4. **协作性** - 文档链接共享给前端，变更及时通知

记住：**好的 API 文档 = 清晰的装饰器 + 完整的 DTO + 准确的示例**
