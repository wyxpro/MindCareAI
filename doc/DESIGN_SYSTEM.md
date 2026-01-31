# 灵愈AI数字医生 - UI设计规范文档

## 📋 设计系统概述

本项目采用**科技医疗现代设计风格**,以医疗蓝为主色调,结合渐变、发光、玻璃态等现代UI效果,打造专业、可信赖的医疗健康应用体验。

---

## 🎨 颜色系统

### 主色调
```css
--primary: 214 100% 50%        /* 医疗蓝 - 主要操作、强调元素 */
--primary-glow: 214 100% 60%   /* 发光效果 */
```

### 辅助色
```css
--secondary: 210 100% 96%      /* 浅蓝 - 次要背景 */
--info: 199 89% 48%            /* 青蓝 - 信息提示 */
--success: 142 76% 36%         /* 医疗绿 - 成功、健康 */
--warning: 38 92% 50%          /* 琥珀色 - 警告 */
--destructive: 0 84% 60%       /* 医疗红 - 错误、危险 */
```

### 中性色
```css
--background: 210 20% 98%      /* 页面背景 */
--foreground: 215 25% 20%      /* 主要文字 */
--muted: 210 20% 96%           /* 静音背景 */
--muted-foreground: 215 16% 50% /* 次要文字 */
--border: 214 20% 90%          /* 边框 */
```

### 图表配色
```css
--chart-1: 214 100% 50%        /* 蓝色 */
--chart-2: 142 76% 36%         /* 绿色 */
--chart-3: 280 70% 55%         /* 紫色 */
--chart-4: 38 92% 50%          /* 橙色 */
--chart-5: 340 85% 55%         /* 粉色 */
```

---

## 📐 间距系统 (8px网格)

```css
xs:  4px   /* 紧密间距 */
sm:  8px   /* 小间距 */
md:  16px  /* 标准间距 */
lg:  24px  /* 大间距 */
xl:  32px  /* 超大间距 */
2xl: 48px  /* 特大间距 */
```

---

## 🔲 圆角系统

```css
sm:  8px   /* 小组件 - 按钮、输入框 */
md:  12px  /* 中等组件 - 卡片 */
lg:  16px  /* 大组件 - 大卡片 */
xl:  20px  /* 超大组件 */
2xl: 24px  /* 特大组件 */
full: 9999px /* 圆形 */
```

---

## 🌟 阴影系统

### 标准阴影
```css
.shadow-sm    /* 轻微阴影 */
.shadow       /* 标准阴影 */
.shadow-lg    /* 大阴影 */
```

### 发光效果
```css
.shadow-glow           /* 主色发光: 0 0 20px primary/0.3 */
.shadow-glow-lg        /* 大发光: 0 0 30px primary/0.4 */
.shadow-success-glow   /* 成功色发光 */
.shadow-card-hover     /* 卡片悬浮阴影 */
```

---

## ✍️ 字体层级

```css
h1: 2.5rem/40px  font-bold    /* 页面主标题 */
h2: 2rem/32px    font-semibold /* 区块标题 */
h3: 1.5rem/24px  font-semibold /* 卡片标题 */
h4: 1.25rem/20px font-semibold /* 小标题 */
h5: 1.125rem/18px font-medium  /* 次级标题 */
body: 1rem/16px  font-normal   /* 正文 */
small: 0.875rem/14px           /* 辅助文字 */
tiny: 0.75rem/12px             /* 标签、提示 */
```

---

## 🎬 动画系统

### 动画时长
```css
fast:   150ms  /* 微交互 - 按钮点击、hover */
normal: 300ms  /* 标准过渡 - 卡片展开、颜色变化 */
slow:   500ms  /* 页面切换 - 路由过渡 */
```

### 缓动函数
```css
ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)  /* 平滑过渡 */
ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55) /* 弹跳效果 */
```

### 常用动画类

#### 淡入动画
```css
.animate-fade-in        /* 淡入 + 上移 */
.animate-fade-in-up     /* 淡入 + 上移 (大幅度) */
.animate-fade-in-down   /* 淡入 + 下移 */
```

#### 滑入动画
```css
.animate-slide-in       /* 从左滑入 */
.animate-slide-in-right /* 从右滑入 */
```

#### 缩放动画
```css
.animate-scale-in       /* 缩放淡入 */
```

#### 特效动画
```css
.animate-pulse-glow     /* 脉冲发光 */
.animate-shimmer        /* 闪烁效果 */
.animate-float          /* 浮动效果 */
.animate-breathe        /* 呼吸效果 */
.animate-spin-slow      /* 慢速旋转 */
```

---

## 🎨 特殊效果类

### 渐变文字
```css
.gradient-text
/* 使用: 标题、强调文字 */
```

### 玻璃态效果
```css
.glass       /* 浅色玻璃态 */
.glass-dark  /* 深色玻璃态 */
/* 使用: 卡片、模态框 */
```

### 渐变背景
```css
.bg-gradient-primary  /* 蓝色渐变 */
.bg-gradient-success  /* 绿色渐变 */
.bg-gradient-tech     /* 科技渐变 (蓝紫) */
```

### 发光效果
```css
.glow-primary   /* 主色发光 */
.glow-success   /* 成功色发光 */
```

### 卡片效果
```css
.card-hover       /* 标准悬浮效果 */
.card-hover-glow  /* 悬浮 + 发光效果 */
```

### 过渡效果
```css
.transition-smooth  /* 平滑过渡 (300ms) */
.transition-fast    /* 快速过渡 (150ms) */
.transition-slow    /* 慢速过渡 (500ms) */
```

---

## 🧩 组件使用规范

### 卡片 (Card)
```tsx
<Card className="glass border-primary/20 shadow-glow card-hover-glow animate-fade-in-up">
  <CardHeader>
    <CardTitle className="flex items-center gap-3 text-xl">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
        <Icon className="w-5 h-5 text-white" />
      </div>
      标题
    </CardTitle>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

### 按钮 (Button)
```tsx
{/* 主要按钮 */}
<Button className="bg-gradient-to-r from-primary to-info hover:shadow-glow transition-smooth">
  操作
</Button>

{/* 次要按钮 */}
<Button variant="outline" className="border-primary/30 hover:bg-primary/10 transition-smooth">
  取消
</Button>
```

### 徽章 (Badge)
```tsx
<Badge className="bg-primary shadow-glow text-white px-3 py-1">
  标签
</Badge>
```

### 输入框 (Input/Textarea)
```tsx
<Input className="bg-background border-border focus:border-primary/50 focus:ring-primary/20 transition-smooth" />
```

---

## 📱 响应式设计

### 断点
```css
sm:  640px   /* 手机横屏 */
md:  768px   /* 平板 */
lg:  1024px  /* 笔记本 */
xl:  1280px  /* 桌面 */
2xl: 1536px  /* 大屏 */
```

### 移动端优化
- 触摸目标最小 44x44px
- 字体在小屏幕自动缩小
- 卡片间距在移动端减小
- 使用 `max-sm:` 前缀针对小屏优化

---

## ♿ 可访问性

### 颜色对比度
- 所有文字与背景对比度 ≥ 4.5:1 (WCAG AA)
- 大文字 (≥18px) 对比度 ≥ 3:1

### 动画控制
```css
@media (prefers-reduced-motion: reduce) {
  /* 自动禁用动画 */
}
```

### 键盘导航
- 所有交互元素支持 Tab 导航
- 焦点状态清晰可见
- 使用 `focus-visible:` 优化焦点样式

---

## 🎯 最佳实践

### 1. 卡片设计
✅ **推荐**:
```tsx
<Card className="glass border-primary/20 shadow-glow card-hover-glow">
```

❌ **避免**:
```tsx
<Card className="bg-white border-gray-200">
```

### 2. 图标使用
✅ **推荐**: 图标包裹在渐变圆角容器中
```tsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
  <Icon className="w-5 h-5 text-white" />
</div>
```

### 3. 动画延迟
✅ **推荐**: 列表项使用递增延迟
```tsx
{items.map((item, index) => (
  <div 
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    {item.content}
  </div>
))}
```

### 4. 状态指示
✅ **推荐**: 使用脉冲动画的彩色圆点
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
  <span>在线</span>
</div>
```

---

## 🔧 工具类速查

### 常用组合
```css
/* 玻璃态卡片 */
glass border-primary/20 shadow-glow card-hover-glow

/* 渐变按钮 */
bg-gradient-to-r from-primary to-info hover:shadow-glow transition-smooth

/* 图标容器 */
w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow

/* 状态指示器 */
w-2 h-2 rounded-full bg-success animate-pulse

/* 空状态容器 */
w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center animate-float
```

---

## 📚 参考资源

- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Lucide Icons**: https://lucide.dev
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## 📝 更新日志

### v1.0.0 (2026-01-27)
- ✅ 建立科技医疗设计系统
- ✅ 实现完整的颜色、间距、动画系统
- ✅ 优化首页、疗愈页、医生看板页面
- ✅ 添加玻璃态、发光、渐变等现代效果
- ✅ 支持深色模式和可访问性

---

**维护者**: 灵愈AI开发团队  
**最后更新**: 2026-01-27
