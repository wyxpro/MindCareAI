# NestJS 架构与最佳实践

本文档提供 NestJS 应用架构、设计模式和代码组织的全面最佳实践。

## 目录
- [模块架构](#模块架构)
- [依赖注入](#依赖注入)
- [SOLID 原则](#solid-原则)
- [守卫、拦截器与中间件](#守卫拦截器与中间件)
- [管道与 DTOs](#管道与-dtos)
- [异常过滤器](#异常过滤器)
- [项目结构](#项目结构)

---

## 模块架构

### 模块设计原则

**单一职责模块**：每个模块应封装单一的业务领域或功能区域。模块是基本构建块，应将相关的控制器、提供者和服务分组。

```typescript
// ✅ 好：专注的模块
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService]
})
export class UserModule {}

// ❌ 坏：混合关注点
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService]
})
export class AppModule {} // 职责过多
```

### 模块组织模式

**功能模块**：按业务领域组织，而非技术层
```
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   └── entities/
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   └── products.service.ts
└── orders/
```

**共享模块**：用于通用工具和横切关注点
```typescript
@Module({
  providers: [LoggerService, ConfigService],
  exports: [LoggerService, ConfigService]
})
export class SharedModule {}
```

**核心模块**：用于全局使用的单例服务（数据库、配置）
```typescript
@Global()
@Module({
  providers: [DatabaseService, AppConfigService],
  exports: [DatabaseService, AppConfigService]
})
export class CoreModule {}
```

---

## 依赖注入

### 提供者模式

**构造函数注入**：始终使用基于构造函数的注入
```typescript
// ✅ 好：构造函数注入
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService
  ) {}
}

// ❌ 坏：属性注入（更难测试）
@Injectable()
export class UserService {
  @Inject() private userRepository: UserRepository;
}
```

### 提供者作用域

**默认作用域（SINGLETON）**：用于无状态服务
```typescript
@Injectable()
export class UserService {
  // 在整个应用中共享
}
```

**REQUEST 作用域**：仅当需要请求特定数据时使用
```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestLoggerService {
  // 每个请求创建新实例（谨慎使用 - 有性能影响）
}
```

### 自定义提供者

**使用值提供者**用于配置或常量：
```typescript
const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useValue: connection,
  },
];
```

**使用工厂提供者**用于异步初始化：
```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async (config: ConfigService) => {
    return await createConnection(config.getDatabaseConfig());
  },
  inject: [ConfigService],
}
```

---

## SOLID 原则

### 单一职责原则（SRP）

每个类应该只有一个改变的理由。

```typescript
// ✅ 好：分离关注点
@Injectable()
export class OrderService {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return this.orderRepository.save(data);
  }
}

@Injectable()
export class OrderNotificationService {
  async sendOrderConfirmation(order: Order): Promise<void> {
    await this.emailService.send(order.email, '订单确认');
  }
}

// ❌ 坏：多个职责
@Injectable()
export class OrderService {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepository.save(data);
    // 将订单创建与邮件逻辑混合
    await this.emailService.send(data.email, '确认邮件');
    return order;
  }
}
```

### 开闭原则（OCP）

对扩展开放，对修改关闭。

```typescript
// ✅ 好：使用策略模式实现可扩展性
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
}

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    // Stripe 实现
  }
}

@Injectable()
export class PayPalPaymentStrategy implements PaymentStrategy {
  async pay(amount: number): Promise<PaymentResult> {
    // PayPal 实现
  }
}

@Injectable()
export class PaymentService {
  constructor(private strategy: PaymentStrategy) {}

  processPayment(amount: number) {
    return this.strategy.pay(amount);
  }
}

// ❌ 坏：Switch 语句需要为新支付类型修改
@Injectable()
export class PaymentService {
  async processPayment(type: string, amount: number) {
    switch(type) {
      case 'stripe': // 每种新类型都需要修改现有代码
        return this.stripePayment(amount);
      case 'paypal':
        return this.paypalPayment(amount);
    }
  }
}
```

### 里氏替换原则（LSP）

派生类必须能够替换其基类。

```typescript
// ✅ 好：一致的接口
abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}

class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
```

### 接口隔离原则（ISP）

多个特定客户端接口优于一个通用接口。

```typescript
// ✅ 好：特定接口
interface Readable {
  read(id: string): Promise<Entity>;
}

interface Writable {
  create(data: CreateDto): Promise<Entity>;
  update(id: string, data: UpdateDto): Promise<Entity>;
}

// 服务只实现它们需要的
@Injectable()
export class ReadOnlyService implements Readable {
  async read(id: string): Promise<Entity> { /* ... */ }
}

@Injectable()
export class FullAccessService implements Readable, Writable {
  async read(id: string): Promise<Entity> { /* ... */ }
  async create(data: CreateDto): Promise<Entity> { /* ... */ }
  async update(id: string, data: UpdateDto): Promise<Entity> { /* ... */ }
}
```

### 依赖倒置原则（DIP）

依赖抽象，而非具体实现。NestJS 的 DI 容器强力支持这一点。

```typescript
// ✅ 好：依赖接口/抽象类
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IEmailService') private emailService: IEmailService
  ) {}
}

// ❌ 坏：直接依赖具体实现
@Injectable()
export class UserService {
  constructor(private gmailService: GmailService) {} // 紧耦合
}
```

---

## 守卫、拦截器与中间件

### 守卫（认证与授权）

**认证守卫**：
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// 使用
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {}
```

**基于角色的授权守卫**：
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 自定义装饰器
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// 使用
@Post()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async create(@Body() dto: CreateDto) {}
```

### 拦截器

**日志拦截器**：
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        console.log(`${method} ${url} ${responseTime}ms`);
      }),
    );
  }
}
```

**转换拦截器**（用于统一响应结构）：
```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

**缓存拦截器**：
```typescript
@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  // 为频繁访问的端点实现缓存逻辑
}

// 使用
@Controller('products')
@UseInterceptors(HttpCacheInterceptor)
export class ProductController {}
```

### 中间件

**请求日志中间件**：
```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }
}

// 在模块中应用
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
```

**最佳实践执行顺序**：中间件 → 守卫 → 拦截器（前） → 管道 → 控制器 → 拦截器（后） → 异常过滤器

---

## 管道与 DTOs

### 验证管道

**全局验证管道**（推荐）：
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // 剥离 DTO 中不存在的属性
  forbidNonWhitelisted: true, // 对额外属性抛出错误
  transform: true,            // 自动将载荷转换为 DTO 实例
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

### DTO 最佳实践

**使用 class-validator 装饰器**：
```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

**为创建/更新操作分离 DTOs**：
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // 所有字段对于更新都是可选的
}
```

**使用类型转换**：
```typescript
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

---

## 异常过滤器

### 全局异常过滤器

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : '内部服务器错误';

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : '无堆栈追踪'
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

// 全局注册
app.useGlobalFilters(new AllExceptionsFilter(logger));
```

### 自定义业务异常

```typescript
export class BusinessException extends HttpException {
  constructor(message: string, code: string) {
    super(
      {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// 使用
throw new BusinessException('余额不足', 'INSUFFICIENT_FUNDS');
```

---

## 项目结构

### 推荐结构

```
src/
├── common/                    # 共享工具
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── config/                    # 配置文件
│   ├── database.config.ts
│   └── app.config.ts
├── modules/                   # 功能模块
│   ├── users/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── users.module.ts
│   ├── products/
│   └── orders/
├── core/                      # 核心单例服务
│   ├── database/
│   └── logger/
├── app.module.ts
└── main.ts
```

### 关键组织原则

1. **按功能分组**，而非按文件类型
2. **将相关文件放在一起**在功能模块中
3. **使用桶导出**（index.ts）以实现更清晰的导入
4. **分离关注点**：控制器处理 HTTP，服务处理业务逻辑，仓储处理数据访问
5. **保持控制器精简**：委托给服务
6. **使用仓储模式**与 TypeORM 进行数据访问抽象

### 文件命名约定

- 控制器：`*.controller.ts`
- 服务：`*.service.ts`
- 模块：`*.module.ts`
- DTOs：`*.dto.ts`
- 实体：`*.entity.ts`
- 守卫：`*.guard.ts`
- 拦截器：`*.interceptor.ts`
- 管道：`*.pipe.ts`
- 过滤器：`*.filter.ts`

---

## 其他最佳实践

### 配置管理

使用 `@nestjs/config` 与环境变量：
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

### 异步操作

始终使用 `async/await` 以实现更好的错误处理：
```typescript
// ✅ 好
async createUser(dto: CreateUserDto): Promise<User> {
  try {
    return await this.userRepository.save(dto);
  } catch (error) {
    throw new InternalServerErrorException('创建用户失败');
  }
}

// ❌ 坏：未处理的 promise
createUser(dto: CreateUserDto): Promise<User> {
  return this.userRepository.save(dto); // 没有错误处理
}
```

### 测试最佳实践

测试结构应镜像源代码：
```
src/users/users.service.spec.ts
src/users/users.controller.spec.ts
```

使用 NestJS 测试工具：
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });
});
```
