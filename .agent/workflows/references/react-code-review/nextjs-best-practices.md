# Next.js 最佳实践代码审查指南

## 项目结构(App Router - Next.js 13+)

### 推荐的文件结构
```
app/
  (routes)/           # 路由组
    page.tsx          # 页面组件
    layout.tsx        # 布局组件
    loading.tsx       # 加载 UI
    error.tsx         # 错误 UI
    not-found.tsx     # 404 页面
  api/                # API 路由
    route.ts          # 路由处理器
  _components/        # 私有组件(不会成为路由)
public/               # 静态资源
components/           # 共享组件
lib/                  # 工具函数
types/                # TypeScript 类型定义
```

### 命名约定
- **页面**: `page.tsx`
- **布局**: `layout.tsx`
- **API 路由**: `route.ts`
- **组件**: 大驼峰命名(例如: `UserProfile.tsx`)
- **工具函数**: 小驼峰命名(例如: `formatDate.ts`)

## 路由最佳实践

### App Router vs Pages Router
- **优先使用 App Router**: Next.js 13+ 推荐
- **混合使用**: 可以同时使用 app/ 和 pages/,但避免混淆
- **渐进迁移**: 逐步将 Pages Router 迁移到 App Router

### 布局(Layouts)
- **嵌套布局**: 利用布局嵌套共享 UI
- **根布局**: 必须包含 `<html>` 和 `<body>` 标签
- **布局持久化**: 布局在导航时不会重新渲染

```typescript
// app/layout.tsx - 根布局
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

// app/dashboard/layout.tsx - 嵌套布局
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <nav>导航栏</nav>
      <main>{children}</main>
    </div>
  )
}
```

### 路由组
- **组织路由**: 使用 `(folder)` 不影响 URL 路径
- **布局分组**: 为不同路由组应用不同布局

```
app/
  (marketing)/
    about/page.tsx       # /about
    layout.tsx
  (shop)/
    products/page.tsx    # /products
    layout.tsx
```

### 动态路由
- **动态段**: 使用 `[slug]` 或 `[...slug]`
- **类型安全**: 为 params 定义类型

```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function BlogPost({ params }: PageProps) {
  return <div>文章: {params.slug}</div>
}
```

## 数据获取

### 服务器组件(默认)
- **默认服务器组件**: 所有组件默认都是服务器组件
- **在服务器获取数据**: 直接在组件中使用 async/await
- **减少客户端 JS**: 仅在需要交互时使用客户端组件

```typescript
// 服务器组件 - 直接获取数据
async function BlogPosts() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // ISR - 每小时重新验证
  }).then(res => res.json())

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 客户端组件
- **'use client' 指令**: 标记客户端组件
- **最小化使用**: 仅在需要交互性、hooks 或浏览器 API 时使用
- **叶子节点优化**: 尽可能在组件树的叶子节点使用

```typescript
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 数据缓存和重新验证

#### 缓存策略
- **默认缓存**: fetch 请求默认缓存
- **禁用缓存**: `{ cache: 'no-store' }`
- **重新验证**: `{ next: { revalidate: 秒数 } }`

```typescript
// 静态生成(默认)
const data = await fetch('https://api.example.com/data')

// 禁用缓存(每次请求)
const dynamic = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// ISR - 增量静态再生
const isr = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // 每 60 秒重新验证
})
```

#### 重新验证方法
- **基于时间**: 使用 `revalidate`
- **按需重新验证**: 使用 `revalidatePath` 或 `revalidateTag`

```typescript
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost() {
  // 创建文章后重新验证
  revalidatePath('/blog')
  revalidateTag('posts')
}
```

## 渲染策略

### 静态渲染(SSG)
- **默认行为**: 页面在构建时渲染
- **最佳性能**: CDN 可缓存
- **适用场景**: 博客、文档、营销页面

### 动态渲染(SSR)
- **自动切换**: 使用动态函数时自动切换
- **动态函数**: `cookies()`, `headers()`, `searchParams`
- **适用场景**: 个性化内容、实时数据

```typescript
// 动态渲染 - 使用 cookies
import { cookies } from 'next/headers'

export default async function Profile() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')

  return <div>个人资料</div>
}
```

### 流式渲染(Streaming)
- **Suspense**: 使用 React Suspense 流式传输 UI
- **loading.tsx**: 自动创建 Suspense 边界
- **渐进式加载**: 改善感知性能

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div>
      <h1>仪表盘</h1>
      <Suspense fallback={<Skeleton />}>
        <AsyncData />
      </Suspense>
    </div>
  )
}
```

## 性能优化

### 图片优化
- **Image 组件**: 始终使用 `next/image`
- **自动优化**: 自动格式转换、大小调整、懒加载
- **优先级**: 为首屏图片设置 `priority`

```typescript
import Image from 'next/image'

export function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="英雄图片"
      width={1200}
      height={600}
      priority // 首屏图片
      placeholder="blur" // 模糊占位符
    />
  )
}
```

### 字体优化
- **next/font**: 使用内置字体优化
- **自托管**: 自动自托管字体
- **零布局偏移**: 避免字体加载导致的布局偏移

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 字体显示策略
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### 脚本优化
- **Script 组件**: 使用 `next/script`
- **加载策略**: 控制第三方脚本加载

```typescript
import Script from 'next/script'

export default function App() {
  return (
    <>
      <Script
        src="https://example.com/script.js"
        strategy="lazyOnload" // afterInteractive, beforeInteractive
      />
    </>
  )
}
```

### 代码分割
- **动态导入**: 使用 `next/dynamic`
- **SSR 控制**: 禁用 SSR 以减少包大小

```typescript
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('../components/Heavy'), {
  loading: () => <p>加载中...</p>,
  ssr: false // 禁用服务器渲染
})

export default function Page() {
  return <DynamicComponent />
}
```

### Bundle 分析
- **分析包大小**: 使用 `@next/bundle-analyzer`
- **Tree Shaking**: 确保使用 ES 模块导入
- **动态导入**: 拆分大型依赖

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // 配置
})
```

## Metadata 和 SEO

### 静态 Metadata
- **导出配置**: 使用 `metadata` 导出
- **类型安全**: 完整的 TypeScript 支持

```typescript
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '首页',
  description: '欢迎来到我们的网站',
  openGraph: {
    title: '首页',
    description: '欢迎来到我们的网站',
    images: ['/og-image.jpg'],
  },
}

export default function Page() {
  return <h1>首页</h1>
}
```

### 动态 Metadata
- **generateMetadata**: 基于数据生成 metadata

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

## API 路由和 Server Actions

### 路由处理器(Route Handlers)
- **HTTP 方法**: 导出 GET, POST, PUT, DELETE 等
- **Request/Response**: 使用 Web 标准 API

```typescript
// app/api/posts/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const posts = await getPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  const post = await createPost(body)
  return NextResponse.json(post, { status: 201 })
}
```

### Server Actions
- **'use server'**: 标记服务器操作
- **表单集成**: 直接在表单中使用
- **类型安全**: 完整的端到端类型安全

```typescript
// app/actions.ts
'use server'

export async function createUser(formData: FormData) {
  const name = formData.get('name')
  const email = formData.get('email')

  // 验证和创建用户
  const user = await db.user.create({
    data: { name, email }
  })

  revalidatePath('/users')
  return { success: true, user }
}

// app/page.tsx
import { createUser } from './actions'

export default function Page() {
  return (
    <form action={createUser}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit">创建用户</button>
    </form>
  )
}
```

## 环境变量

### 环境变量约定
- **NEXT_PUBLIC_**: 浏览器可访问的变量
- **服务器专用**: 不带前缀的变量仅在服务器可用

```bash
# .env.local
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com
```

```typescript
// 服务器组件/API 路由
const dbUrl = process.env.DATABASE_URL

// 客户端组件
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## 中间件(Middleware)

### 使用场景
- **认证**: 保护路由
- **重定向**: 基于条件的重定向
- **国际化**: 语言检测和重定向
- **A/B 测试**: 流量分割

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 检查认证
  const token = request.cookies.get('token')

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

## 安全最佳实践

### 内容安全策略(CSP)
- **配置 CSP 头**: 在 next.config.js 中设置
- **Nonce**: 使用 nonce 处理内联脚本

```javascript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
`

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
}
```

### 环境变量安全
- **不要暴露秘密**: 避免在客户端暴露敏感信息
- **验证输入**: 始终在服务器端验证

### CORS 配置
- **API 路由**: 适当配置 CORS 头

```typescript
// app/api/route.ts
export async function GET(request: Request) {
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    },
  })
}
```

## TypeScript 配置

### 推荐配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 测试

### 单元测试
- **Jest + React Testing Library**: 推荐组合
- **模拟**: 模拟 Next.js 特定功能

### E2E 测试
- **Playwright/Cypress**: 端到端测试
- **测试路由**: 测试完整的用户流程

## 部署优化

### 生产构建检查
- **构建分析**: 检查包大小
- **类型检查**: 确保无 TypeScript 错误
- **Lint**: 运行 ESLint
- **测试**: 运行所有测试

```bash
# 构建前检查
npm run type-check
npm run lint
npm run test
npm run build
```

### Vercel 部署(推荐)
- **自动优化**: 边缘网络、图片优化
- **预览部署**: 每个 PR 的预览环境
- **分析**: 内置性能分析

### 自托管
- **Standalone 输出**: 减少部署大小
- **环境变量**: 正确配置生产环境变量

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
}
```

## 常见问题和陷阱

### 避免的做法
- ❌ 在服务器组件中使用 `useState`、`useEffect`
- ❌ 在客户端组件中直接访问数据库
- ❌ 忘记为动态路由设置 `generateStaticParams`
- ❌ 过度使用客户端组件
- ❌ 不适当的缓存策略

### 推荐做法
- ✅ 默认使用服务器组件
- ✅ 在服务器端获取数据
- ✅ 使用适当的缓存和重新验证策略
- ✅ 优化图片、字体和脚本
- ✅ 实现适当的错误处理和加载状态
