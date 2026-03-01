# 🧠 灵愈AI - 智能心理检测与疗愈助手

<div align="center">

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.76.1-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.11-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat)](LICENSE)

**🌟 基于多模态AI的心理健康检测与疗愈平台**

[在线体验](https://www.miaoda.cn/projects/app-97zabxvzebcx) • [功能演示](#-核心功能模块) • [快速开始](#-快速开始) • [API文档](#-api-接口) • [部署指南](#-部署指南)

</div>

---

## 📋 项目简介

灵愈AI是一款专业的抑郁检测与疗愈助手，集成**情绪记录**、**多模态AI评估**、**冥想疗愈**、**社区互助**、**医生后台**于一体。采用现代化医疗主题设计，结合百度文心一言多模态大模型，为用户提供科学、专业、温暖的心理健康服务。

### ✨ 核心亮点
<img width="1388" height="1479" alt="image" src="https://github.com/user-attachments/assets/4b6fc4ed-8ec7-45a0-a6fb-cdfa48fda079" />
<img width="1374" height="1496" alt="image" src="https://github.com/user-attachments/assets/d1f35aca-aa46-477f-af90-6ec13de9d366" />


- 🤖 **多模态AI评估** - 集成文本、语音、微表情识别的综合心理状态分析
- 📋 **AI量表对话** - PHQ-9、HAMD-17等专业量表的智能对话式评估
- 🧘 **沉浸式冥想** - 3D呼吸动画、专业音频、统计追踪
- 👥 **匿名树洞社区** - 隐私保护的情感支持和康复经验分享
- 📝 **情绪日记** - 支持文本、语音、图片多模态记录，智能日历管理
- 📚 **知识库系统** - 支持文档上传、RAG检索的专业心理健康知识库
- 👨‍⚕️ **医生后台** - 患者管理、风险预警、知识库管理系统
- 📊 **数据可视化** - 情绪趋势、健康评分、康复进度展示
- 🔒 **隐私安全** - 符合医疗数据安全规范
---

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 用途 | 特性 |
|------|------|------|------|
| **React** | 18.3.1 | 现代化UI框架 | Hooks、Concurrent Features |
| **TypeScript** | 5.9.3 | 类型安全开发 | 严格类型检查、智能提示 |
| **Vite** | 5.4.21 | 高性能构建工具 | HMR、ESM、插件生态 |
| **Tailwind CSS** | 3.4.11 | 原子化CSS框架 | JIT编译、响应式设计 |
| **Radix UI** | latest | 无障碍组件库 | WAI-ARIA、键盘导航 |
| **Lucide React** | 0.553.0 | 现代图标库 | 1000+图标、可定制 |
| **React Router** | 6.28.0 | 客户端路由 | 嵌套路由、懒加载 |
| **React Hook Form** | 7.66.0 | 高性能表单库 | 最小重渲染、验证 |
| **Framer Motion** | 12.23.25 | 流畅动画效果 | 手势、布局动画 |
| **date-fns** | 3.6.0 | 日期处理库 | 轻量级、函数式 |

### 后端服务
| 服务 | 版本 | 用途 | 特性 |
|------|------|------|------|
| **Supabase** | 2.76.1 | 后端即服务(BaaS) | 实时数据库、认证、存储 |
| **PostgreSQL** | 15+ | 关系型数据库 | ACID事务、JSON支持 |
| **Edge Functions** | latest | 无服务器函数 | Deno运行时、全球部署 |
| **Supabase Auth** | latest | 用户认证系统 | JWT、OAuth、MFA |
| **Supabase Storage** | latest | 文件存储服务 | CDN、图片处理 |
| **Row Level Security** | latest | 数据安全 | 细粒度权限控制 |

### AI集成
| 服务 | 用途 | 特性 |
|------|------|------|
| **火山引擎豆包大模型** | 文本对话、情绪分析 | 中文优化、上下文理解 |
| **魔搭多模态大模型** | 图片情绪识别、视频分析 | 表情识别、场景理解 |
| **硅基流动语音识别** | 语音转文字 | 实时识别、高准确率 |
| **RAG检索增强** | 知识库问答 | 文档解析、语义匹配 |



---

## 📁 目录结构

```
MindCareAI/
├── 📄 README.md                    # 项目说明文档
├── 📄 package.json                 # 项目依赖配置
├── 📄 vite.config.ts              # Vite构建配置
├── 📄 tailwind.config.js          # Tailwind样式配置
├── 📄 tsconfig.json               # TypeScript配置
├── 📄 components.json             # Radix UI组件配置
├── 📄 biome.json                  # 代码检查配置
├── 📄 .env                        # 环境变量配置
├── 📁 public/                     # 静态资源目录
│   ├── 🖼️ favicon.png             # 应用图标
│   ├── 📁 images/                 # 图片资源
│   └── 📄 manifest.json           # PWA配置
├── 📁 src/                        # 源代码目录
│   ├── 📄 App.tsx                 # 应用根组件
│   ├── 📄 main.tsx                # 应用入口文件
│   ├── 📄 routes.tsx              # 路由配置
│   ├── 📄 index.css               # 全局样式
│   ├── 📁 components/             # 组件库
│   │   ├── 📁 ui/                 # 基础UI组件(Radix UI)
│   │   │   ├── 📄 button.tsx      # 按钮组件
│   │   │   ├── 📄 card.tsx        # 卡片组件
│   │   │   ├── 📄 dialog.tsx      # 对话框组件
│   │   │   └── 📄 ...             # 其他UI组件
│   │   ├── 📁 common/             # 通用组件
│   │   │   ├── 📄 Header.tsx      # 页面头部
│   │   │   ├── 📄 Footer.tsx      # 页面底部
│   │   │   └── 📄 Loading.tsx     # 加载组件
│   │   ├── 📁 layouts/            # 布局组件
│   │   │   ├── 📄 MainLayout.tsx  # 主布局
│   │   │   └── 📄 AuthLayout.tsx  # 认证布局
│   │   ├── 📁 record/             # 记录相关组件
│   │   │   ├── 📄 EmotionPicker.tsx # 情绪选择器
│   │   │   ├── 📄 VoiceRecorder.tsx # 语音录制
│   │   │   └── 📄 ImageUploader.tsx # 图片上传
│   │   ├── 📁 assessment/         # 评估相关组件
│   │   │   ├── 📄 ChatInterface.tsx # 对话界面
│   │   │   ├── 📄 MultimodalInput.tsx # 多模态输入
│   │   │   └── 📄 AssessmentReport.tsx # 评估报告
│   │   ├── 📁 healing/            # 疗愈相关组件
│   │   │   ├── 📄 MeditationPlayer.tsx # 冥想播放器
│   │   │   ├── 📄 KnowledgeTab.tsx # 知识页签
│   │   │   └── 📄 CommunityTab.tsx # 社区页签
│   │   ├── 📁 profile/            # 个人页面组件
│   │   │   ├── 📄 ProfileCard.tsx # 个人信息卡
│   │   │   └── 📄 HealthScore.tsx # 健康评分
│   │   └── 📁 home/               # 首页组件
│   │       ├── 📄 WelcomeCard.tsx # 欢迎卡片
│   │       └── 📄 QuickActions.tsx # 快捷操作
│   ├── 📁 pages/                  # 页面组件
│   │   ├── 📄 HomePage.tsx        # 首页
│   │   ├── 📄 RecordPageNew.tsx   # 记录页面
│   │   ├── 📄 EnhancedAssessmentPage.tsx # 评估页面
│   │   ├── 📄 HealingPageNew.tsx  # 疗愈页面
│   │   ├── 📄 ProfilePageRedesigned.tsx # 个人页面
│   │   ├── 📄 LoginPage.tsx       # 登录页面
│   │   └── 📁 doctor/             # 医生端页面
│   │       ├── 📄 DashboardPage.tsx # 数据看板
│   │       ├── 📄 PatientsPage.tsx # 患者管理
│   │       ├── 📄 KnowledgePage.tsx # 知识库
│   │       └── 📄 AlertsPage.tsx  # 预警消息
│   ├── 📁 contexts/               # React Context
│   │   └── 📄 AuthContext.tsx     # 认证上下文
│   ├── 📁 hooks/                  # 自定义Hooks
│   │   ├── 📄 use-auth.ts         # 认证Hook
│   │   ├── 📄 use-debounce.ts     # 防抖Hook
│   │   ├── 📄 use-mobile.ts       # 移动端检测
│   │   └── 📄 use-toast.tsx       # 消息提示Hook
│   ├── 📁 db/                     # 数据库相关
│   │   ├── 📄 supabase.ts         # Supabase客户端
│   │   └── 📄 api.ts              # API封装函数
│   ├── 📁 types/                  # TypeScript类型定义
│   │   ├── 📄 index.ts            # 类型导出
│   │   └── 📄 types.ts            # 核心类型定义
│   ├── 📁 lib/                    # 工具库
│   │   └── 📄 utils.ts            # 通用工具函数
│   ├── 📁 utils/                  # 专用工具函数
│   │   ├── 📄 audio.ts            # 音频处理
│   │   └── 📄 sse.ts              # 服务端推送
│   └── 📁 services/               # 业务服务
│       └── 📄 .keep               # 占位文件
├── 📁 api/                        # API代理服务
│   ├── 📁 volc/                   # 火山引擎API代理
│   │   └── 📄 responses.ts        # 豆包大模型代理
│   ├── 📁 siliconflow/            # 硅基流动API代理
│   │   └── 📁 audio/              # 语音识别代理
│   └── 📁 modelscope/             # 魔搭API代理
│       └── 📁 chat/               # 聊天补全代理
├── 📁 scripts/                    # 工具脚本
│   ├── 📄 migrate-supabase.ts     # 数据库迁移
│   ├── 📄 seed-treehole.js        # 树洞数据填充
│   ├── 📄 seed-knowledge.js       # 知识库数据填充
│   └── 📄 promote-user.js         # 用户权限提升
├── 📁 supabase/                   # Supabase配置
│   ├── 📄 config.toml             # Supabase配置
│   ├── 📁 functions/              # Edge Functions
│   │   ├── 📁 text-chat/          # 文本对话
│   │   ├── 📁 multimodal-chat/    # 多模态对话
│   │   ├── 📁 chat-completion/    # 聊天补全
│   │   ├── 📁 speech-recognition/ # 语音识别
│   │   ├── 📁 multimodal-analysis/ # 多模态分析
│   │   ├── 📁 multimodal-fusion/  # 多模态融合
│   │   ├── 📁 parse-document/     # 文档解析
│   │   ├── 📁 rag-retrieval/      # RAG检索
│   │   └── 📁 auth-username-signup/ # 用户名注册
│   └── 📁 migrations/             # 数据库迁移(18个迁移文件)
├── 📁 doc/                        # 项目文档
│   ├── 📄 DESIGN_SYSTEM.md        # 设计系统规范
│   ├── 📄 FEATURE_CHECKLIST.md    # 功能清单
│   ├── 📄 MULTIMODAL_ASSESSMENT.md # 多模态评估文档
│   ├── 📄 HEALING_CENTER_FEATURES.md # 疗愈中心文档
│   └── 📄 MEDICAL_THEME_DESIGN.md # 医疗主题设计
├── 📁 .rules/                     # 代码检查规则
│   ├── 📄 check.sh                # 检查脚本
│   ├── 📄 testBuild.sh            # 构建测试
│   └── 📄 *.yml                   # 规则配置
└── 📁 dist/                       # 构建输出目录
```

---

## ⚡ 核心功能模块

### 🏠 首页模块 (HomePage)
- **智能问候系统** - 根据时间和天气显示个性化问候
- **健康评分仪表盘** - SVG动画圆形进度条，实时显示心理健康状态
- **连续打卡统计** - 激励用户持续使用，建立健康习惯
- **快捷功能入口** - 2x2网格布局，一键访问核心功能
- **个性化建议** - 基于用户数据的每日健康提示
- **最近评估** - 展示最新的心理评估结果和趋势

### 🧠 AI评估模块 (EnhancedAssessmentPage)
- **多模态AI分析引擎**
  - 📝 **文本情绪分析** - NLP技术，识别情绪倾向和风险因子
  - 🎤 **语音情感识别** - 声纹分析，检测语调变化
  - 📷 **面部表情识别** - 实时检测微表情，情绪状态评估
  - 📹 **视频行为分析** - 肢体语言，行为模式识别
- **智能对话系统**
  - 🤖 **流式AI对话** - 基于文心一言4.0，自然语言交互
  - 🧠 **上下文记忆** - 多轮对话，个性化回应
  - 📋 **标准化量表** - PHQ-9、GAD-7等专业心理量表
  - 🎯 **自适应提问** - 根据回答动态调整问题
- **专业评估报告**
  - 📊 **风险等级评估** - 低、中、高风险分级
  - 💡 **个性化建议** - 基于评估结果的专业建议
  - 📈 **趋势分析** - 历史数据对比，康复进度追踪
  - 🚨 **风险预警** - 自动识别高风险状态，及时干预

### 🧘 疗愈模块 (HealingPageNew)

#### 冥想Tab - 沉浸式冥想体验
- **专业音频播放器**
  - 🎵 **高品质音频** - 支持多种格式，无损播放
  - ⏯️ **精确控制** - 播放、暂停、快进、倍速播放
  - 🔄 **循环模式** - 单曲循环、列表循环
  - 🎚️ **音效调节** - 均衡器、环境音混合
- **3D呼吸动画系统**
  - 🌊 **多层动画** - 3层同心圆，渐进式呼吸引导
  - ✨ **发光效果** - CSS动画，营造宁静氛围
  - 🎨 **主题切换** - 多种颜色主题，个性化体验
  - ⏱️ **节拍控制** - 可调节呼吸频率，适应不同需求
- **智能冥想库**
  - 🏷️ **分类管理** - 呼吸、放松、睡眠、专注、缓解压力
  - 🔍 **智能推荐** - 基于用户偏好和状态推荐内容
  - ⭐ **收藏系统** - 个人收藏夹，快速访问喜爱内容
  - 📊 **使用统计** - 练习时长、频率、效果追踪
- **冥想数据追踪**
  - ⏰ **时长统计** - 每日、每周、每月练习时长
  - 📅 **连续天数** - 连续练习天数，习惯养成
  - 🎯 **目标设定** - 个人冥想目标，进度追踪
  - 📈 **效果评估** - 冥想前后情绪对比

#### 树洞空间- 匿名互助社区
- **隐私保护机制**
  - 🎭 **匿名发布** - 自动生成匿名昵称，保护真实身份
  - 🔒 **数据加密** - 端到端加密，确保隐私安全
  - 🛡️ **内容审核** - AI+人工双重审核，过滤有害内容
- **分类讨论系统**
  - 💬 **寻求支持** - 情感倾诉，获得理解和安慰
  - 📈 **分享进展** - 康复经历，激励他人
  - ❓ **疑问解答** - 专业问题，社区互助
  - 💪 **提供鼓励** - 正能量传递，相互支持
  - 🌟 **康复故事** - 成功案例，希望之光
- **康复故事特色**
  - 🏆 **特殊标识** - 金色高亮，突出展示
  - ✨ **精选推荐** - 编辑精选，优质内容
  - 📖 **完整叙述** - 详细的康复历程
  - 💡 **经验分享** - 实用的康复技巧
- **社区互动**
  - 👍 **点赞支持** - 表达认同，传递温暖
  - 💬 **深度评论** - 多层回复，深入交流
  - 🔄 **内容分享** - 传播正能量，扩大影响
  - 🚨 **举报机制** - 维护社区环境，及时处理问题
#### 📝 情绪日记模块 (RecordPageNew)
- **多模态输入系统**
  - 🎤 **智能语音识别** - WebRTC录音，实时转文字，支持方言
  - 📷 **图片智能上传** - 拖拽上传，自动压缩，
- **智能日历系统**
  - 📅 **中文本地化** - 农历显示，节假日标记
  - 🏷️ **情绪标记** - 不同颜色表示不同情绪状态
  - 💬 **快速预览** - 悬停显示当日记录摘要
#### 知识Tab - 专业心理健康知识库
- **智能内容搜索**
  - 🔍 **多字段搜索** - 标题、内容、作者、标签全文搜索
  - 🏷️ **标签筛选** - 多级标签系统，精准定位
  - 📊 **搜索建议** - 智能补全，热门搜索推荐
- **内容分类系统**
  - 📖 **专业文章** - 心理学知识、自助指南
  - 🎬 **教学视频** - 专家讲座、技巧演示
  - 🎧 **音频课程** - 播客、冥想指导
  - � **文档资料** - 支持PDF、Word等格式文档上传和预览
- **文档管理功能**
  - 📤 **文档上传** - 支持多种格式文档上传
  - � **RAG检索** - 基于文档内容的智能检索
  - 📑 **文档解析** - 自动解析文档内容，提取关键信息
  - 📊 **文档预览** - 在线预览文档内容
- **个性化推荐**
  - 🎯 **智能推荐** - 基于阅读历史和兴趣推荐
  - � **热门内容** - 浏览量、点赞数排序
  - 🆕 **最新更新** - 时间排序，获取最新知识
  - ⭐ **专家精选** - 专业医生推荐的优质内容
- **互动功能**
  - 👍 **点赞收藏** - 表达喜好，建立个人知识库
  - 💬 **评论讨论** - 用户交流，知识分享
  - 📤 **内容分享** - 社交媒体分享，传播正能量
  - 📊 **学习进度** - 阅读进度，学习成就

### 👤 个人模块 (ProfilePageRedesigned)
- **个人信息管理**
  - 👤 **头像系统** - 自定义头像，多种默认选项
  - 📝 **资料编辑** - 姓名、电话、生日等基本信息
  - 🔒 **隐私设置** - 数据可见性，隐私保护级别
  - 🎨 **主题定制** - 个性化界面主题
- **健康数据中心**
  - 📊 **健康评分** - 综合心理健康状态评分
  - 📈 **趋势分析** - 情绪变化趋势，康复进度
  - 📋 **评估历史** - 完整的评估记录和报告
  - 🏆 **成就系统** - 康复里程碑，激励机制
- **快捷功能中心**
  - 📊 **评估历史** - 查看所有心理评估记录
  - 📁 **健康档案** - 完整的健康数据管理
  - ⌚ **设备连接** - 智能手环、手表数据同步
  - 👨‍⚕️ **医生对接** - 专业医生咨询预约
  - ⚙️ **系统设置** - 通知、隐私、账户设置

### 👨‍⚕️ 医生后台系统
- **数据看板 (DashboardPage)**
  - 📊 **患者统计** - 总数、新增、活跃度统计
  - 🚨 **风险预警** - 高风险患者实时监控
  - 📈 **趋势分析** - 整体康复趋势，效果评估
  - 📋 **工作概览** - 今日任务，待处理事项
- **患者管理 (PatientsPage)**
  - 👥 **患者列表** - 完整的患者信息管理
  - 📋 **病历查看** - 详细的诊疗记录
  - 💬 **沟通记录** - 医患交流历史
  - 📊 **康复进度** - 可视化康复数据
- **知识库管理 (KnowledgePage)**
  - 📚 **医学知识** - 专业的心理学知识库
  - 📋 **诊疗指南** - 标准化诊疗流程
  - 📖 **案例库** - 典型病例和治疗方案
  - � **文档管理** - 支持文档上传、编辑、删除
  - 🔍 **RAG检索** - 基于文档内容的智能检索
  - �🔄 **内容更新** - 最新研究成果和指南
- **预警系统 (AlertsPage)**
  - 🚨 **风险预警** - 自动识别高风险患者
  - 📝 **处理记录** - 预警处理过程记录
  - 👥 **患者跟进** - 后续治疗计划制定
  - 📊 **效果评估** - 干预效果统计分析



---

## 🚀 快速开始

### 📋 环境要求
- **Node.js** ≥ 20.0.0 (推荐使用LTS版本)
- **npm** ≥ 10.0.0 或 **pnpm** ≥ 8.0.0
- **现代浏览器** 
  - Chrome 88+ / Edge 88+ / Safari 14+ / Firefox 78+
  - 支持WebRTC、Web Audio API、Canvas API
- **开发环境**
  - VS Code (推荐) + 相关插件
  - Git 2.0+

### ⚡ 快速安装

#### 1. 克隆项目
```bash
# 使用HTTPS
git clone https://github.com/your-org/MindCareAI.git
cd MindCareAI

# 或使用SSH
git clone git@github.com:your-org/MindCareAI.git
cd MindCareAI
```

#### 2. 安装依赖
```bash
# 使用pnpm (推荐，项目使用pnpm 10.0.0)
pnpm install

# 或使用npm
npm install

# 或使用yarn
yarn install
```

#### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量 (必须配置)
nano .env
```

#### 4. 环境变量配置
```env
# ===========================================
# Supabase 配置 (必须)
# ===========================================
VITE_APP_ID=your-app-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_OFFLINE=false

# Supabase 服务端配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===========================================
# AI服务配置 (必须，用于AI功能)
# ===========================================
# 火山引擎豆包大模型
VOLC_ARK_API_KEY=your-volc-ark-key
VITE_VOLC_ARK_API_KEY=your-volc-ark-key

# 硅基流动语音识别
SILICONFLOW_API_KEY=your-siliconflow-key
VITE_SILICONFLOW_API_KEY=your-siliconflow-key

# 魔搭多模态大模型
MODELSCOPE_API_KEY=your-modelscope-key
VITE_MODELSCOPE_API_KEY=your-modelscope-key

# ===========================================
# 数据库迁移配置 (可选)
# ===========================================
MIGRATE_TARGET_SUPABASE_URL=https://your-project.supabase.co
MIGRATE_TARGET_SERVICE_ROLE_KEY=your-service-role-key
MIGRATE_SOURCE_SUPABASE_URL=
MIGRATE_SOURCE_SERVICE_ROLE_KEY=
```

#### 5. 启动开发服务器
```bash
# 启动开发服务器
npm run dev

# 服务器将在以下地址启动:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.1.100:5173/
```

#### 6. 访问应用
打开浏览器访问 `http://localhost:5173`

### 🔧 开发工具配置

#### VS Code 推荐插件
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode", 
    "ms-vscode.vscode-typescript-next",
    "biomejs.biome",
    "ms-vscode.vscode-json"
  ]
}
```

#### VS Code 设置
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### 🏗️ 构建和部署

#### 本地构建
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 构建输出在 dist/ 目录
```

#### 代码质量检查
```bash
# 运行所有检查 (推荐在提交前运行)
pnpm run lint

# 单独运行各项检查
npx biome check src/          # 代码格式和质量
npx tsc -p tsconfig.check.json --noEmit  # TypeScript类型检查
node .rules/check.cjs         # 自定义规则检查
node .rules/tailwind-check.cjs # Tailwind CSS检查
node .rules/testBuild.cjs     # 构建测试
```

#### 数据库管理
```bash
# 数据库迁移
pnpm run migrate:supabase

# 实时数据同步
pnpm run sync:realtime

# 验证迁移
pnpm run verify:migration

# 填充树洞示例数据
pnpm run seed:treehole

# 填充知识库示例数据
pnpm run seed:knowledge

# 提升用户权限
pnpm run promote:user
```

#### 性能优化
```bash
# 分析构建包大小
pnpm run build -- --analyze

# 检查依赖更新
pnpm outdated

# 清理缓存
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## ⚙️ 部署指南

### 前端部署

#### Vercel部署 (推荐)
项目已配置Vercel部署，包含API代理路由：

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/innerapi/v1/volc/responses", "destination": "/api/volc/responses" },
    { "source": "/innerapi/v1/siliconflow/audio/transcriptions", "destination": "/api/siliconflow/audio/transcriptions" },
    { "source": "/innerapi/v1/modelscope/chat/completions", "destination": "/api/modelscope/chat/completions" }
  ]
}
```

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

注意：需要在Vercel环境变量中配置所有必需的API密钥。

#### Netlify部署
```bash
# 构建项目
npm run build

# 上传dist目录到Netlify
```

#### 自托管部署
```bash
# 构建项目
npm run build

# 将dist目录部署到Web服务器
# 配置nginx/apache支持SPA路由
```

### 后端配置

#### Supabase设置
1. **创建Supabase项目**
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 获取URL和API Key

2. **数据库初始化**
```sql
-- 创建用户档案表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  full_name TEXT,
  gender TEXT,
  birth_date DATE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 创建情绪日记表
CREATE TABLE emotion_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  diary_date DATE NOT NULL,
  emotion_level TEXT NOT NULL,
  title TEXT,
  content TEXT,
  tags TEXT[],
  image_urls TEXT[],
  voice_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更多表结构请参考数据库迁移文件
```

3. **存储桶配置**
```sql
-- 创建图片存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('diary-images', 'diary-images', true);

-- 设置存储策略
CREATE POLICY "用户可以上传图片" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

4. **Edge Functions部署**
```bash
# 安装Supabase CLI
npm install -g supabase

# 登录Supabase
supabase login

# 部署所有Edge Functions
supabase functions deploy text-chat
supabase functions deploy multimodal-chat
supabase functions deploy chat-completion
supabase functions deploy speech-recognition
supabase functions deploy multimodal-analysis
supabase functions deploy multimodal-fusion
supabase functions deploy parse-document
supabase functions deploy rag-retrieval
supabase functions deploy auth-username-signup
```

### 环境变量配置

#### 生产环境
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI服务 (必须配置)
VOLC_ARK_API_KEY=your-volc-ark-key
SILICONFLOW_API_KEY=your-siliconflow-key
MODELSCOPE_API_KEY=your-modelscope-key

# 应用配置
VITE_APP_ID=app-97zabxvzebcx
NODE_ENV=production
```

#### 开发环境
```env
# 开发环境配置
NODE_ENV=development
VITE_DEV_MODE=true

# 本地Supabase (可选)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
```

---

## 📦 API 接口

### 认证接口

#### 用户注册
```typescript
POST /auth/signup
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: {
  "user": User,
  "session": Session
}
```

#### 用户登录
```typescript
POST /auth/signin
Content-Type: application/json

{
  "username": "string", 
  "password": "string"
}

Response: {
  "user": User,
  "session": Session
}
```

### 用户档案接口

#### 获取用户档案
```typescript
GET /api/profiles/{userId}
Authorization: Bearer <token>

Response: {
  "id": "string",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "role": "user" | "doctor" | "admin",
  "avatar_url": "string",
  "created_at": "string"
}
```

#### 更新用户档案
```typescript
PUT /api/profiles/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "string",
  "phone": "string",
  "bio": "string"
}
```

### 情绪日记接口

#### 获取日记列表
```typescript
GET /api/emotion-diaries?user_id={userId}&limit={limit}
Authorization: Bearer <token>

Response: {
  "data": EmotionDiary[],
  "count": number
}
```

#### 创建日记
```typescript
POST /api/emotion-diaries
Authorization: Bearer <token>
Content-Type: application/json

{
  "diary_date": "2024-01-01",
  "emotion_level": "good",
  "content": "string",
  "image_urls": ["string"],
  "voice_url": "string"
}
```

#### 更新日记
```typescript
PUT /api/emotion-diaries/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string",
  "emotion_level": "very_good"
}
```

#### 删除日记
```typescript
DELETE /api/emotion-diaries/{id}
Authorization: Bearer <token>
```

### AI评估接口

#### 文本对话
```typescript
POST /functions/v1/text-chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "string",
  "conversation_history": Array<{role: string, content: string}>
}

Response: Stream<{
  "content": "string",
  "done": boolean
}>
```

#### 聊天补全
```typescript
POST /functions/v1/chat-completion
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": Array<{role: string, content: string}>,
  "stream": boolean
}

Response: Stream or JSON
```

#### 多模态分析
```typescript
POST /functions/v1/multimodal-chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "string",
  "image_base64": "string",
  "conversation_history": Array
}

Response: Stream<{
  "content": "string", 
  "analysis": {
    "emotion": "string",
    "risk_level": number,
    "suggestions": string[]
  }
}>
```

#### 语音识别
```typescript
POST /functions/v1/speech-recognition
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "wav",
  "rate": 16000,
  "speech": "base64_audio_data",
  "len": number
}

Response: {
  "err_no": 0,
  "result": ["识别的文字内容"]
}
```

### 疗愈内容接口

#### 获取冥想内容
```typescript
GET /api/healing-contents?category={category}&content_type=meditation
Authorization: Bearer <token>

Response: {
  "data": HealingContent[],
  "count": number
}
```

#### 创建冥想记录
```typescript
POST /api/meditation-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "content_id": "string",
  "duration": number,
  "completed": boolean,
  "mood_after": "string"
}
```

### 社区接口

#### 获取社区帖子
```typescript
GET /api/community-posts?category={category}&limit={limit}
Authorization: Bearer <token>

Response: {
  "data": CommunityPost[],
  "count": number
}
```

---

## 💡 常见问题与解决方案

### 🔧 开发环境问题

**Q: npm install 失败怎么办？**
```bash
# 方案1: 清除缓存重新安装 (pnpm)
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 方案2: 使用国内镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install

# 方案3: 使用npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: TypeScript 类型错误怎么解决？**
```bash
# 检查TypeScript配置
npx tsc --noEmit

# 更新类型定义
npm update @types/react @types/react-dom

# 重启TypeScript服务 (VS Code)
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# 检查路径别名配置
# 确保 tsconfig.json 中的 paths 配置正确
```

### 🔮 未来规划

#### 近期计划 (Q1 2026)
- [ ] **PWA支持** - 离线使用和桌面安装
- [ ] **国际化** - 多语言支持(英文、日文)
- [ ] **智能手环集成** - 心率、睡眠数据同步

#### 中期计划 (Q2-Q3 2026)  
- [ ] **视频通话** - 在线心理咨询功能
- [ ] **群组疗愈** - 多人冥想和讨论
- [ ] **数据分析** - 更深入的健康洞察
- [ ] **API开放** - 第三方集成支持

#### 长期愿景 (2026+)
- [ ] **VR/AR支持** - 沉浸式疗愈体验
- [ ] **AI医生** - 专业级AI诊断助手
- [ ] **生态系统** - 完整的心理健康平台
- [ ] **科研合作** - 与医疗机构深度合作

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给我们一个Star！**

**让我们一起为心理健康事业贡献力量** 💪

Made with ❤️ by [灵愈AI团队](https://www.miaoda.cn)

</div>
