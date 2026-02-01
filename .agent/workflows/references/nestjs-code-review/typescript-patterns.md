# TypeScript 代码质量与模式

本文档提供 TypeScript 在 NestJS 中的代码质量最佳实践，包括类型安全、设计模式和代码风格。

## 目录
- [类型安全](#类型安全)
- [接口与类型](#接口与类型)
- [泛型使用](#泛型使用)
- [错误处理](#错误处理)
- [代码风格](#代码风格)
- [设计模式](#设计模式)
- [代码复杂度](#代码复杂度)

---

## 类型安全

### 避免 any

```typescript
// ❌ 坏：使用 any
async processData(data: any): Promise<any> {
  return data.process(); // 没有类型检查
}

// ✅ 好：使用具体类型
interface ProcessableData {
  id: string;
  value: number;
  process(): ProcessedResult;
}

async processData(data: ProcessableData): Promise<ProcessedResult> {
  return data.process(); // 类型安全
}

// ✅ 好：使用泛型处理未知类型
async processData<T extends { process(): R }, R>(data: T): Promise<R> {
  return data.process();
}
```

### 使用 unknown 替代 any

```typescript
// ❌ 坏：使用 any
function parseJson(json: string): any {
  return JSON.parse(json);
}

// ✅ 好：使用 unknown 并进行类型守卫
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

function processUser(jsonString: string) {
  const data = parseJson(jsonString);

  // 类型守卫
  if (isUser(data)) {
    console.log(data.email); // 类型安全
  }
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'email' in obj &&
    'id' in obj
  );
}
```

### 严格空值检查

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}

// ❌ 坏：未处理 null/undefined
async getUser(id: string): Promise<User> {
  return this.userRepository.findOne({ where: { id } }); // 可能返回 null
}

// ✅ 好：明确处理 null
async getUser(id: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { id } });
}

async getUserOrThrow(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`用户 ${id} 不存在`);
  }
  return user;
}
```

### 类型断言的正确使用

```typescript
// ❌ 坏：过度使用类型断言
const user = data as User; // 不安全
user.email; // 可能在运行时失败

// ✅ 好：使用类型守卫
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}

if (isUser(data)) {
  console.log(data.email); // 类型安全
}

// ✅ 好：使用 zod 或 class-validator 进行运行时验证
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

function parseUser(data: unknown): User {
  return UserSchema.parse(data); // 运行时验证
}
```

---

## 接口与类型

### 接口 vs 类型别名

```typescript
// ✅ 使用接口定义对象形状（可扩展）
interface User {
  id: string;
  email: string;
}

interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
}

// ✅ 使用类型别名定义联合类型、交叉类型等
type UserRole = 'admin' | 'user' | 'guest';

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ✅ 使用类型别名定义工具类型
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type ReadonlyDeep<T> = {
  readonly [K in keyof T]: T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
};
```

### 索引签名

```typescript
// ❌ 坏：过于宽松
interface UserData {
  [key: string]: any; // 太宽松
}

// ✅ 好：使用 Record 类型
type UserData = Record<string, string | number | boolean>;

// ✅ 更好：明确定义已知属性
interface UserData {
  id: string;
  email: string;
  metadata?: Record<string, unknown>; // 只有 metadata 允许动态键
}
```

### 只读属性

```typescript
// ✅ 好：使用 readonly 保护数据
interface User {
  readonly id: string;        // 不可变
  email: string;              // 可变
  readonly createdAt: Date;   // 不可变
}

// ✅ 好：使用 Readonly 工具类型
type ReadonlyUser = Readonly<User>;

// ✅ 好：使用 ReadonlyArray
function processUsers(users: ReadonlyArray<User>) {
  // users.push(...); // 编译错误
  return users.map(u => u.email); // OK
}
```

---

## 泛型使用

### 基础泛型

```typescript
// ✅ 好：泛型仓储
interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class GenericRepository<T> implements BaseRepository<T> {
  constructor(
    private readonly repository: Repository<T>,
  ) {}

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### 泛型约束

```typescript
// ✅ 好：使用泛型约束
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// ✅ 好：多个泛型约束
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

function sortByDate<T extends Timestamped>(items: T[]): T[] {
  return items.sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}
```

### 条件类型

```typescript
// ✅ 好：条件类型实现智能类型推断
type ApiResponse<T> = T extends { error: any }
  ? { success: false; error: string }
  : { success: true; data: T };

// ✅ 好：使用条件类型提取类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type A = Unwrap<Promise<string>>;  // string
type B = Unwrap<number>;           // number

// ✅ 好：排除类型
type NonNullable<T> = T extends null | undefined ? never : T;

type C = NonNullable<string | null>; // string
```

---

## 错误处理

### 类型安全的错误处理

```typescript
// ✅ 好：定义错误类型
class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} 不存在`, 'NOT_FOUND', 404);
  }
}

class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// 使用
async getUser(id: string): Promise<User> {
  const user = await this.repository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundError('User', id);
  }
  return user;
}
```

### Result 类型模式

```typescript
// ✅ 好：使用 Result 类型避免异常
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

async function getUser(id: string): Promise<Result<User, string>> {
  try {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    return { success: true, value: user };
  } catch (error) {
    return { success: false, error: '数据库错误' };
  }
}

// 使用
const result = await getUser('123');
if (result.success) {
  console.log(result.value.email); // 类型安全
} else {
  console.error(result.error);
}
```

### 自定义类型守卫处理错误

```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

async function handleOperation() {
  try {
    await someRiskyOperation();
  } catch (error) {
    if (isError(error)) {
      console.error(error.message);
    } else {
      console.error('未知错误', error);
    }
  }
}
```

---

## 代码风格

### 命名约定

```typescript
// ✅ 好：清晰的命名

// 接口：PascalCase
interface UserRepository {}
interface CreateUserDto {}

// 类：PascalCase
class UserService {}
class AuthGuard {}

// 变量：camelCase
const userData = {};
const isActive = true;

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 类型：PascalCase
type UserRole = 'admin' | 'user';
type ApiResponse<T> = { data: T };

// 枚举：PascalCase（键和值）
enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Suspended = 'SUSPENDED',
}

// 私有属性：使用 private 关键字
class User {
  private password: string;  // ✅ 好
  #hashedPassword: string;   // ✅ 也可以（ES2022）
}
```

### 函数命名

```typescript
// ✅ 好：动词开头，描述性名称

// 获取数据
getUserById(id: string): Promise<User>
fetchUsers(): Promise<User[]>

// 检查条件
isActive(): boolean
hasPermission(permission: string): boolean
canAccess(resource: string): boolean

// 转换数据
toDto(entity: User): UserDto
fromDto(dto: UserDto): User

// 创建/构建
createUser(dto: CreateUserDto): Promise<User>
buildQuery(): QueryBuilder

// 验证
validateEmail(email: string): boolean
checkPermissions(user: User): void

// 处理事件
handleUserCreated(event: UserCreatedEvent): void
onModuleInit(): void
```

### 布尔值命名

```typescript
// ✅ 好：使用 is/has/can/should 前缀
interface User {
  isActive: boolean;
  hasPermission: boolean;
  canEdit: boolean;
  shouldNotify: boolean;
}

// ❌ 坏：模糊的布尔命名
interface User {
  active: boolean;      // 不清楚是状态还是动作
  permission: boolean;  // 不清楚含义
}
```

### 注释最佳实践

```typescript
// ✅ 好：使用 JSDoc 注释
/**
 * 根据 ID 获取用户
 * @param id - 用户 ID
 * @returns 用户对象，如果不存在则返回 null
 * @throws {NotFoundException} 当用户不存在时
 */
async getUserById(id: string): Promise<User | null> {
  return this.repository.findOne({ where: { id } });
}

// ✅ 好：解释"为什么"而不是"是什么"
// 使用 bcrypt 而不是简单哈希以提供额外的安全性
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ 坏：重复代码
// 哈希密码
const hashedPassword = await bcrypt.hash(password, 12);
```

---

## 设计模式

### 仓储模式

```typescript
// ✅ 好：抽象仓储接口
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### 工厂模式

```typescript
// ✅ 好：使用工厂创建复杂对象
interface NotificationStrategy {
  send(message: string, recipient: string): Promise<void>;
}

class EmailNotification implements NotificationStrategy {
  async send(message: string, recipient: string): Promise<void> {
    // 发送邮件
  }
}

class SmsNotification implements NotificationStrategy {
  async send(message: string, recipient: string): Promise<void> {
    // 发送短信
  }
}

@Injectable()
export class NotificationFactory {
  create(type: 'email' | 'sms'): NotificationStrategy {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SmsNotification();
      default:
        throw new Error(`未知通知类型: ${type}`);
    }
  }
}
```

### 策略模式

```typescript
// ✅ 好：策略模式实现灵活算法
interface PricingStrategy {
  calculatePrice(basePrice: number): number;
}

class RegularPricing implements PricingStrategy {
  calculatePrice(basePrice: number): number {
    return basePrice;
  }
}

class DiscountPricing implements PricingStrategy {
  constructor(private discountPercent: number) {}

  calculatePrice(basePrice: number): number {
    return basePrice * (1 - this.discountPercent / 100);
  }
}

class SeasonalPricing implements PricingStrategy {
  calculatePrice(basePrice: number): number {
    const month = new Date().getMonth();
    const isHighSeason = month >= 5 && month <= 8;
    return isHighSeason ? basePrice * 1.2 : basePrice * 0.9;
  }
}

@Injectable()
export class PricingService {
  constructor(private strategy: PricingStrategy) {}

  setStrategy(strategy: PricingStrategy) {
    this.strategy = strategy;
  }

  getPrice(basePrice: number): number {
    return this.strategy.calculatePrice(basePrice);
  }
}
```

### 建造者模式

```typescript
// ✅ 好：使用建造者模式构建复杂对象
class QueryBuilder<T> {
  private query: any = {};

  where(field: keyof T, value: any): this {
    this.query.where = { ...this.query.where, [field]: value };
    return this;
  }

  orderBy(field: keyof T, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.order = { [field]: direction };
    return this;
  }

  limit(count: number): this {
    this.query.take = count;
    return this;
  }

  offset(count: number): this {
    this.query.skip = count;
    return this;
  }

  build() {
    return this.query;
  }
}

// 使用
const query = new QueryBuilder<User>()
  .where('isActive', true)
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .build();
```

---

## 代码复杂度

### 减少圈复杂度

```typescript
// ❌ 坏：高圈复杂度
function getUserStatus(user: User): string {
  if (user.isActive) {
    if (user.isPremium) {
      if (user.hasCompletedProfile) {
        return '活跃高级用户';
      } else {
        return '未完成资料的高级用户';
      }
    } else {
      if (user.hasCompletedProfile) {
        return '活跃普通用户';
      } else {
        return '未完成资料的普通用户';
      }
    }
  } else {
    return '非活跃用户';
  }
}

// ✅ 好：早期返回降低复杂度
function getUserStatus(user: User): string {
  if (!user.isActive) {
    return '非活跃用户';
  }

  const profileStatus = user.hasCompletedProfile ? '已完成资料' : '未完成资料';
  const accountType = user.isPremium ? '高级' : '普通';

  return `${profileStatus}的${accountType}用户`;
}

// ✅ 更好：使用查找表
const USER_STATUS_MAP = {
  'active-premium-complete': '活跃高级用户',
  'active-premium-incomplete': '未完成资料的高级用户',
  'active-regular-complete': '活跃普通用户',
  'active-regular-incomplete': '未完成资料的普通用户',
  'inactive': '非活跃用户',
};

function getUserStatus(user: User): string {
  if (!user.isActive) return USER_STATUS_MAP.inactive;

  const key = `active-${user.isPremium ? 'premium' : 'regular'}-${user.hasCompletedProfile ? 'complete' : 'incomplete'}`;
  return USER_STATUS_MAP[key];
}
```

### 函数长度

```typescript
// ❌ 坏：函数过长
async createOrder(dto: CreateOrderDto): Promise<Order> {
  // 验证用户
  const user = await this.userRepository.findById(dto.userId);
  if (!user) throw new NotFoundException('用户不存在');
  if (!user.isActive) throw new BadRequestException('用户未激活');

  // 验证产品
  const products = await this.productRepository.findByIds(dto.productIds);
  if (products.length !== dto.productIds.length) {
    throw new BadRequestException('部分产品不存在');
  }

  // 计算价格
  let totalPrice = 0;
  for (const product of products) {
    totalPrice += product.price * dto.quantities[product.id];
  }

  // 应用折扣
  if (user.isPremium) totalPrice *= 0.9;
  if (totalPrice > 1000) totalPrice *= 0.95;

  // 创建订单
  const order = this.orderRepository.create({
    userId: user.id,
    totalPrice,
    status: 'pending',
  });

  await this.orderRepository.save(order);

  // 创建订单项
  // ... 更多代码

  // 发送通知
  // ... 更多代码

  return order;
}

// ✅ 好：拆分为小函数
async createOrder(dto: CreateOrderDto): Promise<Order> {
  const user = await this.validateUser(dto.userId);
  const products = await this.validateProducts(dto.productIds);
  const totalPrice = this.calculateTotalPrice(products, dto.quantities, user);

  const order = await this.saveOrder(user.id, totalPrice);
  await this.createOrderItems(order.id, products, dto.quantities);
  await this.sendOrderConfirmation(order, user);

  return order;
}

private async validateUser(userId: string): Promise<User> {
  const user = await this.userRepository.findById(userId);
  if (!user) throw new NotFoundException('用户不存在');
  if (!user.isActive) throw new BadRequestException('用户未激活');
  return user;
}

private async validateProducts(productIds: string[]): Promise<Product[]> {
  const products = await this.productRepository.findByIds(productIds);
  if (products.length !== productIds.length) {
    throw new BadRequestException('部分产品不存在');
  }
  return products;
}

private calculateTotalPrice(
  products: Product[],
  quantities: Record<string, number>,
  user: User,
): number {
  let total = products.reduce(
    (sum, product) => sum + product.price * quantities[product.id],
    0,
  );

  if (user.isPremium) total *= 0.9;
  if (total > 1000) total *= 0.95;

  return total;
}
```

### 避免重复代码（DRY）

```typescript
// ❌ 坏：重复代码
async getUserById(id: string): Promise<User> {
  const user = await this.repository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`用户 ${id} 不存在`);
  }
  return user;
}

async getProductById(id: string): Promise<Product> {
  const product = await this.productRepository.findOne({ where: { id } });
  if (!product) {
    throw new NotFoundException(`产品 ${id} 不存在`);
  }
  return product;
}

// ✅ 好：提取通用逻辑
private async findOrFail<T>(
  repository: Repository<T>,
  id: string,
  entityName: string,
): Promise<T> {
  const entity = await repository.findOne({ where: { id } as any });
  if (!entity) {
    throw new NotFoundException(`${entityName} ${id} 不存在`);
  }
  return entity;
}

async getUserById(id: string): Promise<User> {
  return this.findOrFail(this.userRepository, id, '用户');
}

async getProductById(id: string): Promise<Product> {
  return this.findOrFail(this.productRepository, id, '产品');
}
```

---

## 类型工具

### 实用工具类型

```typescript
// ✅ Partial - 所有属性可选
type UpdateUserDto = Partial<CreateUserDto>;

// ✅ Required - 所有属性必需
type RequiredUser = Required<User>;

// ✅ Pick - 选择特定属性
type UserCredentials = Pick<User, 'email' | 'password'>;

// ✅ Omit - 排除特定属性
type UserWithoutPassword = Omit<User, 'password'>;

// ✅ Record - 创建键值对类型
type UserRoles = Record<string, string[]>;

// ✅ Exclude - 排除联合类型中的某些类型
type NonAdminRole = Exclude<UserRole, 'admin'>;

// ✅ Extract - 提取联合类型中的某些类型
type AdminRole = Extract<UserRole, 'admin' | 'superadmin'>;

// ✅ NonNullable - 排除 null 和 undefined
type DefiniteUser = NonNullable<User | null | undefined>;

// ✅ ReturnType - 提取函数返回类型
type UserServiceReturn = ReturnType<typeof UserService.prototype.getUser>;
```

### 自定义工具类型

```typescript
// ✅ 深度只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

// ✅ 深度部分
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

// ✅ 使所有属性可为 null
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// ✅ 提取 Promise 的类型
type Awaited<T> = T extends Promise<infer U> ? U : T;
```

---

## 代码质量检查清单

### 类型安全
- [ ] 避免使用 `any`，使用 `unknown` 或具体类型
- [ ] 启用 `strictNullChecks`
- [ ] 使用类型守卫而非类型断言
- [ ] 为所有函数添加返回类型
- [ ] 使用泛型提高代码复用性

### 命名
- [ ] 变量和函数使用 camelCase
- [ ] 类和接口使用 PascalCase
- [ ] 常量使用 UPPER_SNAKE_CASE
- [ ] 布尔值使用 is/has/can 前缀
- [ ] 函数名使用动词开头

### 函数
- [ ] 函数保持短小（不超过 50 行）
- [ ] 单一职责
- [ ] 避免副作用
- [ ] 使用早期返回降低嵌套
- [ ] 参数不超过 3 个（使用对象传递多参数）

### 代码组织
- [ ] 相关代码放在一起
- [ ] 避免重复代码（DRY）
- [ ] 使用设计模式提高可维护性
- [ ] 保持低圈复杂度
- [ ] 编写清晰的注释

### 错误处理
- [ ] 使用自定义错误类
- [ ] 正确处理异步错误
- [ ] 避免空 catch 块
- [ ] 提供有意义的错误消息
