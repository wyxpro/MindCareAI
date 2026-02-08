# MindCareAI 魔搭创空间部署指南

## 📋 目录

- [部署准备](#部署准备)
- [部署步骤](#部署步骤)
- [验证部署](#验证部署)
- [故障排查](#故障排查)
- [更新维护](#更新维护)
- [附加说明](#附加说明)

---

## 🚀 部署准备

### 前置要求

1. **Git 仓库**: 项目代码已推送至 Git 仓库 (GitHub/GitLab/Gitee)
2. **魔搭账号**: 已注册魔搭 ModelScope 账号
3. **本地环境**: Node.js 20.x + npm/pnpm

### 技术架构

```
魔搭创空间
├── Docker 容器 (基于 nginx:1.25-alpine)
│   ├── Nginx 服务器 (监听 7860 端口)
│   └── 预构建的前端资源 (dist/)
│
外部服务
├── Supabase 云服务 (认证、数据库、存储)
└── 模搭 AI 网关 (文心一言 AI 功能)
```

### 部署文件说明

| 文件 | 说明 | 必需 |
|------|------|------|
| `ms_deploy.json` | 魔搭创空间部署配置 | ✅ |
| `Dockerfile` | Docker 镜像构建文件 | ✅ |
| `nginx.conf` | Nginx 服务器配置 | ✅ |
| `.dockerignore` | Docker 构建排除文件 | ✅ |
| `dist/` | 预构建的前端资源 | ✅ |

---

## 📝 部署步骤

### 步骤 1: 本地构建前端

在项目根目录执行:

```bash
# 安装依赖 (如果还没有安装)
npm install

# 构建生产版本
npm run build
```

构建完成后,会在项目根目录生成 `dist/` 目录,包含所有前端资源。

**验证构建结果:**

```bash
# Windows
dir dist

# Linux/Mac
ls -lh dist/
```

确认 `dist/` 目录包含:
- `index.html` - 主 HTML 文件
- `assets/` - JS/CSS/字体文件
- `images/` - 静态图片资源

### 步骤 2: 提交到 Git 仓库

**重要**: 需要将 `dist/` 目录提交到仓库 (通常 dist 在 .gitignore 中,需要强制添加):

```bash
# 如果 dist 在 .gitignore 中,需要强制添加
git add -f dist/

# 添加其他部署文件
git add ms_deploy.json Dockerfile nginx.conf .dockerignore

# 提交
git commit -m "feat: 添加魔搭创空间部署配置和预构建资源"

# 推送到远程仓库
git push origin main
```

**注意事项:**
- 确保 `dist/` 目录完整提交
- 如果仓库较大,可以考虑使用 Git LFS
- 推荐使用主分支 (main/master) 进行部署

### 步骤 3: 在魔搭创空间创建应用

1. **登录魔搭平台**
   
   访问: https://modelscope.cn/studios

2. **创建新应用**
   
   点击右上角 "快速创建" 或 "创建 Studio"

3. **配置仓库**
   
   - 选择 "从 Git 仓库导入"
   - 输入仓库地址 (支持 GitHub/GitLab/Gitee)
   - 选择分支 (推荐 main 或 master)
   - 设置仓库访问权限 (公开仓库或配置访问令牌)

4. **检测部署配置**
   
   魔搭会自动检测项目根目录的 `ms_deploy.json` 文件,并显示:
   - SDK 类型: Docker
   - 资源配置: platform/2v-cpu-16g-mem (2核 16G 内存)
   - 端口: 7860
   - 环境变量: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_ID

5. **确认并创建**
   
   检查配置无误后,点击 "创建" 按钮

### 步骤 4: 等待构建部署

**构建过程** (约 3-5 分钟):

1. **拉取代码**: 从 Git 仓库克隆代码
2. **构建镜像**: 根据 Dockerfile 构建 Docker 镜像
   - 使用 nginx:1.25-alpine 基础镜像
   - 复制 dist/ 目录到 Nginx 根目录
   - 配置 Nginx 监听 7860 端口
3. **启动容器**: 运行 Docker 容器
4. **健康检查**: 验证服务可用性

**查看构建日志:**
- 在应用详情页面点击 "构建日志"
- 实时查看构建进度和错误信息

### 步骤 5: 验证部署成功

部署完成后,魔搭会提供访问地址,格式如:

```
https://your-app-name.modelscope.cn
```

---

## ✅ 验证部署

### 基础验证

1. **访问首页**
   
   打开浏览器访问部署地址,应该能看到 MindCareAI 首页

2. **测试路由**
   
   依次访问以下路由,确认 SPA 路由正常工作:
   - `/` - 首页
   - `/record` - 记录页面
   - `/assessment` - AI 评估页面
   - `/healing` - 疗愈页面
   - `/profile` - 个人中心
   - `/login` - 登录页面

3. **检查静态资源**
   
   打开浏览器开发者工具 (F12):
   - Network 标签页: 检查 JS/CSS/图片是否正常加载
   - Console 标签页: 检查是否有错误信息

### 功能验证

1. **用户认证**
   
   - 测试用户登录功能
   - 验证 Supabase 认证连接正常

2. **API 调用**
   
   - 测试情绪日记创建/读取
   - 验证 Supabase 数据库连接正常

3. **AI 功能**
   
   - 测试 AI 评估对话
   - 验证模搭 AI 网关连接正常

4. **文件上传**
   
   - 测试图片上传功能
   - 验证 Supabase Storage 连接正常

### 性能验证

使用浏览器开发者工具的 Lighthouse 进行性能评分:

```bash
# 应该达到以下指标
Performance: > 90
Accessibility: > 90
Best Practices: > 90
SEO: > 80
```

---

## 🔧 故障排查

### 构建失败

**问题 1: 找不到 dist 目录**

```
Error: COPY failed: file not found in build context
```

**解决方案:**
- 确认本地已执行 `npm run build`
- 确认 `dist/` 目录已提交到 Git 仓库
- 执行 `git add -f dist/` 强制添加

**问题 2: Nginx 配置错误**

```
Error: nginx: [emerg] invalid parameter
```

**解决方案:**
- 检查 `nginx.conf` 语法
- 在本地使用 Docker 测试: `docker build -t test .`

### 运行失败

**问题 1: 端口未暴露**

```
Error: No service running on port 7860
```

**解决方案:**
- 确认 `ms_deploy.json` 中 `port` 为 7860
- 确认 `nginx.conf` 中监听端口为 7860
- 确认 `Dockerfile` 中 `EXPOSE 7860`

**问题 2: 健康检查失败**

```
Error: Health check failed
```

**解决方案:**
- 检查 Nginx 是否正常启动: 查看容器日志
- 访问 `/health` 端点测试: `curl http://localhost:7860/health`

### 功能异常

**问题 1: 路由 404 错误**

访问子路由 (如 `/record`) 返回 404

**解决方案:**
- 检查 `nginx.conf` 中的 `try_files` 配置
- 确认 SPA 路由重写规则正确

**问题 2: API 调用跨域错误**

```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**解决方案:**
- 检查 `nginx.conf` 中的 CORS 配置
- 确认允许的域名包含 Supabase 和 AI 网关地址

**问题 3: 静态资源加载失败**

JS/CSS/图片无法加载

**解决方案:**
- 检查 `dist/` 目录结构是否完整
- 检查 Nginx 静态文件服务配置
- 确认文件权限: `chmod -R 755 dist/`

### 环境变量问题

**问题: 环境变量未生效**

**解决方案:**
- Vite 环境变量在**构建时**注入,运行时无法修改
- 如需修改环境变量,需要:
  1. 修改 `.env` 文件
  2. 重新构建: `npm run build`
  3. 提交并推送: `git add dist/ && git commit && git push`
  4. 魔搭会自动触发重新部署

---

## 🔄 更新维护

### 日常更新流程

当代码有更新时:

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
npm run build

# 3. 提交更新
git add dist/
git commit -m "chore: 更新构建产物"
git push

# 4. 魔搭自动重新部署 (约 3-5 分钟)
```

### 配置文件更新

如果修改了部署配置:

```bash
# 提交配置文件
git add ms_deploy.json Dockerfile nginx.conf
git commit -m "chore: 更新部署配置"
git push

# 魔搭会自动检测并重新构建
```

### 回滚到旧版本

如果新版本有问题:

```bash
# 1. 回滚到上一个提交
git revert HEAD

# 2. 推送回滚
git push

# 或者重置到指定版本
git reset --hard <commit-hash>
git push -f origin main
```

### 监控和日志

**查看应用日志:**
1. 登录魔搭平台
2. 进入应用详情页
3. 点击 "日志" 标签
4. 查看实时日志输出

**关键日志位置:**
- Nginx 访问日志: `/var/log/nginx/access.log`
- Nginx 错误日志: `/var/log/nginx/error.log`

---

## 📌 附加说明

### 资源配置

当前使用免费配置:
- **实例类型**: platform/2v-cpu-16g-mem
- **CPU**: 2 核
- **内存**: 16GB
- **存储**: 根据 dist 目录大小,约 10-20MB
- **带宽**: 魔搭提供的默认带宽

**升级资源:**

如需更高性能,可在 `ms_deploy.json` 中修改:

```json
{
  "resource_configuration": "xgpu/8v-cpu-32g-mem-16g"
}
```

注意: xGPU 实例需要申请权限和付费

### 安全配置

1. **API 密钥保护**
   
   - `VITE_SUPABASE_ANON_KEY` 是公开的匿名密钥,仅用于前端
   - 敏感操作通过 Supabase RLS 策略保护
   - `INTEGRATIONS_API_KEY` 仅在 Supabase Edge Functions 中使用,不暴露给前端

2. **HTTPS**
   
   魔搭默认为所有应用提供 HTTPS 证书,自动启用

3. **CORS 策略**
   
   Nginx 配置中已添加 CORS 头,允许:
   - Supabase 云服务调用
   - 模搭 AI 网关调用
   - 浏览器跨域请求

### 性能优化

1. **Gzip 压缩**
   
   Nginx 已启用 Gzip 压缩,可减小 70% 传输体积

2. **静态资源缓存**
   
   - JS/CSS/图片: 缓存 1 年
   - HTML: 不缓存,始终获取最新版本

3. **CDN 加速**
   
   魔搭会自动使用 CDN 分发静态资源

### 成本估算

- **免费额度**: 魔搭提供免费的 2核16G 实例
- **流量费用**: 根据实际使用情况计费
- **存储费用**: dist 目录约 10-20MB,几乎免费

### 限制说明

1. **构建时间**: 单次构建不超过 30 分钟
2. **镜像大小**: 推荐不超过 10GB
3. **端口限制**: 必须使用 7860 端口
4. **网络限制**: 需要能访问外部 Supabase 和 AI 服务

### 技术支持

如遇到问题:

1. **魔搭文档**: https://modelscope.cn/docs/studios/quick-create
2. **项目 Issues**: 在 Git 仓库提交 Issue
3. **社区支持**: 魔搭社区论坛

---

## 🎉 部署完成

恭喜! 您已成功将 MindCareAI 部署到魔搭创空间。

**下一步:**

1. 分享应用链接给用户
2. 监控应用运行状态
3. 根据用户反馈持续优化
4. 定期更新和维护

**重要提醒:**

- 定期检查日志,及时发现问题
- 关注魔搭平台公告,了解服务更新
- 备份重要数据,防止意外丢失
- 优化性能,提升用户体验

---

*最后更新: 2026-02-08*
*维护者: MindCareAI Team*
