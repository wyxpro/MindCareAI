# 灵愈AI数字医生 - 医疗主题设计规范

## 一、设计理念

### 1.1 核心价值
- **专业可信**: 医疗蓝传递专业、可靠的品牌形象
- **人文关怀**: 温暖的交互设计体现对患者的关怀
- **简洁高效**: 清晰的信息层级,高效的操作流程
- **安全感**: 稳定的色彩体系,给予用户心理安全感

### 1.2 设计原则
- 医疗专业感与人文关怀并重
- 色彩以蓝、白、绿等冷静、安全的色调为主
- 整体风格简洁明快,避免过多装饰元素
- 注重信息层级和视觉引导

## 二、色彩系统

### 2.1 主色调 - 医疗蓝
```css
/* 主色 - 蓝色系 */
--primary-blue-600: #2563EB;  /* 主要按钮、标题 */
--primary-blue-500: #3B82F6;  /* 次要元素 */
--primary-blue-400: #60A5FA;  /* 悬停状态 */

/* 渐变背景 */
background: linear-gradient(to bottom right, #2563EB, #3B82F6, #06B6D4);
```

**应用场景**:
- 顶部导航栏背景
- 个人信息卡片背景
- 主要操作按钮
- 重要图标背景

### 2.2 辅助色 - 清新绿
```css
/* 辅助色 - 绿色系 */
--emerald-500: #10B981;  /* 成功状态、健康指标 */
--emerald-400: #34D399;  /* 悬停状态 */
--emerald-50: #ECFDF5;   /* 浅色背景 */
```

**应用场景**:
- 心率监测卡片
- 健康状态良好提示
- 完成状态标识
- 正向反馈提示

### 2.3 功能色 - 青色
```css
/* 功能色 - 青色系 */
--cyan-500: #06B6D4;     /* 信息提示、数据展示 */
--cyan-400: #22D3EE;     /* 悬停状态 */
--cyan-50: #ECFEFF;      /* 浅色背景 */
```

**应用场景**:
- 睡眠质量卡片
- 数据趋势图标
- 信息提示
- 冥想练习提醒

### 2.4 强调色 - 温暖橙
```css
/* 强调色 - 橙色系 */
--amber-500: #F59E0B;    /* 待办提醒、重要通知 */
--orange-500: #F97316;   /* 紧急提示 */
--amber-50: #FFFBEB;     /* 浅色背景 */
```

**应用场景**:
- 待办提醒卡片
- 重要通知
- 用药提醒
- 预警信息

### 2.5 中性色 - 灰度系统
```css
/* 中性色 - 灰色系 */
--slate-50: #F8FAFC;     /* 页面背景 */
--slate-100: #F1F5F9;    /* 卡片背景 */
--slate-200: #E2E8F0;    /* 边框 */
--slate-400: #94A3B8;    /* 次要文字 */
--slate-600: #475569;    /* 辅助文字 */
--slate-800: #1E293B;    /* 主要文字 */
--slate-900: #0F172A;    /* 深色模式背景 */
```

**应用场景**:
- 页面背景渐变
- 卡片背景
- 文字颜色
- 边框颜色
- 设置按钮

### 2.6 语义色
```css
/* 成功 */
--success: #10B981;      /* 绿色 */

/* 警告 */
--warning: #F59E0B;      /* 橙色 */

/* 错误 */
--error: #EF4444;        /* 红色 */

/* 信息 */
--info: #3B82F6;         /* 蓝色 */
```

## 三、医疗图标系统

### 3.1 核心图标
| 图标 | 名称 | 用途 | 颜色 |
|------|------|------|------|
| Activity | 心电图 | 评估历史、健康监测 | 蓝色 #3B82F6 |
| FileText | 病历 | 健康档案、记录查看 | 绿色 #10B981 |
| Heart | 心率 | 体征监测、健康状态 | 玫瑰色 #F43F5E |
| Stethoscope | 听诊器 | 在线问诊、医生对接 | 青色 #06B6D4 |
| Pill | 药丸 | 用药提醒、处方管理 | 琥珀色 #F59E0B |
| Moon | 月亮 | 睡眠质量、休息监测 | 蓝色 #3B82F6 |
| TrendingUp | 趋势 | 数据分析、情绪趋势 | 青色 #06B6D4 |
| AlertCircle | 提醒 | 待办事项、重要通知 | 琥珀色 #F59E0B |

### 3.2 图标设计规范
- **尺寸**: 标准图标 20px (w-5 h-5), 大图标 28px (w-7 h-7)
- **圆角**: 图标容器使用 rounded-xl (12px) 或 rounded-2xl (16px)
- **背景**: 使用渐变背景增强视觉效果
- **阴影**: shadow-lg 增强层次感
- **动画**: group-hover:scale-110 悬停放大效果

### 3.3 图标容器样式
```tsx
{/* 标准图标容器 */}
<div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
  <Activity className="w-7 h-7 text-white" />
</div>

{/* 渐变图标容器 */}
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
  <Heart className="w-5 h-5 text-white" />
</div>
```

## 四、组件设计规范

### 4.1 个人信息卡片
**设计特点**:
- 医疗蓝渐变背景 (from-blue-600 via-blue-500 to-cyan-500)
- 玻璃拟态健康评分卡 (backdrop-blur-xl)
- 大头像 (w-20 h-20) + 白色边框
- 圆形进度条展示健康评分

**代码示例**:
```tsx
<Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
  <CardContent className="p-6 space-y-6">
    {/* 用户信息 */}
    <Avatar className="w-20 h-20 border-4 border-white/40 shadow-2xl ring-4 ring-white/20">
      <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
        {getUserInitial()}
      </AvatarFallback>
    </Avatar>
    
    {/* 健康评分 - 玻璃拟态 */}
    <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-2xl">
      <div className="text-7xl font-bold text-white">{healthScore}</div>
      <div className="h-3 bg-white/25 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-white via-cyan-100 to-white rounded-full" 
             style={{ width: `${healthScore}%` }} />
      </div>
    </div>
  </CardContent>
</Card>
```

### 4.2 快捷功能卡片
**设计特点**:
- 白色背景 + 细边框
- 彩色图标容器 (14x14, rounded-2xl)
- 悬停效果: scale-[1.02] + shadow-2xl
- 右侧箭头动画

**代码示例**:
```tsx
<Card className="border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group bg-white">
  <CardContent className="p-5">
    <div className="flex items-center gap-4">
      {/* 医疗图标 */}
      <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
        <Activity className="w-7 h-7 text-white" />
      </div>
      
      {/* 文字信息 */}
      <div className="flex-1">
        <h4 className="font-semibold text-slate-800 text-base mb-1">评估历史</h4>
        <p className="text-sm text-slate-500">100次评估</p>
      </div>
      
      {/* 箭头 */}
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
    </div>
  </CardContent>
</Card>
```

### 4.3 健康数据卡片
**设计特点**:
- 浅色渐变背景 (from-emerald-50 to-emerald-100)
- 彩色图标容器 (8x8, rounded-lg)
- 大号数字 (text-2xl) + 单位
- 悬停效果: shadow-xl + border颜色变化

**代码示例**:
```tsx
<div className="group p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-smooth hover:-translate-y-1">
  <div className="flex items-center mb-3">
    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform shadow-md">
      <Activity className="w-4 h-4 text-white" />
    </div>
    <p className="text-xs text-slate-600 font-medium">心率监测</p>
  </div>
  <p className="text-2xl font-bold text-slate-800">
    72 <span className="text-sm font-normal text-slate-500">bpm</span>
  </p>
</div>
```

### 4.4 待办提醒卡片
**设计特点**:
- 琥珀色图标容器 (animate-pulse-glow)
- 彩色浅背景 + 脉动圆点
- 状态徽章 (Badge)
- 悬停效果: shadow-xl + -translate-y-1

**代码示例**:
```tsx
<Link to="/record">
  <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-smooth cursor-pointer hover:-translate-y-1">
    <div className="flex items-center">
      <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse" />
      <span className="text-sm font-medium text-slate-700">今日情绪打卡</span>
    </div>
    <Badge variant="outline" className="border-emerald-500 text-emerald-600 group-hover:bg-emerald-100">
      待完成
    </Badge>
  </div>
</Link>
```

### 4.5 音频播放器
**设计特点**:
- 紧凑尺寸 (占屏幕1/4)
- 呼吸动画圆形 (w-32 h-32)
- 细进度条 (h-1.5)
- 小播放按钮 (w-14 h-14)

**代码示例**:
```tsx
{/* 呼吸动画圆形 */}
<div className="relative w-32 h-32">
  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-breathe" />
  <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30 animate-breathe" />
  <div className="absolute inset-4 rounded-full border-2 border-indigo-500/40 animate-breathe" />
  <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
    <Music className="w-8 h-8 text-white" />
  </div>
</div>

{/* 播放控制 */}
<Button className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 shadow-2xl">
  <Play className="w-7 h-7 text-slate-900" fill="currentColor" />
</Button>
```

## 五、交互效果规范

### 5.1 页面转场
```css
/* 淡入上移动画 */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 淡入下移动画 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}
```

### 5.2 卡片悬停
```css
/* 标准悬停效果 */
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* 上移悬停效果 */
.hover\:-translate-y-1:hover {
  transform: translateY(-4px);
}
```

### 5.3 图标动画
```css
/* 缩放动画 */
.group-hover\:scale-110 {
  transition: transform 0.3s ease;
}

.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

/* 箭头平移 */
.group-hover\:translate-x-1 {
  transition: all 0.3s ease;
}

.group:hover .group-hover\:translate-x-1 {
  transform: translateX(4px);
}
```

### 5.4 进度条动画
```css
/* 平滑过渡 */
.transition-all {
  transition: all 1000ms ease-out;
}

/* 渐变进度条 */
.progress-bar {
  background: linear-gradient(to right, #ffffff, #a5f3fc, #ffffff);
  transition: width 1000ms ease-out;
}
```

### 5.5 脉动动画
```css
/* 脉动光晕 */
.animate-pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  }
}

/* 呼吸动画 */
.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.6;
  }
}
```

## 六、视觉设计规范

### 6.1 字体系统
```css
/* 标题字体 */
.text-3xl { font-size: 1.875rem; }  /* 30px - 页面标题 */
.text-2xl { font-size: 1.5rem; }    /* 24px - 卡片标题 */
.text-xl { font-size: 1.25rem; }    /* 20px - 子标题 */
.text-lg { font-size: 1.125rem; }   /* 18px - 大文本 */

/* 正文字体 */
.text-base { font-size: 1rem; }     /* 16px - 正文 */
.text-sm { font-size: 0.875rem; }   /* 14px - 辅助文字 */
.text-xs { font-size: 0.75rem; }    /* 12px - 说明文字 */

/* 数据字体 */
.text-7xl { font-size: 4.5rem; }    /* 72px - 健康评分 */
```

### 6.2 间距系统
```css
/* 组件间距 */
.space-y-6 { gap: 1.5rem; }   /* 24px - 卡片间距 */
.space-y-4 { gap: 1rem; }     /* 16px - 元素间距 */
.space-y-3 { gap: 0.75rem; }  /* 12px - 小元素间距 */

/* 内边距 */
.p-6 { padding: 1.5rem; }     /* 24px - 卡片内边距 */
.p-5 { padding: 1.25rem; }    /* 20px - 小卡片内边距 */
.p-4 { padding: 1rem; }       /* 16px - 紧凑内边距 */

/* 外边距 */
.mb-6 { margin-bottom: 1.5rem; }  /* 24px */
.mb-4 { margin-bottom: 1rem; }    /* 16px */
.mb-3 { margin-bottom: 0.75rem; } /* 12px */
```

### 6.3 圆角系统
```css
/* 圆角规范 */
.rounded-3xl { border-radius: 1.5rem; }  /* 24px - 对话框 */
.rounded-2xl { border-radius: 1rem; }    /* 16px - 卡片、按钮 */
.rounded-xl { border-radius: 0.75rem; }  /* 12px - 图标容器 */
.rounded-lg { border-radius: 0.5rem; }   /* 8px - 小图标 */
.rounded-full { border-radius: 9999px; } /* 圆形 - 头像、按钮 */
```

### 6.4 阴影系统
```css
/* 阴影层级 */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## 七、响应式设计

### 7.1 断点系统
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

### 7.2 移动端优化
- 使用 max-w-2xl 限制内容宽度
- 卡片使用 p-4 或 p-5 内边距
- 图标使用 w-14 h-14 或 w-10 h-10
- 文字使用 text-base 或 text-sm
- 按钮使用 h-12 或 h-14 高度

### 7.3 触摸优化
- 按钮最小尺寸 44x44px
- 卡片间距至少 12px
- 使用 cursor-pointer 指示可点击
- 悬停效果在移动端自动禁用

## 八、无障碍设计

### 8.1 颜色对比度
- 主要文字与背景对比度 ≥ 4.5:1 (WCAG AA)
- 大号文字与背景对比度 ≥ 3:1
- 图标与背景对比度 ≥ 3:1

### 8.2 语义化标签
```tsx
{/* 使用语义化HTML */}
<nav>导航栏</nav>
<main>主要内容</main>
<article>文章内容</article>
<section>区块内容</section>
```

### 8.3 键盘导航
- 所有交互元素支持Tab键导航
- 使用 focus:ring-2 显示焦点状态
- 使用 focus:outline-none 移除默认轮廓

### 8.4 屏幕阅读器
```tsx
{/* 添加aria标签 */}
<Button aria-label="编辑个人资料">
  <Edit className="w-5 h-5" />
</Button>

{/* 隐藏装饰性元素 */}
<div aria-hidden="true">
  <div className="absolute inset-0 opacity-10" />
</div>
```

## 九、性能优化

### 9.1 动画性能
- 使用 transform 和 opacity 实现动画
- 避免使用 width、height、margin 等触发重排的属性
- 使用 will-change 提示浏览器优化

### 9.2 图片优化
- 使用 loading="lazy" 懒加载图片
- 使用 WebP 格式减小文件大小
- 提供多种尺寸的图片资源

### 9.3 代码分割
- 使用 React.lazy() 懒加载组件
- 使用 Suspense 显示加载状态
- 按路由分割代码

## 十、设计检查清单

### 10.1 视觉检查
- [ ] 使用医疗蓝主色调
- [ ] 图标颜色与功能匹配
- [ ] 卡片使用圆角和阴影
- [ ] 文字层级清晰
- [ ] 间距统一规范

### 10.2 交互检查
- [ ] 悬停效果流畅
- [ ] 点击反馈明确
- [ ] 页面转场自然
- [ ] 加载状态友好
- [ ] 错误提示清晰

### 10.3 响应式检查
- [ ] 移动端显示正常
- [ ] 触摸区域足够大
- [ ] 内容不溢出
- [ ] 图片自适应
- [ ] 文字可读性好

### 10.4 无障碍检查
- [ ] 颜色对比度达标
- [ ] 键盘导航正常
- [ ] 语义化标签正确
- [ ] aria标签完整
- [ ] 屏幕阅读器友好

## 十一、实施案例

### 11.1 个人中心页面
**实施效果**:
- ✅ 医疗蓝渐变背景 (from-blue-600 to-cyan-500)
- ✅ 玻璃拟态健康评分卡
- ✅ 5个彩色快捷功能卡片
- ✅ 医疗图标系统 (Activity, FileText, Heart, Stethoscope, Pill)
- ✅ 悬停动画效果 (scale-[1.02], shadow-2xl)

### 11.2 首页
**实施效果**:
- ✅ 医疗蓝顶部欢迎区
- ✅ 健康状态卡片 (心率、睡眠)
- ✅ 情绪趋势卡片
- ✅ 待办提醒卡片 (琥珀色)
- ✅ 浅色渐变背景 (from-blue-50 via-white to-cyan-50)

### 11.3 疗愈页面
**实施效果**:
- ✅ 紧凑音频播放器 (占屏幕1/4)
- ✅ 呼吸动画圆形 (w-32 h-32)
- ✅ 细进度条 (h-1.5)
- ✅ 小播放按钮 (w-14 h-14)

## 十二、总结

### 12.1 设计亮点
1. **专业医疗色彩**: 蓝、绿、青色系传递专业可信感
2. **人文关怀设计**: 温暖的交互动画体现关怀
3. **清晰信息层级**: 大号数字、彩色图标、明确标签
4. **流畅交互体验**: 平滑动画、即时反馈、自然转场
5. **完整图标系统**: 统一的医疗主题图标

### 12.2 技术实现
- Tailwind CSS 实现响应式设计
- Lucide React 提供医疗图标
- CSS动画实现流畅过渡
- 玻璃拟态效果增强视觉层次
- 渐变背景营造专业氛围

### 12.3 用户价值
- 专业可信的品牌形象
- 清晰易懂的信息展示
- 高效便捷的操作流程
- 温暖关怀的使用体验
- 安全可靠的心理感受

---

**文档版本**: v1.0  
**更新日期**: 2026-01-29  
**设计团队**: 灵愈AI设计团队  
**适用范围**: 灵愈AI数字医生全平台
