# 我的页面重新设计说明

## 一、设计概述

全新设计的"我的"页面采用现代化的卡片式布局,融合多样化的排版方式(横向、纵向、网格),配合渐变色彩和流畅动画,打造简约大方、美观实用的用户中心界面。

## 二、设计特色

### 2.1 视觉设计

#### 配色方案
- **主色调**: 蓝色渐变 (from-blue-600 via-blue-500 to-cyan-500)
- **辅助色**: 
  - 紫色 (写日记) - from-purple-500 to-purple-600
  - 绿色 (做评估) - from-emerald-500 to-emerald-600
  - 琥珀色 (疗愈中心) - from-amber-500 to-amber-600
  - 玫瑰色 (健康报告) - from-rose-500 to-rose-600
- **背景**: 渐变背景 from-slate-50 via-blue-50 to-purple-50

#### 视觉层次
1. **顶部个人信息卡片**: 蓝色渐变背景,最醒目
2. **快捷操作**: 2x2网格,彩色渐变卡片
3. **功能菜单**: 分组白色卡片,清晰分类
4. **退出登录**: 红色边框按钮,明确操作

### 2.2 排版方式

#### 横向排版
- **个人信息区**: 左侧头像 + 右侧信息(姓名/邮箱/徽章)
- **健康数据**: 3列网格横向排列(情绪评分/连续打卡/评估次数)
- **菜单项**: 左侧图标 + 中间文字 + 右侧箭头

#### 纵向排版
- **页面整体**: 从上到下依次展示各个模块
- **功能分组**: 健康管理 → 应用设置 → 帮助与反馈
- **卡片堆叠**: 各个卡片垂直排列,间距统一

#### 网格排版
- **快捷操作**: 2x2网格布局
- **健康数据**: 1x3网格布局

### 2.3 交互设计

#### 动画效果
- **进入动画**: animate-fade-in-down / animate-fade-in-up
- **延迟动画**: 各模块依次出现 (0.1s, 0.2s, 0.3s...)
- **悬停效果**: hover:shadow-xl 阴影增强
- **过渡动画**: transition-all duration-300 平滑过渡

#### 交互反馈
- **卡片点击**: cursor-pointer + hover:bg-slate-50
- **按钮状态**: disabled状态显示"保存中..."
- **确认对话框**: 退出登录前弹出确认
- **Toast提示**: 操作成功/失败即时反馈

## 三、组件结构

### 3.1 个人信息卡片

**布局**: 横向布局 (flex items-center gap-4)

**组成**:
```tsx
<Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
  <CardContent>
    {/* 上半部分: 头像 + 信息 + 编辑按钮 */}
    <div className="flex items-center gap-4">
      <Avatar /> {/* 左侧 */}
      <div className="flex-1"> {/* 中间 */}
        <h2>姓名</h2>
        <p>邮箱</p>
        <Badge>普通用户</Badge>
      </div>
      <Button /> {/* 右侧编辑按钮 */}
    </div>
    
    {/* 下半部分: 健康数据 */}
    <div className="grid grid-cols-3 gap-3">
      <div>情绪评分</div>
      <div>连续打卡</div>
      <div>评估次数</div>
    </div>
  </CardContent>
</Card>
```

**特点**:
- 渐变背景 + 毛玻璃效果 (backdrop-blur-md)
- 头像边框 (border-4 border-white/30)
- 数据卡片半透明 (bg-white/15)
- 响应式头像大小 (w-20 h-20)

### 3.2 快捷操作

**布局**: 2x2网格 (grid grid-cols-2 gap-3)

**组成**:
```tsx
<div className="grid grid-cols-2 gap-3">
  <Card className="bg-gradient-to-br from-purple-500 to-purple-600">
    <div className="w-12 h-12 rounded-full bg-white/20">
      <Calendar />
    </div>
    <h3>写日记</h3>
    <p>记录今天的心情</p>
  </Card>
  {/* 其他3个卡片 */}
</div>
```

**特点**:
- 每个卡片独立渐变色
- 圆形图标容器 (w-12 h-12 rounded-full)
- 白色半透明背景 (bg-white/20)
- 点击跳转到对应页面

### 3.3 功能菜单

**布局**: 分组列表 (垂直排列)

**组成**:
```tsx
{menuSections.map(section => (
  <div>
    <h3>{section.title}</h3> {/* 分组标题 */}
    <Card>
      {section.items.map(item => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl"> {/* 图标容器 */}
            <item.icon />
          </div>
          <div className="flex-1"> {/* 文字区域 */}
            <div>{item.label}</div>
            <div>{item.value}</div>
          </div>
          <ChevronRight /> {/* 右箭头 */}
        </div>
      ))}
    </Card>
  </div>
))}
```

**特点**:
- 3个分组: 健康管理、应用设置、帮助与反馈
- 每个菜单项: 左图标 + 中文字 + 右箭头
- 分隔线: border-b border-slate-100
- 悬停效果: hover:bg-slate-50

### 3.4 编辑资料对话框

**布局**: 垂直表单

**组成**:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>编辑个人资料</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>姓名</Label>
        <Input />
      </div>
      <div>
        <Label>手机号</Label>
        <Input />
      </div>
      <div>
        <Label>邮箱</Label>
        <Input disabled />
      </div>
    </div>
    <div className="flex gap-3">
      <Button>取消</Button>
      <Button>保存</Button>
    </div>
  </DialogContent>
</Dialog>
```

**特点**:
- 表单字段垂直排列
- 邮箱字段禁用 (不可修改)
- 保存按钮渐变色
- 保存中显示加载状态

## 四、移动端适配

### 4.1 响应式布局

#### 容器宽度
```css
max-w-2xl mx-auto  /* 最大宽度768px,居中显示 */
```

#### 内边距
```css
p-4  /* 移动端16px内边距 */
space-y-4  /* 模块间距16px */
pb-24  /* 底部留白,避免被导航栏遮挡 */
```

#### 网格布局
```css
grid-cols-2  /* 快捷操作2列 */
grid-cols-3  /* 健康数据3列 */
gap-3  /* 网格间距12px */
```

### 4.2 触摸优化

#### 按钮大小
- **最小触摸区域**: 44x44px (符合iOS/Android规范)
- **头像**: w-20 h-20 (80px)
- **图标按钮**: w-10 h-10 (40px)
- **主按钮**: h-12 (48px)

#### 间距优化
- **卡片间距**: gap-3 (12px)
- **元素间距**: gap-4 (16px)
- **内边距**: p-4 (16px)

### 4.3 文字大小

#### 标题
- **主标题**: text-2xl (24px)
- **副标题**: text-sm (14px)
- **分组标题**: text-sm (14px)

#### 正文
- **菜单项**: font-medium (默认16px)
- **辅助文字**: text-xs (12px)
- **数据数字**: text-3xl (30px)

### 4.4 滚动优化

#### 避免横向滚动
```css
min-w-0  /* 允许flex子元素收缩 */
truncate  /* 文字超出省略 */
overflow-hidden  /* 隐藏溢出内容 */
```

#### 纵向滚动流畅
```css
min-h-screen  /* 最小高度100vh */
pb-24  /* 底部留白 */
space-y-4  /* 模块间距 */
```

## 五、数据逻辑

### 5.1 健康数据计算

#### 情绪评分
```typescript
// 取最近7天日记,计算平均分
const scoreMap = { 
  very_bad: 20, 
  bad: 40, 
  neutral: 60, 
  good: 80, 
  very_good: 100 
};
const avgScore = recentDiaries.reduce((sum, d) => 
  sum + (scoreMap[d.emotion_level] || 60), 0
) / recentDiaries.length;
```

#### 连续打卡天数
```typescript
// 从今天开始倒推,检查每天是否有日记
let count = 0;
const today = new Date();
for (let i = 0; i < sortedDiaries.length; i++) {
  const diaryDate = new Date(sortedDiaries[i].diary_date);
  const expectedDate = new Date(today);
  expectedDate.setDate(today.getDate() - count);
  
  if (diaryDate.getTime() === expectedDate.getTime()) {
    count++;
  } else {
    break;
  }
}
```

#### 评估次数
```typescript
// 直接统计assessments数组长度
setAssessmentCount(assessments.length);
```

### 5.2 菜单配置

#### 数据结构
```typescript
interface MenuItem {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}
```

#### 配置示例
```typescript
const menuSections: MenuSection[] = [
  {
    title: '健康管理',
    items: [
      { 
        icon: Calendar, 
        label: '我的日记', 
        value: `${diaryCount}条`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        onClick: () => navigate('/record')
      },
      // ...
    ],
  },
  // ...
];
```

### 5.3 编辑资料

#### 保存流程
```typescript
const handleSaveProfile = async () => {
  setSaving(true);  // 显示加载状态
  try {
    await updateProfile(user.id, {
      full_name: fullName,
      phone: phone,
    });
    await refreshProfile();  // 刷新profile
    setEditDialogOpen(false);  // 关闭对话框
    toast.success('保存成功');
  } catch (error) {
    toast.error('保存失败');
  } finally {
    setSaving(false);
  }
};
```

## 六、动画系统

### 6.1 进入动画

#### 淡入下降
```css
animate-fade-in-down  /* 从上方淡入 */
```

#### 淡入上升
```css
animate-fade-in-up  /* 从下方淡入 */
animationDelay: '0.1s'  /* 延迟动画 */
```

### 6.2 交互动画

#### 悬停效果
```css
hover:shadow-xl  /* 阴影增强 */
hover:bg-slate-50  /* 背景变化 */
transition-all duration-300  /* 平滑过渡 */
```

#### 点击反馈
```css
cursor-pointer  /* 鼠标指针 */
active:scale-95  /* 点击缩小 */
```

### 6.3 加载状态

#### 按钮加载
```tsx
<Button disabled={saving}>
  {saving ? '保存中...' : '保存'}
</Button>
```

## 七、颜色系统

### 7.1 渐变色定义

#### 主卡片
```css
bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500
```

#### 快捷操作
```css
/* 写日记 */
bg-gradient-to-br from-purple-500 to-purple-600

/* 做评估 */
bg-gradient-to-br from-emerald-500 to-emerald-600

/* 疗愈中心 */
bg-gradient-to-br from-amber-500 to-amber-600

/* 健康报告 */
bg-gradient-to-br from-rose-500 to-rose-600
```

### 7.2 功能色定义

#### 健康管理
- 我的日记: text-blue-600 / bg-blue-50
- 评估记录: text-purple-600 / bg-purple-50
- 健康趋势: text-emerald-600 / bg-emerald-50
- 成就徽章: text-amber-600 / bg-amber-50

#### 应用设置
- 统一: text-slate-600 / bg-slate-50

### 7.3 毛玻璃效果

#### 半透明背景
```css
bg-white/15  /* 15%不透明度 */
backdrop-blur-md  /* 中等模糊 */
border border-white/20  /* 半透明边框 */
```

## 八、性能优化

### 8.1 数据加载

#### 并行请求
```typescript
const [assessments, diaries] = await Promise.all([
  getAssessments(user.id, 100),
  getEmotionDiaries(user.id, 100),
]);
```

#### 条件加载
```typescript
useEffect(() => {
  if (user) {  // 仅在用户登录时加载
    loadHealthData();
  }
}, [user]);
```

### 8.2 渲染优化

#### 列表渲染
```typescript
{menuSections.map((section, sectionIndex) => (
  <div key={section.title}>  {/* 使用稳定的key */}
    {section.items.map((item, index) => (
      <div key={item.label}>  {/* 使用唯一标识 */}
        {/* ... */}
      </div>
    ))}
  </div>
))}
```

#### 条件渲染
```typescript
{item.value && (  // 仅在有值时渲染
  <div className="text-xs">{item.value}</div>
)}
```

## 九、可访问性

### 9.1 语义化HTML

#### 标题层级
```tsx
<h2>姓名</h2>  {/* 主标题 */}
<h3>分组标题</h3>  {/* 副标题 */}
```

#### 按钮标签
```tsx
<Button>
  <LogOut className="w-5 h-5 mr-2" />
  退出登录  {/* 明确的文字标签 */}
</Button>
```

### 9.2 表单可访问性

#### Label关联
```tsx
<Label htmlFor="fullName">姓名</Label>
<Input id="fullName" />
```

#### 禁用状态
```tsx
<Input disabled className="bg-slate-50" />
<p className="text-xs">邮箱不可修改</p>  {/* 说明文字 */}
```

### 9.3 颜色对比度

#### 文字对比
- 白色文字 + 蓝色背景: 对比度 > 4.5:1
- 深色文字 + 白色背景: 对比度 > 7:1

#### 图标可见性
- 彩色图标 + 浅色背景: 清晰可见
- 白色图标 + 深色背景: 清晰可见

## 十、测试要点

### 10.1 功能测试

- [ ] 个人信息正确显示
- [ ] 健康数据正确计算
- [ ] 编辑资料保存成功
- [ ] 快捷操作跳转正确
- [ ] 菜单项点击响应
- [ ] 退出登录确认对话框
- [ ] Toast提示正常显示

### 10.2 UI测试

- [ ] 渐变色显示正常
- [ ] 动画效果流畅
- [ ] 悬停效果正常
- [ ] 加载状态显示
- [ ] 对话框打开/关闭
- [ ] 滚动流畅无卡顿

### 10.3 响应式测试

- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad (768px)
- [ ] 横向排版正常
- [ ] 纵向排版正常
- [ ] 网格布局正常

### 10.4 兼容性测试

- [ ] iOS Safari
- [ ] Android Chrome
- [ ] 微信内置浏览器
- [ ] 深色模式
- [ ] 浅色模式

## 十一、总结

### 11.1 设计亮点

1. **多样化排版**: 横向、纵向、网格布局结合
2. **渐变色彩**: 蓝色主题 + 彩色辅助
3. **毛玻璃效果**: 半透明背景 + 模糊效果
4. **流畅动画**: 进入动画 + 悬停效果
5. **移动优先**: 严格适配移动端

### 11.2 技术特点

1. **组件化设计**: 可复用的卡片组件
2. **数据驱动**: 配置化的菜单系统
3. **类型安全**: TypeScript完整类型定义
4. **性能优化**: 并行请求 + 条件渲染
5. **可访问性**: 语义化HTML + 高对比度

### 11.3 用户体验

1. **视觉美观**: 现代化设计风格
2. **操作便捷**: 快捷操作一键直达
3. **信息清晰**: 分组展示,层次分明
4. **反馈及时**: Toast提示 + 加载状态
5. **触摸友好**: 大按钮 + 合理间距

---

**文档版本**: v1.0  
**更新日期**: 2026-01-29  
**开发团队**: 灵愈AI开发团队
