---
name: nestjs-code-reviewer
description: NestJS + TypeScript + TypeORM + PostgreSQL 后端代码审查与架构设计技能。包含完整的最佳实践知识库,用于对 NestJS 后端代码进行全面的代码审查和架构设计指导,涵盖架构设计、安全性、性能优化、代码质量等方面。当用户主动要求对 NestJS 后端代码进行审查、代码质量检查、最佳实践验证,或需要进行架构设计、代码架构规划、系统设计时触发此技能。支持单文件、多文件、目录或整个项目的审查和架构设计。
---

# NestJS 代码审查

## 概述

此技能为 NestJS + TypeScript + TypeORM + PostgreSQL 技术栈提供专业的代码审查服务。基于最新的最佳实践、OWASP 安全指南和性能优化策略，生成详细的审查报告，包括问题说明、代码示例、修复建议和最佳实践引用。

## 何时使用此技能

- 用户明确要求对 NestJS 后端代码进行审查
- 用户要求检查代码质量、安全性或性能问题
- 用户询问代码是否符合最佳实践
- 用户请求代码重构建议
- 用户需要进行 NestJS 项目架构设计或规划
- 用户询问如何设计模块结构、数据库架构或系统架构
- 用户需要基于最佳实践的架构设计建议和指导

## 架构设计时的 .gitignore 配置

当进行项目架构设计时，应为用户生成符合 NestJS 技术栈的 .gitignore 文件：

```gitignore
node_modules/
dist/
.env
.env.*
*.log
logs/
coverage/
.idea/
.vscode/
*.swp
.DS_Store
```

## 代码审查工作流程

### 步骤 1：确定审查范围

首先明确用户希望审查的内容：

1. **询问审查目标**：
   - 询问用户想审查哪些文件或目录
   - 确认是否有特定关注点（安全性、性能、架构等）
   - 了解是否需要审查特定的 NestJS 模块（Guards、Interceptors、Pipes 等）

2. **读取代码**：
   - 使用 Read 或 Glob 工具读取指定的代码文件
   - 如果是整个项目，先了解项目结构
   - 识别关键文件：controllers、services、entities、DTOs、modules

### 步骤 2：加载相关参考文档

根据审查重点，按需加载参考文档：

- **架构和设计模式**：读取 `references/nestjs-code-review/nestjs-best-practices.md`
- **数据库和 TypeORM**：读取 `references/nestjs-code-review/typeorm-best-practices.md`
- **安全性检查**：读取 `references/nestjs-code-review/security-checklist.md`
- **性能优化**：读取 `references/nestjs-code-review/performance-optimization.md`
- **TypeScript 代码质量**：读取 `references/nestjs-code-review/typescript-patterns.md`
- **Swagger API 文档**：读取 `references/nestjs-code-review/swagger-api-documentation.md`

**重要提示**：不要一次性加载所有参考文档。只加载与当前审查重点相关的文档以节省 context。

### 步骤 3：执行代码审查

按照以下维度系统地审查代码：

#### 3.1 代码编译和 Lint 检查

在开始详细审查之前,首先执行编译和 lint 检查：

检查项：
- [ ] 运行 `npm run build` 或 `yarn build` 检查编译是否通过
- [ ] 是否有 TypeScript 类型错误？
- [ ] 是否有未使用的导入或变量？
- [ ] 运行 `npm run lint` 或 `yarn lint` 检查代码规范
- [ ] 是否有 ESLint 错误或警告？
- [ ] 代码格式是否符合 Prettier 配置？

**检查流程**：
1. 在项目根目录运行构建命令
2. 记录所有编译错误和警告
3. 运行 lint 命令
4. 记录所有 lint 问题
5. 在审查报告中优先列出这些问题

#### 3.2 架构和设计模式

检查项：
- [ ] 模块是否遵循单一职责原则
- [ ] 依赖注入是否正确使用
- [ ] SOLID 原则的遵循情况
- [ ] 项目结构是否清晰合理
- [ ] 是否正确使用 Guards、Interceptors、Pipes、Filters
- [ ] 代码是否存在循环依赖

参考：`references/nestjs-code-review/nestjs-best-practices.md`

#### 3.3 TypeORM 配置和 Migration 管理

**关键要求：必须完全关闭 synchronize，所有数据库修改使用 migration**

检查项：
- [ ] **synchronize 是否完全关闭？** (在所有环境包括开发环境都必须是 `synchronize: false`)
- [ ] 是否配置了 migrations 路径？
- [ ] 是否有完整的 migration 文件？
- [ ] 新增或修改实体后是否创建了对应的 migration？
- [ ] migration 文件是否包含 up 和 down 方法？
- [ ] migration 文件命名是否规范（时间戳 + 描述）？
- [ ] 是否在 package.json 中配置了 migration 相关脚本？
  - `migration:generate` - 生成 migration
  - `migration:run` - 运行 migration
  - `migration:revert` - 回滚 migration
- [ ] 生产环境部署流程是否包含运行 migration？
- [ ] 是否避免手动修改数据库结构？

**TypeORM 配置审查**：
```typescript
// ❌ 错误示例 - 不允许使用 synchronize
TypeOrmModule.forRoot({
  synchronize: true,  // 严重错误！必须是 false
  // ...
})

// ✅ 正确示例
TypeOrmModule.forRoot({
  synchronize: false,  // 必须关闭
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,  // 建议手动运行
  // ...
})
```

**Migration 工作流检查**：
1. 修改实体后是否运行 `npm run migration:generate -- -n DescriptiveName`？
2. 生成的 migration 是否经过审查？
3. 是否在开发环境测试 migration？
4. 是否测试了 migration 的回滚（revert）？
5. 部署前是否备份数据库？

参考：`references/nestjs-code-review/typeorm-best-practices.md`

#### 3.4 安全性

检查项：
- [ ] JWT 认证是否正确实现
- [ ] 是否存在 SQL 注入风险（检查原始查询）
- [ ] 输入验证是否完整（DTOs with class-validator）
- [ ] 密码是否正确哈希（bcrypt/argon2）
- [ ] 敏感数据是否从响应中排除
- [ ] 是否实施了速率限制
- [ ] CORS 配置是否安全
- [ ] 是否使用了安全头部（helmet）
- [ ] 错误消息是否泄露敏感信息
- [ ] 文件上传是否验证

参考：`references/nestjs-code-review/security-checklist.md`

#### 3.5 性能优化

检查项：
- [ ] 是否存在 N+1 查询问题
- [ ] 查询是否选择了不必要的字段
- [ ] 是否缺少必要的数据库索引
- [ ] 是否使用了批量操作而非循环操作
- [ ] 是否实施了适当的缓存策略
- [ ] 大列表是否分页
- [ ] 是否使用了连接池优化
- [ ] 耗时操作是否异步处理（队列）

参考：`references/nestjs-code-review/performance-optimization.md`

#### 3.6 TypeORM 最佳实践

检查项：
- [ ] 实体定义是否正确
- [ ] 关系是否正确配置（避免 eager loading）
- [ ] 是否使用参数化查询
- [ ] 是否使用仓储模式
- [ ] 迁移管理是否规范
- [ ] 事务处理是否正确
- [ ] 是否使用了软删除（如需要）

参考：`references/nestjs-code-review/typeorm-best-practices.md`

#### 3.7 Swagger API 文档

**核心原则：文档即代码（Docs as Code）**

API 文档通过 `@nestjs/swagger` 装饰器自动生成，必须保证完整性和准确性。

检查项：
- [ ] 是否安装并配置了 `@nestjs/swagger`
- [ ] main.ts 中是否正确配置了 Swagger 文档路径
- [ ] 所有 Controller 是否添加了 `@ApiTags()` 装饰器
- [ ] 所有公开接口是否添加了 `@ApiOperation()` 装饰器
- [ ] 所有接口是否添加了完整的 `@ApiResponse()` 装饰器（成功和失败响应）
- [ ] 所有 DTO 字段是否添加了 `@ApiProperty()` 装饰器
- [ ] `@ApiProperty()` 是否包含 `description` 和 `example`
- [ ] 路径参数是否使用 `@ApiParam()` 装饰器
- [ ] 查询参数是否使用 `@ApiQuery()` 装饰器
- [ ] 需要认证的接口是否添加了 `@ApiBearerAuth()` 装饰器
- [ ] 接口描述是否清晰准确，是否提供了合理的示例值
- [ ] 是否避免暴露敏感信息（密码、内部错误详情等）

参考：`references/nestjs-code-review/swagger-api-documentation.md`

#### 3.8 TypeScript 代码质量

检查项：
- [ ] 是否避免使用 `any`
- [ ] 类型定义是否完整
- [ ] 命名是否符合规范
- [ ] 函数是否过长（超过 50 行）
- [ ] 圈复杂度是否过高
- [ ] 是否存在重复代码
- [ ] 错误处理是否完善
- [ ] 注释是否清晰（JSDoc）

参考：`references/nestjs-code-review/typescript-patterns.md`

#### 3.9 .gitignore 配置检查

检查项：
- [ ] 是否存在 .gitignore 文件
- [ ] 是否包含 `node_modules/`
- [ ] 是否包含 `dist/` 或 `build/`
- [ ] 是否包含 `.env` 及其变体（`.env.local`, `.env.*.local`）
- [ ] 是否包含 IDE 配置（`.idea/`, `.vscode/`）
- [ ] 是否包含日志文件（`*.log`, `logs/`）
- [ ] 是否包含测试覆盖率目录（`coverage/`）

**NestJS 项目推荐 .gitignore**：
```gitignore
node_modules/
dist/
.env
.env.*
*.log
logs/
coverage/
.idea/
.vscode/
*.swp
.DS_Store
```

**如果修改了 .gitignore**，需清理 git 缓存：
```bash
git rm -r --cached .
git add .
git commit -m "chore: update .gitignore"
```

### 步骤 4：生成审查报告

生成详细的审查报告，格式如下：

```markdown
# NestJS 代码审查报告

## 执行摘要

- **审查范围**：[文件/目录列表]
- **审查时间**：[时间戳]
- **总体评分**：[优秀/良好/需要改进]
- **关键发现**：[简要总结主要问题]

## 发现问题汇总

### 严重性分级

- 🔴 **严重**：X 个（必须立即修复）
- 🟡 **警告**：Y 个（建议尽快修复）
- 🔵 **建议**：Z 个（优化建议）

---

## 详细审查结果

### 1. 架构和设计模式

#### [问题名称] - [严重性]

**位置**：`文件路径:行号`

**问题描述**：
[清晰描述发现的问题]

**当前代码**：
```typescript
// 问题代码
```

**问题分析**：
[解释为什么这是一个问题，可能的影响]

**修复建议**：
```typescript
// 推荐的修复代码
```

**最佳实践参考**：
[引用相关最佳实践文档的具体章节]

---

### 2. 安全性

[同样格式列出安全问题]

---

### 3. 性能优化

[同样格式列出性能问题]

---

### 4. TypeORM 使用

[同样格式列出 TypeORM 相关问题]

---

### 5. TypeScript 代码质量

[同样格式列出代码质量问题]

---

## 优先级修复建议

### 立即修复（严重问题）
1. [问题1]
2. [问题2]

### 短期修复（警告问题）
1. [问题1]
2. [问题2]

### 长期优化（建议）
1. [建议1]
2. [建议2]

---

## 正面反馈

[列出代码中做得好的地方，给予正面肯定]

---

## 总结与建议

[总体评价和下一步行动建议]
```

### 步骤 5：回答用户问题

审查完成后：

1. **提供清晰的报告**：将生成的审查报告提供给用户
2. **回答疑问**：解答用户对报告中任何问题的疑问
3. **提供具体指导**：如果用户需要，提供修复某个问题的详细步骤
4. **仅提供建议**：不主动修改代码，除非用户明确要求

## 审查重点指南

### 针对不同文件类型的审查重点

#### Controllers (`*.controller.ts`)
- ✅ 是否正确使用装饰器（`@Get`, `@Post`, `@UseGuards` 等）
- ✅ 是否使用了验证管道（`ValidationPipe`）
- ✅ 是否有适当的错误处理
- ✅ 控制器是否保持精简（业务逻辑在 Service 中）
- ✅ 是否使用了 DTO 进行输入验证
- ✅ 路由是否合理设计

#### Services (`*.service.ts`)
- ✅ 是否正确使用依赖注入
- ✅ 业务逻辑是否清晰
- ✅ 是否有适当的错误处理
- ✅ 是否使用仓储模式访问数据
- ✅ 函数是否过长或过于复杂
- ✅ 是否存在重复代码

#### Entities (`*.entity.ts`)
- ✅ 字段类型是否正确（特别是 decimal, jsonb 等）
- ✅ 关系是否正确定义（避免 eager loading）
- ✅ 是否有适当的索引
- ✅ 是否使用了 `@CreateDateColumn` 和 `@UpdateDateColumn`
- ✅ 外键关系是否正确设置

#### DTOs (`*.dto.ts`)
- ✅ 是否使用了 `class-validator` 装饰器
- ✅ 验证规则是否完整
- ✅ 是否区分了 Create 和 Update DTO
- ✅ 是否使用了 `PartialType`, `PickType`, `OmitType`

#### Modules (`*.module.ts`)
- ✅ imports 是否正确
- ✅ providers 是否完整
- ✅ exports 是否合理
- ✅ 是否存在循环依赖

#### Guards (`*.guard.ts`)
- ✅ 认证逻辑是否安全
- ✅ 是否正确使用 Reflector
- ✅ 错误处理是否完善

#### Interceptors (`*.interceptor.ts`)
- ✅ 是否正确实现 NestInterceptor 接口
- ✅ 逻辑是否合理
- ✅ 是否处理了错误情况

### 常见问题模式识别

在审查过程中，特别注意以下常见问题：

1. **N+1 查询问题**：
   - 循环中的数据库查询
   - 缺少 `leftJoinAndSelect` 或 `relations`

2. **SQL 注入风险**：
   - 字符串拼接的查询
   - 未参数化的原始查询

3. **密码未哈希**：
   - 直接保存密码字段
   - 使用简单的哈希算法

4. **敏感数据泄露**：
   - 返回包含密码的用户对象
   - 错误消息中包含敏感信息

5. **缺少输入验证**：
   - DTO 没有验证装饰器
   - 未使用 ValidationPipe

6. **过度使用 `any`**：
   - 类型定义为 `any`
   - 缺少类型注解

7. **循环依赖**：
   - 模块之间的相互导入
   - 服务之间的循环依赖

8. **内存泄漏风险**：
   - 未清理的事件监听器
   - 一次性加载大量数据

9. **synchronize 开启**：
   - TypeORM 配置中 synchronize: true
   - 缺少 migration 文件
   - 数据库结构手动修改

## 示例使用场景

### 场景 1：审查单个服务文件

**用户**："请审查这个 UserService 文件的代码质量"

**操作步骤**：
1. 运行 `npm run build` 检查编译
2. 运行 `npm run lint` 检查代码规范
3. 读取 `user.service.ts` 文件
4. 加载 `nestjs-best-practices.md` 和 `typescript-patterns.md`
5. 检查依赖注入、业务逻辑、错误处理、类型安全
6. 生成针对性报告，包含编译和 lint 结果

### 场景 2：安全性审查

**用户**："帮我检查 auth 模块的安全性"

**操作步骤**：
1. 运行编译和 lint 命令
2. 读取 auth 相关文件（controller, service, guard, strategy）
3. 加载 `security-checklist.md`
4. 重点检查 JWT 实现、密码哈希、输入验证、速率限制
5. 生成安全性审查报告

### 场景 3：性能优化审查

**用户**："这个项目的查询性能不好，帮我找出问题"

**操作步骤**：
1. 运行编译命令检查基础错误
2. 读取 repository/service 文件
3. 加载 `performance-optimization.md` 和 `typeorm-best-practices.md`
4. 重点检查 N+1 问题、索引、批量操作、缓存
5. 生成性能优化建议报告

### 场景 4：全面代码审查

**用户**："对整个 users 模块进行全面代码审查"

**操作步骤**：
1. 运行 `npm run build` 和 `npm run lint` 检查项目整体质量
2. 检查 TypeORM 配置，确认 synchronize 已关闭
3. 检查是否有完整的 migration 文件
4. 读取 users 目录下所有文件
5. 按需加载所有参考文档
6. 从架构、安全、性能、代码质量等全方位审查
7. 生成完整审查报告，包含编译、lint、TypeORM 配置问题

## 注意事项

1. **不要一次性加载所有参考文档**：根据审查重点选择性加载，避免 context 溢出

2. **提供具体代码位置**：使用 `文件路径:行号` 格式标注问题位置

3. **给出可执行的建议**：不仅指出问题，还要提供具体的修复代码示例

4. **平衡严格性和实用性**：区分"必须修复"和"建议优化"

5. **正面反馈同样重要**：指出代码做得好的地方

6. **尊重用户选择**：仅提供建议，不主动修改代码

7. **保持专业和建设性**：以帮助提升代码质量为目标

## 参考资源

此技能包含以下参考文档，按需加载使用：

- `references/nestjs-code-review/nestjs-best-practices.md` - NestJS 架构和设计模式最佳实践
- `references/nestjs-code-review/typeorm-best-practices.md` - TypeORM 与 PostgreSQL 使用最佳实践
- `references/nestjs-code-review/security-checklist.md` - 基于 OWASP 的安全检查清单
- `references/nestjs-code-review/performance-optimization.md` - 性能优化指南
- `references/nestjs-code-review/typescript-patterns.md` - TypeScript 代码质量与模式
