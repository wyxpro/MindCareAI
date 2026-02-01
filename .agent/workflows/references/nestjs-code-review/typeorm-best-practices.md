# TypeORM 与 PostgreSQL 最佳实践

本文档提供 TypeORM 与 PostgreSQL 结合使用的全面最佳实践，包括性能优化、查询模式和常见陷阱。

## 目录
- [实体设计](#实体设计)
- [仓储模式](#仓储模式)
- [查询优化](#查询优化)
- [N+1 问题](#n1-问题)
- [关系加载策略](#关系加载策略)
- [事务管理](#事务管理)
- [索引与性能](#索引与性能)
- [迁移管理](#迁移管理)

---

## 实体设计

### 实体定义最佳实践

**使用装饰器正确定义实体**：
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users') // 明确指定表名
export class User {
  @PrimaryGeneratedColumn('uuid') // 推荐使用 UUID
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 主键策略

**UUID vs 自增 ID**：
```typescript
// ✅ 推荐：UUID（分布式友好，无序列竞争）
@PrimaryGeneratedColumn('uuid')
id: string;

// ⚠️ 自增 ID（简单但在分布式系统中有限制）
@PrimaryGeneratedColumn('increment')
id: number;
```

### 列类型选择

**为 PostgreSQL 选择合适的类型**：
```typescript
export class Product {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // 对于货币使用 decimal

  @Column({ type: 'text' })
  description: string; // 长文本使用 text

  @Column({ type: 'jsonb' })
  metadata: object; // PostgreSQL JSONB 类型

  @Column({ type: 'timestamp with time zone' })
  publishedAt: Date; // 带时区的时间戳

  @Column({ type: 'enum', enum: ProductStatus })
  status: ProductStatus; // 枚举类型
}
```

### 关系定义

**正确定义关系**：
```typescript
// 一对多关系
@Entity()
export class User {
  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}

@Entity()
export class Order {
  @ManyToOne(() => User, user => user.orders)
  user: User;
}

// 多对多关系（带中间表）
@Entity()
export class Student {
  @ManyToMany(() => Course, course => course.students)
  @JoinTable({
    name: 'student_courses', // 自定义中间表名
    joinColumn: { name: 'student_id' },
    inverseJoinColumn: { name: 'course_id' }
  })
  courses: Course[];
}
```

**关系选项**：
```typescript
@ManyToOne(() => User, user => user.orders, {
  nullable: false,      // 不允许为空
  onDelete: 'CASCADE',  // 级联删除
  onUpdate: 'CASCADE',  // 级联更新
  eager: false,         // 不要使用 eager（见下文）
})
user: User;
```

---

## 仓储模式

### 使用自定义仓储

**创建自定义仓储**：
```typescript
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.repository.create(dto);
    return this.repository.save(user);
  }
}
```

### 仓储最佳实践

**分离数据访问逻辑**：
```typescript
// ✅ 好：将查询逻辑封装在仓储中
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserOrders(userId: string) {
    return this.userRepository.findUserWithOrders(userId);
  }
}

// ❌ 坏：在服务中直接使用 repository
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getUserOrders(userId: string) {
    return this.userRepo.find({
      where: { id: userId },
      relations: ['orders'], // 查询逻辑泄漏到服务层
    });
  }
}
```

---

## 查询优化

### 使用 QueryBuilder 进行复杂查询

**基本 QueryBuilder**：
```typescript
async findUsersByFilters(filters: UserFilters): Promise<User[]> {
  const query = this.repository.createQueryBuilder('user');

  if (filters.email) {
    query.andWhere('user.email LIKE :email', { email: `%${filters.email}%` });
  }

  if (filters.minAge) {
    query.andWhere('user.age >= :minAge', { minAge: filters.minAge });
  }

  return query
    .orderBy('user.createdAt', 'DESC')
    .limit(filters.limit || 10)
    .offset(filters.offset || 0)
    .getMany();
}
```

### 选择特定字段

**避免选择所有列**：
```typescript
// ✅ 好：只选择需要的字段
async getUserEmails(): Promise<{ email: string }[]> {
  return this.repository
    .createQueryBuilder('user')
    .select(['user.email'])
    .getMany();
}

// 或使用原始结果以获得更好的性能
async getUserEmailsRaw(): Promise<{ email: string }[]> {
  return this.repository
    .createQueryBuilder('user')
    .select('user.email', 'email')
    .getRawMany();
}

// ❌ 坏：获取所有列然后只使用一个
async getUserEmails(): Promise<string[]> {
  const users = await this.repository.find(); // 获取所有字段
  return users.map(u => u.email);
}
```

### 参数化查询（防止 SQL 注入）

**始终使用参数化查询**：
```typescript
// ✅ 好：参数化查询
async findByEmail(email: string): Promise<User> {
  return this.repository
    .createQueryBuilder('user')
    .where('user.email = :email', { email })
    .getOne();
}

// ❌ 危险：字符串拼接（SQL 注入风险）
async findByEmail(email: string): Promise<User> {
  return this.repository
    .createQueryBuilder('user')
    .where(`user.email = '${email}'`) // 不要这样做！
    .getOne();
}
```

---

## N+1 问题

### 什么是 N+1 问题

N+1 问题发生在检索 N 个父记录，然后为每个父记录执行额外查询以获取相关数据时，导致 N+1 次数据库调用。

### 识别 N+1 问题

```typescript
// ❌ 坏：N+1 问题
async getAllUsersWithOrders(): Promise<User[]> {
  const users = await this.userRepository.find(); // 1 次查询

  for (const user of users) {
    user.orders = await this.orderRepository.find({
      where: { userId: user.id } // N 次查询（每个用户一次）
    });
  }

  return users; // 总共 1 + N 次查询
}
```

### 解决方案 1：使用 leftJoinAndSelect

**使用 JOIN 一次获取所有数据**：
```typescript
// ✅ 好：使用 JOIN（1 次查询）
async getAllUsersWithOrders(): Promise<User[]> {
  return this.repository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order')
    .getMany(); // 只有 1 次查询
}
```

### 解决方案 2：使用 relations 选项

```typescript
// ✅ 好：使用 relations
async getAllUsersWithOrders(): Promise<User[]> {
  return this.repository.find({
    relations: ['orders'], // TypeORM 使用 JOIN
  });
}
```

### 解决方案 3：批量查询（适用于复杂场景）

```typescript
// ✅ 好：批量查询
async getAllUsersWithOrders(): Promise<User[]> {
  const users = await this.userRepository.find();
  const userIds = users.map(u => u.id);

  const orders = await this.orderRepository
    .createQueryBuilder('order')
    .where('order.userId IN (:...userIds)', { userIds })
    .getMany(); // 只有 2 次查询

  // 在应用层映射
  users.forEach(user => {
    user.orders = orders.filter(o => o.userId === user.id);
  });

  return users;
}
```

### 嵌套关系的 N+1 问题

```typescript
// ❌ 坏：嵌套 N+1
async getUsersWithOrdersAndProducts() {
  return this.repository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order')
    // 缺少 products 的 join - 会导致 N+1
    .getMany();
}

// ✅ 好：JOIN 所有嵌套关系
async getUsersWithOrdersAndProducts() {
  return this.repository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order')
    .leftJoinAndSelect('order.products', 'product') // 预加载嵌套关系
    .getMany();
}
```

---

## 关系加载策略

### Eager vs Lazy Loading

**避免 Eager Loading**：
```typescript
// ❌ 避免：Eager loading
@Entity()
export class User {
  @OneToMany(() => Order, order => order.user, { eager: true })
  orders: Order[]; // 每次加载 User 时都会自动加载 orders
}

// 问题：
// 1. 无法控制何时加载关系
// 2. 可能导致性能问题
// 3. 可能导致循环依赖
```

**推荐：显式加载**：
```typescript
// ✅ 推荐：显式加载关系
@Entity()
export class User {
  @OneToMany(() => Order, order => order.user)
  orders: Order[]; // 不使用 eager
}

// 在需要时显式加载
async findUserWithOrders(id: string): Promise<User> {
  return this.repository.findOne({
    where: { id },
    relations: ['orders'], // 仅在需要时加载
  });
}
```

### Lazy Loading

**Lazy loading 问题**：
```typescript
// ⚠️ Lazy loading（返回 Promise）
@Entity()
export class User {
  @OneToMany(() => Order, order => order.user)
  orders: Promise<Order[]>; // 注意：Promise 类型
}

// 使用时需要 await
const user = await this.repository.findOne({ where: { id } });
const orders = await user.orders; // 触发新查询

// 问题：容易忘记 await，导致 N+1 问题
```

### 推荐：显式 JOIN

```typescript
// ✅ 最佳实践：在仓储方法中显式控制
@Injectable()
export class UserRepository {
  async findById(id: string): Promise<User> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithOrders(id: string): Promise<User> {
    return this.repository.findOne({
      where: { id },
      relations: ['orders'],
    });
  }

  async findByIdWithOrdersAndProducts(id: string): Promise<User> {
    return this.repository.findOne({
      where: { id },
      relations: ['orders', 'orders.products'],
    });
  }
}
```

---

## 事务管理

### 使用 QueryRunner 进行事务

```typescript
async transferMoney(fromId: string, toId: string, amount: number): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const fromAccount = await queryRunner.manager.findOne(Account, {
      where: { id: fromId },
    });
    const toAccount = await queryRunner.manager.findOne(Account, {
      where: { id: toId },
    });

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await queryRunner.manager.save(fromAccount);
    await queryRunner.manager.save(toAccount);

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

### 使用装饰器进行事务

```typescript
import { Transaction, TransactionRepository } from 'typeorm';

async createOrderWithItems(
  @Transaction() transaction: EntityManager,
  orderData: CreateOrderDto,
): Promise<Order> {
  const order = transaction.create(Order, orderData);
  await transaction.save(order);

  const items = orderData.items.map(item =>
    transaction.create(OrderItem, { ...item, orderId: order.id })
  );
  await transaction.save(items);

  return order;
}
```

### DataSource Transaction Helper

```typescript
// ✅ 推荐：使用 transaction helper
async createUserWithProfile(userData: CreateUserDto): Promise<User> {
  return this.dataSource.transaction(async manager => {
    const user = manager.create(User, userData);
    await manager.save(user);

    const profile = manager.create(Profile, {
      userId: user.id,
      ...userData.profile,
    });
    await manager.save(profile);

    return user;
  });
}
```

---

## 索引与性能

### 创建索引

**单列索引**：
```typescript
@Entity()
export class User {
  @Index() // 自动索引
  @Column()
  email: string;

  @Index('idx_user_phone') // 命名索引
  @Column()
  phone: string;
}
```

**复合索引**：
```typescript
@Entity()
@Index(['firstName', 'lastName']) // 复合索引
@Index(['email', 'status'], { unique: true }) // 唯一复合索引
export class User {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  status: string;
}
```

**部分索引（PostgreSQL）**：
```typescript
@Entity()
@Index('idx_active_users', ['email'], {
  where: 'is_active = true' // 部分索引
})
export class User {
  @Column()
  email: string;

  @Column()
  isActive: boolean;
}
```

### 索引最佳实践

1. **为外键添加索引**：
```typescript
@Entity()
export class Order {
  @ManyToOne(() => User)
  @Index() // 始终为外键添加索引
  user: User;
}
```

2. **为常用查询字段添加索引**：
```typescript
@Entity()
export class Product {
  @Index() // 经常按类别搜索
  @Column()
  category: string;

  @Index() // 经常按状态过滤
  @Column()
  status: string;
}
```

3. **避免过度索引**：
- 索引会降低写入性能
- 只为频繁查询的列添加索引
- 监控查询性能并相应添加索引

### 使用 EXPLAIN 分析查询

```typescript
async analyzeQuery() {
  const result = await this.repository
    .createQueryBuilder('user')
    .where('user.email = :email', { email: 'test@example.com' })
    .explain(); // 返回查询计划

  console.log(result);
}
```

---

## 迁移管理

### 创建迁移

```bash
# 自动生成迁移
npm run typeorm migration:generate -- -n CreateUserTable

# 创建空迁移
npm run typeorm migration:create -- -n AddIndexToUser
```

### 编写迁移

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### 迁移最佳实践

1. **总是编写 down 方法**以允许回滚
2. **使用事务**确保原子性
3. **在生产环境运行前测试迁移**
4. **保持迁移小而专注**
5. **永远不要修改已运行的迁移**

---

## 其他最佳实践

### 使用 DTO 而非实体

```typescript
// ✅ 好：返回 DTO
async getUsers(): Promise<UserResponseDto[]> {
  const users = await this.repository.find();
  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    // 排除敏感字段如 password
  }));
}

// ❌ 坏：直接返回实体（可能暴露敏感数据）
async getUsers(): Promise<User[]> {
  return this.repository.find(); // 包含 password 等字段
}
```

### 分页

```typescript
async getPaginatedUsers(page: number, limit: number) {
  const [users, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });

  return {
    data: users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

### 软删除

```typescript
@Entity()
export class User {
  @DeleteDateColumn()
  deletedAt: Date; // 自动处理软删除
}

// 使用软删除
await this.repository.softDelete(id);

// 恢复软删除
await this.repository.restore(id);

// 查询包括软删除的记录
await this.repository.find({ withDeleted: true });
```

### 批量操作

```typescript
// ✅ 好：批量插入
async createUsers(usersDto: CreateUserDto[]): Promise<User[]> {
  const users = this.repository.create(usersDto);
  return this.repository.save(users); // 单次批量操作
}

// ❌ 坏：循环插入
async createUsers(usersDto: CreateUserDto[]): Promise<User[]> {
  const users = [];
  for (const dto of usersDto) {
    const user = await this.repository.save(dto); // N 次数据库调用
    users.push(user);
  }
  return users;
}
```

### 连接池配置

```typescript
// data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'mydb',
  // 连接池配置
  extra: {
    max: 20,              // 最大连接数
    min: 5,               // 最小连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```
