# MindCareAI Backend

NestJS 后端服务，用于替代 Supabase Edge Functions。

## 技术栈

- **框架**: NestJS 10.x
- **ORM**: TypeORM 0.3.x
- **数据库**: PostgreSQL (Supabase)
- **认证**: JWT (验证 Supabase tokens)
- **API 文档**: Swagger

## 开发指南

### 安装依赖

```bash
npm install
```

### 环境变量配置

复制 `.env.example` 到 `.env` 并配置以下变量：

```env
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Supabase 配置
SUPABASE_URL=https://backend.appmiaoda.com/projects/supabase274473718779002880
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 数据库连接
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres

# JWT 配置
JWT_SECRET=xxx
SUPABASE_JWT_SECRET=xxx

# AI 服务配置
INTEGRATIONS_API_KEY=xxx

# CORS 配置
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:5173
```

### 启动开发服务器

```bash
npm run start:dev
```

### 构建生产版本

```bash
npm run build
npm run start:prod
```

## API 文档

启动服务后访问 Swagger 文档：

```
http://localhost:3000/api-docs
```

## API 端点

### 认证 (`/api/v1/auth`)

- `POST /login` - 用户登录
- `POST /register` - 用户注册
- `GET /me` - 获取当前用户信息

### 用户 (`/api/v1/users`)

- `GET /me` - 获取当前用户档案
- `PUT /me` - 更新当前用户档案
- `GET :id` - 获取指定用户信息
- `PUT :id` - 更新指定用户信息（管理员）
- `GET` - 获取所有用户列表（管理员/医生）
- `DELETE :id` - 删除用户（管理员）

### AI 服务 (`/api/v1/ai`)

- `POST /text-chat` - 文本对话（流式）
- `POST /multimodal-analysis` - 多模态分析
- `POST /speech-recognition` - 语音识别（multipart 文件上传）
- `POST /rag-retrieval` - RAG 检索
- `POST /multimodal-fusion` - 多模态融合

说明：当 `AI_USE_REAL=true` 时，后端会按 StepFun API 规范调用真实服务：

```text
chat/completions: 文本对话 + 多模态分析
audio/transcriptions: 语音识别
rag-retrieval: 基于 chat/completions 生成回复
```

语音识别请求使用 multipart/form-data，字段：
- `file`：音频文件
- `format`：wav/m4a（可选）
- `language`：zh 等（可选）

### 情绪日记 (`/api/v1/emotion-diaries`)

- `POST /` - 创建情绪日记
- `GET /` - 获取情绪日记列表
- `GET /:id` - 获取单条日记
- `PUT /:id` - 更新日记
- `DELETE /:id` - 删除日记

### 评估记录 (`/api/v1/assessments`)

- `POST /` - 创建评估记录
- `GET /` - 获取评估记录列表
- `GET /:id` - 获取单条记录
- `PUT /:id` - 更新记录

说明：创建评估记录时若无任何输入（文本/图片/语音/视频），将跳过 AI 调用，仅创建空评估记录。

### 健康检查 (`/health`)

- `GET /health` - 服务健康检查

## 认证方式

使用 Supabase JWT token：

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <your_supabase_jwt_token>"
```

说明：JwtModule 已设置为全局模块，确保所有需要认证的模块可注入 JwtService。

### 日志

为便于排查认证问题，登录/注册会在后端日志中输出用户名（不记录密码）。

## 数据库迁移

由于数据库已通过 Supabase 迁移脚本创建，此项目不使用 TypeORM synchronize，所有数据库变更应通过 Supabase 迁移脚本管理。

本地 PostgreSQL 开发环境需先运行 TypeORM migration 创建基础表（tenants/profiles/assessments）：

```bash
npm run migration:run
```

迁移命令使用 `src/config/typeorm.datasource.ts` 作为 DataSource 配置。

## 项目结构

```
backend/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── config/                 # 配置文件
│   │   ├── configuration.ts    # 环境变量配置
│   │   └── typeorm.config.ts   # TypeORM 配置
│   ├── common/                 # 公共模块
│   │   ├── decorators/         # 自定义装饰器
│   │   ├── dto/                # 通用 DTO
│   │   ├── filters/            # 全局异常过滤器
│   │   └── guards/             # 认证守卫
│   ├── modules/                # 业务模块
│   │   ├── auth/               # 认证模块
│   │   ├── users/              # 用户模块
│   │   ├── ai/                 # AI 服务模块
│   │   ├── emotion-diaries/    # 情绪日记模块
│   │   ├── assessments/        # 评估记录模块
│   │   ├── healing/            # 疗愈内容模块
│   │   ├── community/          # 社区模块
│   │   ├── doctor/             # 医生管理模块
│   │   └── health/             # 健康检查模块
│   └── migrations/             # 数据库迁移
├── .env                        # 环境变量
├── .env.example                # 环境变量示例
├── nest-cli.json               # Nest CLI 配置
├── package.json                # 项目依赖
└── tsconfig.json               # TypeScript 配置
```
