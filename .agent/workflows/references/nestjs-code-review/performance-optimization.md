# NestJS 性能优化指南

本文档提供 NestJS 应用的全面性能优化策略，涵盖数据库、缓存、异步处理等方面。

## 目录
- [数据库查询优化](#数据库查询优化)
- [缓存策略](#缓存策略)
- [异步处理与队列](#异步处理与队列)
- [连接池优化](#连接池优化)
- [压缩与响应优化](#压缩与响应优化)
- [日志优化](#日志优化)
- [内存管理](#内存管理)
- [监控与分析](#监控与分析)

---

## 数据库查询优化

### N+1 问题解决

```typescript
// ❌ 坏：N+1 问题
async getAllUsersWithOrders(): Promise<User[]> {
  const users = await this.userRepository.find(); // 1 次查询

  for (const user of users) {
    user.orders = await this.orderRepository.find({
      where: { userId: user.id }, // N 次查询
    });
  }
  return users; // 总共 1 + N 次查询
}

// ✅ 好：使用 JOIN（1 次查询）
async getAllUsersWithOrders(): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order')
    .getMany(); // 只有 1 次查询
}

// ✅ 好：使用 relations
async getAllUsersWithOrders(): Promise<User[]> {
  return this.userRepository.find({
    relations: ['orders'],
  });
}
```

### 选择性字段加载

```typescript
// ❌ 坏：加载所有字段
async getUserEmails(): Promise<User[]> {
  return this.userRepository.find(); // 选择所有列
}

// ✅ 好：只选择需要的字段
async getUserEmails(): Promise<{ id: string; email: string }[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.email'])
    .getMany();
}

// ✅ 更好：使用原始查询以获得最佳性能
async getUserEmailsOptimized(): Promise<{ email: string }[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .select('user.email', 'email')
    .getRawMany();
}
```

### 索引优化

```typescript
// ✅ 好：为常查询字段添加索引
@Entity()
@Index(['email']) // 单列索引
@Index(['status', 'createdAt']) // 复合索引
export class User {
  @Column()
  email: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  // 外键索引
  @ManyToOne(() => Company)
  @Index()
  company: Company;
}

// PostgreSQL 部分索引（只索引活跃用户）
@Entity()
@Index('idx_active_users', ['email'], {
  where: 'is_active = true',
})
export class User {
  @Column()
  email: string;

  @Column()
  isActive: boolean;
}
```

### 批量操作

```typescript
// ❌ 坏：循环插入
async createUsers(usersDto: CreateUserDto[]): Promise<User[]> {
  const users = [];
  for (const dto of usersDto) {
    const user = await this.userRepository.save(dto); // N 次数据库调用
    users.push(user);
  }
  return users;
}

// ✅ 好：批量插入
async createUsers(usersDto: CreateUserDto[]): Promise<User[]> {
  const users = this.userRepository.create(usersDto);
  return this.userRepository.save(users); // 1 次批量操作
}

// ✅ 好：使用 insert() 获得更好性能
async createUsersOptimized(usersDto: CreateUserDto[]): Promise<void> {
  await this.userRepository.insert(usersDto); // 最快的批量插入
}
```

### 分页优化

```typescript
// ✅ 好：基于游标的分页（大数据集）
async getPaginatedUsers(
  cursor?: string,
  limit: number = 20,
): Promise<{ users: User[]; nextCursor: string }> {
  const query = this.userRepository
    .createQueryBuilder('user')
    .orderBy('user.id', 'ASC')
    .limit(limit + 1);

  if (cursor) {
    query.where('user.id > :cursor', { cursor });
  }

  const users = await query.getMany();
  const hasMore = users.length > limit;
  const results = hasMore ? users.slice(0, -1) : users;

  return {
    users: results,
    nextCursor: hasMore ? results[results.length - 1].id : null,
  };
}

// ⚠️ offset/limit 分页（小数据集可以，大数据集性能差）
async getPaginatedUsersOffset(
  page: number,
  limit: number,
): Promise<{ users: User[]; total: number }> {
  const [users, total] = await this.userRepository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return { users, total };
}
```

### 查询缓存

```typescript
// ✅ 好：启用 TypeORM 查询缓存
async getPopularProducts(): Promise<Product[]> {
  return this.productRepository
    .createQueryBuilder('product')
    .where('product.views > :views', { views: 1000 })
    .cache(true, 60000) // 缓存 60 秒
    .getMany();
}

// 使用自定义缓存键
async getProductsByCategory(category: string): Promise<Product[]> {
  return this.productRepository
    .createQueryBuilder('product')
    .where('product.category = :category', { category })
    .cache(`products_category_${category}`, 60000)
    .getMany();
}
```

---

## 缓存策略

### Redis 缓存

```typescript
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private userRepository: UserRepository,
  ) {}

  async getUserById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库查询
    const user = await this.userRepository.findOne({ where: { id } });

    // 存入缓存
    await this.cacheManager.set(cacheKey, user, 300); // 5 分钟 TTL

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.save({ id, ...dto });

    // 更新后使缓存失效
    await this.cacheManager.del(`user:${id}`);

    return user;
  }
}
```

### Cache-Aside 模式

```typescript
@Injectable()
export class ProductService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private productRepository: ProductRepository,
  ) {}

  async getProduct(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;

    // 1. 检查缓存
    let product = await this.cache.get<Product>(cacheKey);

    if (!product) {
      // 2. 缓存未命中，从数据库加载
      product = await this.productRepository.findOne({ where: { id } });

      if (product) {
        // 3. 存入缓存
        await this.cache.set(cacheKey, product, 600); // 10 分钟
      }
    }

    return product;
  }
}
```

### 缓存拦截器

```typescript
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('products')
@UseInterceptors(CacheInterceptor)
export class ProductController {
  @Get()
  @CacheKey('all_products')
  @CacheTTL(300) // 5 分钟
  async findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }
}
```

### 缓存预热

```typescript
@Injectable()
export class CacheWarmupService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private productService: ProductService,
  ) {}

  @Cron('0 0 * * *') // 每天午夜
  async warmupProductCache() {
    const popularProducts = await this.productService.getPopularProducts();

    for (const product of popularProducts) {
      await this.cache.set(`product:${product.id}`, product, 3600);
    }
  }
}
```

---

## 异步处理与队列

### 使用 Bull 队列

```typescript
// 队列模块配置
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})
export class EmailModule {}

// 生产者
@Injectable()
export class UserService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.save(dto);

    // 异步发送欢迎邮件
    await this.emailQueue.add('welcome', {
      email: user.email,
      name: user.name,
    });

    return user; // 立即返回，不等待邮件发送
  }
}

// 消费者
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcomeEmail(job: Job) {
    const { email, name } = job.data;
    await this.emailService.sendWelcomeEmail(email, name);
  }
}
```

### 后台任务优化

```typescript
// ❌ 坏：阻塞请求
@Post('report')
async generateReport(@Body() dto: ReportDto): Promise<Report> {
  const data = await this.fetchLargeDataset(); // 耗时操作
  const report = await this.processData(data);  // 耗时操作
  await this.saveReport(report);                // 耗时操作
  return report; // 用户等待很久
}

// ✅ 好：异步处理
@Post('report')
async generateReport(@Body() dto: ReportDto): Promise<{ jobId: string }> {
  const job = await this.reportQueue.add('generate', dto);
  return { jobId: job.id }; // 立即返回作业 ID
}

@Get('report/:jobId')
async getReportStatus(@Param('jobId') jobId: string) {
  const job = await this.reportQueue.getJob(jobId);
  return {
    status: await job.getState(),
    progress: job.progress(),
    result: job.returnvalue,
  };
}
```

---

## 连接池优化

### TypeORM 连接池配置

```typescript
// data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // 连接池配置
  extra: {
    max: 20,                    // 最大连接数
    min: 5,                     // 最小连接数
    idleTimeoutMillis: 30000,   // 空闲连接超时
    connectionTimeoutMillis: 2000, // 连接超时
  },
});
```

### 连接池监控

```typescript
@Injectable()
export class DatabaseHealthService {
  constructor(private dataSource: DataSource) {}

  async checkPoolStatus() {
    const pool = this.dataSource.driver.pool;

    return {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };
  }
}
```

---

## 压缩与响应优化

### 启用压缩

```typescript
import * as compression from 'compression';

// main.ts
app.use(compression({
  threshold: 1024, // 只压缩大于 1KB 的响应
  level: 6,        // 压缩级别（0-9）
}));
```

### 响应流式传输

```typescript
// ✅ 好：流式传输大文件
@Get('export')
async exportData(@Res() res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=data.csv');

  const stream = await this.dataService.getDataStream();
  stream.pipe(res);
}

// ❌ 坏：一次性加载所有数据到内存
@Get('export')
async exportData(): Promise<string> {
  const allData = await this.dataService.getAllData(); // 可能非常大
  return this.convertToCsv(allData);
}
```

### 分页响应

```typescript
// ✅ 好：始终分页大列表
@Get('users')
async getUsers(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  return this.userService.getPaginated(page, limit);
}
```

---

## 日志优化

### 结构化日志

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class OptimizedLoggerService {
  private readonly logger = new Logger(OptimizedLoggerService.name);

  // ✅ 好：结构化日志
  logRequest(method: string, url: string, duration: number) {
    this.logger.log({
      type: 'request',
      method,
      url,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  // ❌ 坏：字符串拼接日志（难以解析）
  logRequestBad(method: string, url: string, duration: number) {
    this.logger.log(`${method} ${url} took ${duration}ms`);
  }
}
```

### 生产环境日志级别

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production'
    ? ['error', 'warn'] // 生产环境只记录错误和警告
    : ['log', 'error', 'warn', 'debug', 'verbose'], // 开发环境全部
});
```

---

## 内存管理

### 避免内存泄漏

```typescript
// ❌ 坏：事件监听器未清理
@Injectable()
export class BadService implements OnModuleDestroy {
  constructor(private eventEmitter: EventEmitter2) {
    this.eventEmitter.on('data', this.handleData);
  }

  handleData(data: any) {
    // 处理数据
  }
  // 没有清理！内存泄漏！
}

// ✅ 好：正确清理
@Injectable()
export class GoodService implements OnModuleDestroy {
  constructor(private eventEmitter: EventEmitter2) {
    this.eventEmitter.on('data', this.handleData);
  }

  handleData(data: any) {
    // 处理数据
  }

  onModuleDestroy() {
    this.eventEmitter.off('data', this.handleData); // 清理
  }
}
```

### 流式处理大数据

```typescript
// ✅ 好：使用流处理大文件
async processLargeFile(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    await this.processLine(line); // 逐行处理
  }
}

// ❌ 坏：一次性读取整个文件
async processLargeFileBad(filePath: string) {
  const content = await fs.promises.readFile(filePath, 'utf-8'); // 可能占用大量内存
  const lines = content.split('\n');
  for (const line of lines) {
    await this.processLine(line);
  }
}
```

---

## 监控与分析

### 性能监控

```typescript
import { PerformanceObserver, performance } from 'perf_hooks';

@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);

  constructor() {
    const obs = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        this.logger.warn(`慢操作检测: ${entry.name} 耗时 ${entry.duration}ms`);
      });
    });
    obs.observe({ entryTypes: ['measure'] });
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const end = performance.now();
      const duration = end - start;

      if (duration > 1000) { // 超过 1 秒
        performance.mark(`${name}-start`);
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
    });
  }
}
```

### 健康检查

```typescript
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1000 }),
    ]);
  }
}
```

### APM 集成

```typescript
// 集成 Prometheus
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
  });

  recordRequest(method: string, route: string, status: number, duration: number) {
    this.requestCounter.inc({ method, route, status });
    this.requestDuration.observe({ method, route }, duration / 1000);
  }
}
```

---

## 性能最佳实践总结

### 数据库
- ✅ 解决 N+1 问题（使用 JOIN）
- ✅ 只选择需要的字段
- ✅ 为常查询字段添加索引
- ✅ 使用批量操作
- ✅ 实施查询缓存
- ✅ 使用游标分页处理大数据集
- ✅ 优化连接池配置

### 缓存
- ✅ 实施 Redis 缓存
- ✅ 使用 Cache-Aside 模式
- ✅ 缓存热点数据
- ✅ 设置合适的 TTL
- ✅ 更新时使缓存失效

### 异步处理
- ✅ 使用队列处理耗时操作
- ✅ 不阻塞 HTTP 请求
- ✅ 实施后台作业

### 响应优化
- ✅ 启用压缩
- ✅ 使用分页
- ✅ 流式传输大文件
- ✅ 减少响应载荷大小

### 监控
- ✅ 实施性能监控
- ✅ 设置健康检查
- ✅ 使用 APM 工具
- ✅ 记录慢查询

### 避免
- ❌ N+1 查询
- ❌ 在循环中进行数据库调用
- ❌ 加载不必要的字段
- ❌ 阻塞操作在请求路径中
- ❌ 内存泄漏
- ❌ 一次性加载大数据集
