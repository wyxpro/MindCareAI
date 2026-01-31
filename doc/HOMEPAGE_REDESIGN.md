# 灵愈AI首页重新设计说明

## 一、设计概述

根据参考图片,完全重新设计了首页,采用清新的绿色主题和卡片式布局,打造友好、专业的心理健康应用界面。

## 二、设计特点

### 2.1 整体布局
- **顶部导航栏**: 固定在顶部,包含logo和SOS按钮
- **欢迎卡片**: 大尺寸绿色渐变卡片,包含问候语和评估入口
- **数据展示区**: 2列网格布局,展示情绪评分和连续打卡天数
- **快捷入口**: 2x2网格布局,4个功能入口
- **健康提示**: 浅绿色背景的提示卡片
- **最近评估**: 列表展示最近的评估记录

### 2.2 色彩方案
- **主色调**: 绿色 (#10B981, #059669, #14B8A6)
- **辅助色**: 蓝色(#3B82F6)、紫色(#A855F7)、橙色(#F97316)
- **背景色**: 浅灰色 (#F8FAFC)
- **文字色**: 深灰色 (#1E293B)
- **强调色**: 红色 (#EF4444) - SOS按钮

### 2.3 视觉元素
- **圆角**: 统一使用rounded-2xl (16px)
- **阴影**: shadow-md/shadow-lg/shadow-xl
- **动画**: fade-in-down/fade-in-up + 延迟
- **图标**: Lucide React图标库

## 三、组件详解

### 3.1 顶部导航栏
```tsx
<div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
  <h1 className="text-2xl font-bold text-emerald-600">灵愈AI</h1>
  <Button className="text-red-500 hover:text-red-600 hover:bg-red-50">
    <ShieldAlert className="w-5 h-5 mr-1" />
    SOS
  </Button>
</div>
```

**特点**:
- 固定在顶部 (sticky top-0)
- 白色背景 + 细阴影
- logo使用绿色 (text-emerald-600)
- SOS按钮使用红色,突出紧急功能

### 3.2 欢迎卡片
```tsx
<Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600">
  <CardContent className="p-6 relative">
    {/* 装饰性背景图案 */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-4 right-4 w-32 h-32 border-8 border-white rounded-full" />
      <div className="absolute bottom-4 right-12 w-24 h-24 border-8 border-white rounded-full" />
      <div className="absolute top-12 right-20 w-16 h-16 border-8 border-white rounded-full" />
    </div>
    
    <div className="relative z-10">
      <h2 className="text-2xl font-bold text-white">
        {getGreeting()}, {getUserName()}
      </h2>
      <p className="text-white/90">
        今天是你在灵愈AI的第 {consecutiveDays} 天, 情绪非常稳定呀!
      </p>
      
      <Button className="bg-white text-emerald-600 rounded-full">
        开始今日评估 <ArrowRight />
      </Button>
    </div>
  </CardContent>
</Card>
```

**特点**:
- 绿色渐变背景 (from-emerald-500 to-teal-600)
- 装饰性圆形图案 (opacity-10)
- 白色文字 + 白色按钮
- 圆形按钮 (rounded-full)
- 动态问候语 (早安/下午好/晚上好)
- 显示连续打卡天数

### 3.3 情绪评分卡片
```tsx
<Card>
  <CardContent className="p-6 flex flex-col items-center">
    {/* SVG圆形进度条 */}
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" 
                className="text-slate-200" />
        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - currentScore / 100)}`}
                className="text-emerald-500" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{currentScore}</span>
        <span className="text-sm text-slate-500">{getScoreLabel()}</span>
      </div>
    </div>
    <p className="text-sm font-medium">当前情绪评分</p>
  </CardContent>
</Card>
```

**特点**:
- SVG圆形进度条
- 绿色进度 (text-emerald-500)
- 大号数字 (text-4xl)
- 评分标签 (优秀/良好/一般/需关注)
- 平滑动画 (transition-all duration-1000)

### 3.4 连续打卡卡片
```tsx
<Card>
  <CardContent className="p-6 flex flex-col items-center justify-center">
    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
      <Check className="w-8 h-8 text-emerald-500" />
    </div>
    <div className="text-center">
      <p className="text-4xl font-bold">
        {consecutiveDays} <span className="text-xl">天</span>
      </p>
      <p className="text-sm font-medium">连续打卡天数</p>
    </div>
  </CardContent>
</Card>
```

**特点**:
- 圆形图标容器 (w-16 h-16 rounded-full)
- 绿色勾选图标
- 大号数字 + 单位
- 居中布局

### 3.5 快捷入口
```tsx
<div className="grid grid-cols-2 gap-3">
  {quickActions.map((action) => (
    <Link to={action.link}>
      <Card className="hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-6 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-2xl ${action.bgColor}`}>
            <Icon className={action.color} />
          </div>
          <p className="text-sm font-medium">{action.title}</p>
        </CardContent>
      </Card>
    </Link>
  ))}
</div>
```

**快捷入口配置**:
| 名称 | 图标 | 颜色 | 背景色 | 链接 |
|------|------|------|--------|------|
| 写日记 | Calendar | 蓝色 #3B82F6 | bg-blue-50 | /record |
| 心理FM | Radio | 紫色 #A855F7 | bg-purple-50 | /healing |
| 社区交流 | Users | 橙色 #F97316 | bg-orange-50 | /healing |
| 基因报告 | FileText | 绿色 #10B981 | bg-emerald-50 | /assessment |

**特点**:
- 2x2网格布局
- 彩色图标容器 (w-14 h-14 rounded-2xl)
- 悬停效果 (hover:-translate-y-1)
- 浅色背景 + 深色图标

### 3.6 今日健康提示
```tsx
<Card className="bg-emerald-50">
  <CardContent className="p-5">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="text-base font-bold text-emerald-800">今日健康提示</h4>
        <p className="text-sm text-emerald-700">
          阳光中的紫外线能促进血清素合成。今天尝试出门走走 15 分钟, 对缓解轻度抑郁情绪非常有帮助哟!
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

**特点**:
- 浅绿色背景 (bg-emerald-50)
- 圆形图标容器 (bg-emerald-500)
- 深绿色文字 (text-emerald-700/800)
- 友好的提示文案

### 3.7 最近评估列表
```tsx
<Card onClick={() => navigate('/assessment')}>
  <CardContent className="p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h4 className="font-semibold">抑郁风险深度评估</h4>
          <p className="text-xs text-slate-500">1月29日 14:30</p>
        </div>
      </div>
      <Badge className="bg-amber-100 text-amber-700">中度风险</Badge>
    </div>
  </CardContent>
</Card>
```

**特点**:
- 蓝色图标容器
- 评估类型 + 时间
- 风险等级徽章 (高度/中度/低风险)
- 点击跳转到评估页面

## 四、交互效果

### 4.1 页面进入动画
```css
/* 淡入下移 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

/* 淡入上移 */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}
```

**应用**:
- 欢迎卡片: animate-fade-in-down
- 数据展示区: animate-fade-in-up (delay: 0.1s)
- 快捷入口: animate-fade-in-up (delay: 0.2s)
- 健康提示: animate-fade-in-up (delay: 0.3s)
- 最近评估: animate-fade-in-up (delay: 0.4s)

### 4.2 卡片悬停效果
```css
.hover:shadow-xl {
  transition: box-shadow 0.3s ease;
}

.hover:-translate-y-1 {
  transition: transform 0.3s ease;
}
```

**应用**:
- 快捷入口卡片: hover:shadow-xl hover:-translate-y-1
- 评估记录卡片: hover:shadow-xl

### 4.3 圆形进度条动画
```tsx
<circle
  strokeDashoffset={`${2 * Math.PI * 56 * (1 - currentScore / 100)}`}
  className="text-emerald-500 transition-all duration-1000"
/>
```

**特点**:
- 使用SVG strokeDasharray和strokeDashoffset
- 平滑过渡 (duration-1000)
- 圆角端点 (strokeLinecap="round")

## 五、功能实现

### 5.1 动态问候语
```typescript
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '早安';
  if (hour < 18) return '下午好';
  return '晚上好';
};
```

### 5.2 连续打卡天数计算
```typescript
const calculateConsecutiveDays = (diaries: EmotionDiary[]) => {
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < diaries.length; i++) {
    const diaryDate = new Date(diaries[i].diary_date);
    diaryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (diaryDate.getTime() === expectedDate.getTime()) {
      count++;
    } else {
      break;
    }
  }
  
  setConsecutiveDays(count);
};
```

### 5.3 情绪评分计算
```typescript
const scoreMap = { 
  very_bad: 20, 
  bad: 40, 
  neutral: 60, 
  good: 80, 
  very_good: 100 
};
setCurrentScore(scoreMap[latestDiary.emotion_level] || 75);
```

### 5.4 评分标签
```typescript
const getScoreLabel = () => {
  if (currentScore >= 80) return '优秀';
  if (currentScore >= 60) return '良好';
  if (currentScore >= 40) return '一般';
  return '需关注';
};
```

### 5.5 风险等级判断
```typescript
// risk_level是0-10的数字
{assessment.risk_level >= 7 ? '高度风险' : 
 assessment.risk_level >= 4 ? '中度风险' : 
 '低风险'}
```

## 六、响应式设计

### 6.1 移动端优化
- 最大宽度: max-w-2xl
- 内边距: p-4
- 底部留白: pb-24 (避免被底部导航遮挡)
- 网格布局: grid-cols-2 (2列)

### 6.2 卡片尺寸
- 快捷入口图标: w-14 h-14
- 评估记录图标: w-12 h-12
- 健康提示图标: w-10 h-10
- 连续打卡图标: w-16 h-16

### 6.3 文字大小
- 页面标题: text-2xl
- 卡片标题: text-lg
- 正文: text-base
- 辅助文字: text-sm
- 说明文字: text-xs

## 七、数据加载

### 7.1 加载状态
```tsx
{loading ? (
  <Card>
    <CardContent className="p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </CardContent>
  </Card>
) : (
  // 实际内容
)}
```

### 7.2 空状态
```tsx
{assessments.length === 0 && (
  <Card>
    <CardContent className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500 mb-4">暂无评估记录</p>
      <Button>开始评估</Button>
    </CardContent>
  </Card>
)}
```

## 八、对比分析

### 8.1 旧版首页
- 医疗蓝主题
- 顶部欢迎区 + 卡片列表
- 心率、睡眠数据展示
- 情绪趋势图表
- 待办提醒列表

### 8.2 新版首页
- 清新绿主题
- 大尺寸欢迎卡片
- 圆形进度条 + 连续打卡
- 2x2快捷入口网格
- 健康提示 + 评估列表

### 8.3 改进点
1. **视觉冲击力**: 大尺寸绿色欢迎卡片更吸引眼球
2. **信息层级**: 圆形进度条直观展示情绪评分
3. **操作便捷**: 快捷入口网格布局更易点击
4. **友好提示**: 健康提示卡片提供实用建议
5. **激励机制**: 连续打卡天数激励用户坚持

## 九、技术亮点

### 9.1 SVG圆形进度条
- 使用SVG circle元素
- strokeDasharray控制周长
- strokeDashoffset控制进度
- transform -rotate-90旋转起点
- strokeLinecap="round"圆角端点

### 9.2 装饰性背景图案
- 多个圆形叠加
- opacity-10半透明
- absolute定位
- 不同尺寸和位置

### 9.3 动画延迟
- style={{ animationDelay: '0.1s' }}
- 依次出现效果
- 增强视觉层次

### 9.4 类型安全
- TypeScript类型检查
- risk_level数字类型判断
- 避免类型错误

## 十、总结

### 10.1 设计成果
- ✅ 完全按照参考图片重新设计
- ✅ 清新的绿色主题
- ✅ 卡片式布局
- ✅ 圆形进度条
- ✅ 快捷入口网格
- ✅ 健康提示卡片
- ✅ 评估记录列表
- ✅ 流畅的动画效果

### 10.2 用户体验
- 视觉吸引力强
- 信息层级清晰
- 操作便捷高效
- 激励机制完善
- 友好的提示文案

### 10.3 技术实现
- React + TypeScript
- Tailwind CSS
- Lucide React图标
- SVG圆形进度条
- 动画延迟效果

---

**文档版本**: v1.0  
**更新日期**: 2026-01-29  
**设计团队**: 灵愈AI设计团队
