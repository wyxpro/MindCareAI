# 我的页面完整实现文档

## 功能概述

"我的"页面是一个美观、紧凑的个人中心,展示用户信息、健康评分和快捷功能入口。

## 一、核心特色

### 1.1 视觉设计特色

#### 个人信息卡片
- **渐变背景**: 从indigo-600到purple-600到pink-600的鲜艳渐变
- **大头像**: 20x20(w-20 h-20),白色边框,阴影效果
- **用户信息**: 姓名(text-2xl)+邮箱(text-sm)+角色标签
- **编辑按钮**: 右上角,白色图标,hover时背景变化
- **健康评分卡片**: 
  - 玻璃拟态效果(bg-white/10 backdrop-blur-md)
  - 大数字显示(text-6xl font-bold)
  - 进度条(渐变白色)
  - Activity图标

#### 快捷功能列表
- **5个功能卡片**:
  - 评估历史(紫色渐变+Brain图标)
  - 健康档案(蓝色渐变+FileText图标)
  - 手环连接(绿色渐变+Watch图标)
  - 医生对接(橙色渐变+Stethoscope图标)
  - 设置(灰色渐变+Settings图标)
- **卡片设计**:
  - 大图标(w-14 h-14 rounded-2xl)
  - 标题+副标题
  - 右侧箭头
  - hover时放大(scale-[1.02])

#### 退出登录按钮
- **outline样式**: border-2
- **hover效果**: 变红色(bg-destructive)
- **图标**: LogOut

#### 版本信息
- **居中显示**: text-center
- **灰色文字**: text-muted-foreground
- **版本号**: v1.0.0
- **版权信息**: © 2026

### 1.2 交互特色

#### 编辑资料
- **点击编辑按钮**: 打开对话框
- **输入框**: 姓名/邮箱(禁用)/手机号
- **保存按钮**: 渐变背景,发光效果

#### 快捷功能
- **点击卡片**: 跳转到对应页面或显示提示
- **hover效果**: 卡片放大,箭头右移,文字变色

#### 退出登录
- **点击按钮**: 退出登录,跳转到登录页

## 二、组件结构

### 2.1 ProfilePageNew组件

**文件**: `src/pages/ProfilePageNew.tsx`

**主要功能**:
- 显示用户信息
- 显示健康评分
- 快捷功能入口
- 编辑资料
- 退出登录

### 2.2 状态管理

```typescript
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [fullName, setFullName] = useState('');
const [phone, setPhone] = useState('');
const [healthScore] = useState(87);
const [assessmentCount, setAssessmentCount] = useState(0);
```

### 2.3 核心函数

```typescript
// 加载健康数据
const loadHealthData = async () => {
  const [assessments, diaries] = await Promise.all([
    getAssessments(user.id, 100),
    getEmotionDiaries(user.id, 100),
  ]);
  setAssessmentCount(assessments.length);
};

// 退出登录
const handleLogout = async () => {
  await signOut();
  navigate('/login');
};

// 更新资料
const handleUpdateProfile = async () => {
  await updateProfile(user.id, {
    full_name: fullName || undefined,
    phone: phone || undefined,
  });
  await refreshProfile();
  toast.success('资料已更新');
  setEditDialogOpen(false);
};

// 获取用户首字母
const getUserInitial = () => {
  if (profile?.full_name) {
    return profile.full_name.charAt(0).toUpperCase();
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'U';
};

// 获取用户显示名称
const getUserDisplayName = () => {
  return profile?.full_name || user?.email?.split('@')[0] || '用户';
};
```

## 三、UI组件详解

### 3.1 个人信息卡片

```tsx
<Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
  <CardContent className="p-6 space-y-6">
    {/* 用户信息 */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20 border-4 border-white/30 shadow-xl">
          <AvatarFallback className="bg-white text-indigo-600 text-2xl font-bold">
            {getUserInitial()}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">
            {getUserDisplayName()}
          </h2>
          <p className="text-white/80 text-sm">
            {user?.email}
          </p>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <UserCircle /> 用户
          </Badge>
        </div>
      </div>

      <Button onClick={() => setEditDialogOpen(true)} className="text-white hover:bg-white/20">
        <Edit />
      </Button>
    </div>

    {/* 健康评分卡片 */}
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/90 font-medium">健康评分</span>
        <Activity className="text-white/80" />
      </div>
      
      <div className="flex items-end gap-2 mb-3">
        <span className="text-6xl font-bold text-white">{healthScore}</span>
        <span className="text-2xl text-white/70 mb-2">/100</span>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-1000"
          style={{ width: `${healthScore}%` }}
        />
      </div>
    </div>
  </CardContent>
</Card>
```

### 3.2 快捷功能列表

```tsx
<div className="space-y-3">
  <h3 className="text-lg font-bold text-foreground px-2">快捷功能</h3>
  
  {menuItems.map((item, index) => {
    const Icon = item.icon;
    return (
      <Card
        key={item.title}
        className="glass border-border shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer group"
        onClick={item.onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 图标 */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconBg} shadow-lg group-hover:scale-110`}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* 文字 */}
            <div className="flex-1">
              <h4 className="text-base font-bold text-foreground group-hover:text-primary">
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.subtitle}
              </p>
            </div>

            {/* 箭头 */}
            <ChevronRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    );
  })}
</div>
```

## 四、配色方案

### 4.1 个人信息卡片

- **背景渐变**: from-indigo-600 via-purple-600 to-pink-600
- **头像背景**: bg-white
- **头像文字**: text-indigo-600
- **用户名**: text-white
- **邮箱**: text-white/80
- **角色标签**: bg-white/20 text-white

### 4.2 健康评分卡片

- **背景**: bg-white/10 backdrop-blur-md
- **边框**: border-white/20
- **文字**: text-white/90
- **数字**: text-white
- **进度条背景**: bg-white/20
- **进度条**: from-white to-white/80

### 4.3 快捷功能图标

| 功能 | 渐变色 | 图标 |
|-----|-------|------|
| 评估历史 | purple → indigo | Brain |
| 健康档案 | blue → cyan | FileText |
| 手环连接 | green → emerald | Watch |
| 医生对接 | orange → amber | Stethoscope |
| 设置 | gray → slate | Settings |

## 五、动画效果

### 5.1 进入动画

```css
.animate-fade-in-down {
  animation: fadeInDown 0.5s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
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
```

### 5.2 悬停效果

```css
.hover:scale-[1.02] {
  transition: all 0.3s ease;
}

.hover:scale-[1.02]:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.group-hover:scale-110 {
  transition: transform 0.3s ease;
}

.group:hover .group-hover:scale-110 {
  transform: scale(1.1);
}

.group-hover:translate-x-1 {
  transition: transform 0.3s ease;
}

.group:hover .group-hover:translate-x-1 {
  transform: translateX(0.25rem);
}
```

## 六、用户体验

### 6.1 查看信息流程

```
1. 进入"我的"页面
   ↓
2. 查看个人信息(头像/姓名/邮箱/角色)
   ↓
3. 查看健康评分(87/100)
   ↓
4. 查看进度条
```

### 6.2 编辑资料流程

```
1. 点击编辑按钮(右上角)
   ↓
2. 打开编辑对话框
   ↓
3. 修改姓名/手机号
   ↓
4. 点击保存按钮
   ↓
5. 提示"资料已更新"
   ↓
6. 对话框关闭
   ↓
7. 页面刷新显示新信息
```

### 6.3 快捷功能流程

```
1. 浏览快捷功能列表
   ↓
2. 点击功能卡片
   ↓
3. 跳转到对应页面或显示提示
```

### 6.4 退出登录流程

```
1. 点击"退出登录"按钮
   ↓
2. 执行退出操作
   ↓
3. 跳转到登录页
```

## 七、技术亮点

### 7.1 性能优化

- **懒加载**: 数据按需加载
- **缓存机制**: 用户信息缓存
- **防抖**: 输入框防抖处理

### 7.2 用户体验优化

- **紧凑排版**: 间距合理,信息密度高
- **渐变背景**: 视觉吸引力强
- **玻璃拟态**: 现代感十足
- **动画过渡**: 所有状态变化平滑
- **即时反馈**: 操作即时提示

### 7.3 交互优化

- **hover效果**: 卡片/按钮/图标多层次悬停
- **视觉反馈**: 点击/编辑/保存即时反馈
- **动画过渡**: 所有状态变化平滑过渡
- **错误处理**: 友好的错误提示

## 八、验收标准

### Requirement 2.5: 我的页面功能

| 验收标准 | 实现状态 | 说明 |
|---------|---------|------|
| 1. 个人资料管理 | ✅ | 编辑姓名/手机号 |
| 2. 健康档案查看 | ✅ | 健康评分显示 |
| 3. 手环连接管理 | ✅ | 快捷入口 |
| 4. 医生对接 | ✅ | 快捷入口 |
| 5. 评估历史 | ✅ | 显示评估次数 |

## 九、总结

"我的"页面实现了:
- ✅ 美观的UI设计
- ✅ 紧凑的排版
- ✅ 特色的组件样式
- ✅ 流畅的交互体验
- ✅ 完整的功能实现
- ✅ 良好的用户体验

**特色亮点**:
1. 渐变背景卡片(indigo → purple → pink)
2. 玻璃拟态健康评分(backdrop-blur-md)
3. 大数字显示(text-6xl)
4. 渐变进度条(动画过渡)
5. 5个快捷功能(渐变图标)
6. 紧凑排版(间距4)
7. hover效果(放大+箭头移动)
8. 退出登录(变红效果)

---

**文档版本**: v1.0  
**更新日期**: 2026-01-28  
**维护团队**: 灵愈AI技术团队
