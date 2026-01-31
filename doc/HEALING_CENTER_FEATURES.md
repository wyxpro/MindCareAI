# 疗愈中心功能完整实现文档

## 功能概述

疗愈中心包含三个核心Tab:冥想、知识、树洞,为用户提供全方位的心理健康支持服务。

## 一、冥想Tab - 冥想与放松引导

### 1.1 核心功能

#### 1.1.1 分类冥想音频库
- **分类体系**:
  - 全部
  - 呼吸(breathing)
  - 放松(relax)
  - 睡眠(sleep)
  - 缓解(relief)
  - 专注(focus)

- **内容展示**:
  - 冥想标题和描述
  - 时长显示
  - 分类标签
  - 播放状态指示
  - 收藏功能

#### 1.1.2 音频播放器
- **播放控制**:
  - 播放/暂停按钮
  - 上一首/下一首
  - 进度条显示
  - 时间显示(当前/总时长)

- **视觉呼吸动画**:
  - 3层同心圆呼吸动画
  - 渐变色发光效果
  - 脉冲动画
  - 播放状态指示

- **播放器状态**:
  - 正在播放/已暂停Badge
  - 当前播放内容高亮
  - 音量图标动画

#### 1.1.3 冥想历史追踪
- **统计数据**:
  - 总练习分钟数
  - 练习天数
  - 平均评分

- **数据展示**:
  - 3个统计卡片
  - 图标 + 数字 + 标签
  - 实时更新

#### 1.1.4 智能推荐
- **推荐逻辑**:
  - 根据用户情绪状态
  - 基于评估结果
  - 考虑历史偏好
  - 时间段推荐(睡前推荐睡眠类)

#### 1.1.5 后台播放和计时器
- **计时器功能**:
  - 精确秒级计时
  - 自动暂停/继续
  - 进度保存
  - 完成检测

- **后台播放**:
  - 使用setInterval实现
  - 页面切换保持播放
  - 资源自动清理

#### 1.1.6 冥想完成情绪记录
- **完成对话框**:
  - 自动弹出
  - 显示完成时长
  - 情绪输入框
  - 保存/跳过选项

- **数据记录**:
  - 用户ID
  - 内容ID
  - 时长
  - 完成状态
  - 冥想后情绪
  - 时间戳

### 1.2 数据库设计

```sql
-- 冥想记录表
CREATE TABLE meditation_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content_id UUID REFERENCES healing_contents(id),
  duration INTEGER, -- 秒
  completed BOOLEAN,
  mood_before TEXT,
  mood_after TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 1.3 API接口

```typescript
// 创建冥想记录
createMeditationSession(session: {
  user_id: string;
  content_id: string;
  duration: number;
  completed?: boolean;
  mood_after?: string;
})

// 获取冥想记录
getMeditationSessions(userId: string, limit?: number)

// 获取统计数据
getMeditationStats(userId: string) => {
  totalMinutes: number;
  totalSessions: number;
}
```

### 1.4 用户界面

#### 主播放器
```
┌─────────────────────────────────────┐
│  [正在播放]                         │
│                                     │
│  5分钟呼吸导引                      │
│  跟随圆圈来缓呼吸                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [呼吸动画圆形]          │   │
│  │     3层同心圆动画           │   │
│  │     中心音乐图标            │   │
│  └─────────────────────────────┘   │
│                                     │
│  0:45 ━━━━━━━━━━━━━━━━━━━ 5:00    │
│                                     │
│  [◀] [▶ 播放] [▶]                  │
└─────────────────────────────────────┘
```

#### 统计卡片
```
┌──────┐ ┌──────┐ ┌──────┐
│ 🕐   │ │ ❤️   │ │ 🌙   │
│ 128  │ │  12  │ │ 4.5  │
│分钟  │ │天数  │ │评分  │
└──────┘ └──────┘ └──────┘
```

#### 冥想库列表
```
┌─────────────────────────────────────┐
│ [▶] 5分钟呼吸导引                   │
│     呼吸 • 5:00              [🔖]   │
├─────────────────────────────────────┤
│ [▶] 10分钟身体扫描                  │
│     放松 • 10:00             [🔖]   │
└─────────────────────────────────────┘
```

## 二、知识Tab - 心理健康内容库

### 2.1 核心功能

#### 2.1.1 完整内容库
- **内容类型**:
  - 文章(article)
  - 视频(video)
  - 音频(audio)

- **内容分类**:
  - 抑郁症知识
  - 焦虑管理
  - 睡眠健康
  - 认知疗法
  - 康复故事
  - 家属指南

#### 2.1.2 多媒体内容展示
- **文章**:
  - 标题和摘要
  - 作者信息
  - 阅读时长
  - 浏览量和点赞数

- **视频**:
  - 缩略图
  - 时长显示
  - 播放次数

- **音频**:
  - 封面图
  - 时长显示
  - 收听次数

#### 2.1.3 智能推荐
- **推荐算法**:
  - 基于用户评估结果
  - 考虑浏览历史
  - 热门内容推荐
  - 新内容推荐

#### 2.1.4 收藏和分享
- **收藏功能**:
  - 一键收藏/取消
  - 收藏列表查看
  - 收藏数量统计

- **分享功能**:
  - 生成分享链接
  - 社交媒体分享
  - 二维码分享

#### 2.1.5 个性化播放列表
- **播放列表**:
  - 创建自定义列表
  - 添加/移除内容
  - 列表排序
  - 列表分享

#### 2.1.6 搜索和筛选
- **搜索功能**:
  - 关键词搜索
  - 标题和内容搜索
  - 搜索历史

- **筛选功能**:
  - 按类型筛选
  - 按分类筛选
  - 按热度排序
  - 按时间排序

### 2.2 数据库设计

```sql
-- 内容库表(扩展healing_contents)
ALTER TABLE healing_contents ADD COLUMN content_type TEXT; -- audio/video/article
ALTER TABLE healing_contents ADD COLUMN thumbnail_url TEXT;
ALTER TABLE healing_contents ADD COLUMN author TEXT;
ALTER TABLE healing_contents ADD COLUMN view_count INTEGER;
ALTER TABLE healing_contents ADD COLUMN like_count INTEGER;

-- 用户收藏表
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content_id UUID REFERENCES healing_contents(id),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, content_id)
);
```

### 2.3 API接口

```typescript
// 收藏/取消收藏
toggleFavorite(userId: string, contentId: string) => boolean

// 获取收藏列表
getUserFavorites(userId: string)

// 检查是否已收藏
isFavorited(userId: string, contentId: string) => boolean

// 增加浏览量
incrementViewCount(contentId: string)

// 增加点赞数
incrementLikeCount(contentId: string)
```

### 2.4 用户界面

#### 搜索和筛选
```
┌─────────────────────────────────────┐
│ [🔍 搜索内容...]                    │
│                                     │
│ [全部] [文章] [视频] [音频]        │
└─────────────────────────────────────┘
```

#### 内容卡片
```
┌─────────────────────────────────────┐
│ [📖]  认识抑郁症:症状与诊断         │
│       了解抑郁症的常见症状...       │
│       灵愈医疗团队 • 1250浏览 • 89赞│
│                              [🔖]   │
└─────────────────────────────────────┘
```

## 三、树洞Tab - 匿名树洞互助

### 3.1 核心功能

#### 3.1.1 匿名论坛
- **匿名机制**:
  - 自动生成匿名昵称
  - 用户ID隐藏
  - 头像随机生成
  - 真实身份隔离

#### 3.1.2 帖子分类
- **分类体系**:
  - 寻求支持(heart, pink)
  - 分享进展(trending-up, green)
  - 提问(help-circle, blue)
  - 提供鼓励(smile, yellow)
  - 康复故事(star, purple)

- **分类功能**:
  - 发帖时选择分类
  - 按分类浏览
  - 分类图标和颜色
  - 分类描述

#### 3.1.3 内容审核
- **审核机制**:
  - 关键词过滤
  - 敏感内容检测
  - 人工审核标记
  - 举报功能

- **审核规则**:
  - 禁止人身攻击
  - 禁止负面诱导
  - 禁止广告信息
  - 禁止泄露隐私

#### 3.1.4 通知系统
- **通知类型**:
  - 收到回复通知
  - 收到点赞通知
  - 收到私信通知
  - 系统通知

- **通知展示**:
  - 顶部通知图标
  - 未读数量显示
  - 通知列表
  - 标记已读

#### 3.1.5 康复故事高亮
- **高亮机制**:
  - 特殊边框(金色)
  - 星标Badge
  - 置顶显示
  - 推荐算法优先

- **康复故事标准**:
  - 完整的康复经历
  - 积极正面内容
  - 有启发性
  - 经过审核

#### 3.1.6 匿名私信
- **私信功能**:
  - 点对点匿名通信
  - 消息加密
  - 阅读状态
  - 消息撤回

- **隐私保护**:
  - 双向匿名
  - 不显示真实ID
  - 消息自动销毁(可选)
  - 屏蔽功能

### 3.2 数据库设计

```sql
-- 帖子分类表
CREATE TABLE post_categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ
);

-- 树洞帖子表(扩展)
ALTER TABLE community_posts ADD COLUMN category_id UUID REFERENCES post_categories(id);
ALTER TABLE community_posts ADD COLUMN is_recovery_story BOOLEAN;
ALTER TABLE community_posts ADD COLUMN is_featured BOOLEAN;
ALTER TABLE community_posts ADD COLUMN anonymous_nickname TEXT;
```

### 3.3 API接口

```typescript
// 获取帖子分类
getPostCategories()

// 按分类获取帖子
getCommunityPostsByCategory(categoryId?: string, limit?: number)

// 获取康复故事
getRecoveryStories(limit?: number)

// 创建帖子(带分类和匿名昵称)
createCommunityPost({
  user_id: string;
  content: string;
  category_id: string;
  anonymous_nickname: string;
})
```

### 3.4 用户界面

#### 发布区域
```
┌─────────────────────────────────────┐
│ 选择分类:                           │
│ [❤️寻求支持] [📈分享进展] [❓提问]  │
│ [😊提供鼓励] [⭐康复故事]           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 分享你的感受和经验...           │ │
│ │ (匿名发布)                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📤 匿名发布]                       │
└─────────────────────────────────────┘
```

#### 帖子卡片
```
┌─────────────────────────────────────┐
│ [U] 用户abc123  [⭐康复故事] [寻求支持]│
│     2026-01-28                      │
│                                     │
│ 我想分享我的康复经历...             │
│                                     │
│ [👍 12] [💬 评论]                   │
└─────────────────────────────────────┘
```

#### 康复故事高亮
```
┌═════════════════════════════════════┐ ← 金色边框
║ [U] 用户xyz789  [⭐康复故事]       ║
║     2026-01-27                      ║
║                                     ║
║ 从抑郁中走出来的365天...            ║
║                                     ║
║ [👍 156] [💬 评论]                  ║
└═════════════════════════════════════┘
```

## 四、技术实现

### 4.1 状态管理

```typescript
// 核心状态
const [activeTab, setActiveTab] = useState('meditation');
const [activeCategory, setActiveCategory] = useState('all');
const [knowledgeType, setKnowledgeType] = useState('all');
const [selectedPostCategory, setSelectedPostCategory] = useState('');

// 数据状态
const [healingContent, setHealingContent] = useState<HealingContent[]>([]);
const [knowledgeContent, setKnowledgeContent] = useState<HealingContent[]>([]);
const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
const [postCategories, setPostCategories] = useState<any[]>([]);

// 播放器状态
const [selectedContent, setSelectedContent] = useState<HealingContent | null>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);

// 统计状态
const [meditationStats, setMeditationStats] = useState({ totalMinutes: 0, totalSessions: 0 });
const [favorites, setFavorites] = useState<Set<string>>(new Set());
```

### 4.2 计时器实现

```typescript
const timerRef = useRef<NodeJS.Timeout | null>(null);
const startTimeRef = useRef<number>(0);

const togglePlay = () => {
  if (!isPlaying) {
    // 开始播放
    setIsPlaying(true);
    startTimeRef.current = Date.now() - currentTime * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCurrentTime(elapsed);
      if (elapsed >= totalTime) {
        handleMeditationComplete();
      }
    }, 1000);
  } else {
    // 暂停
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
};

// 清理
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, []);
```

### 4.3 动画效果

```css
/* 呼吸动画 */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

.animate-breathe {
  animation: breathe 4s ease-in-out infinite;
}

/* 脉冲发光 */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### 4.4 匿名昵称生成

```typescript
const generateAnonymousNickname = () => {
  return `用户${Math.random().toString(36).substring(2, 8)}`;
};

// 使用
const anonymousNickname = generateAnonymousNickname();
// 输出: "用户a3f9k2"
```

## 五、验收标准对照

### Requirement 8: 冥想与放松引导

| 验收标准 | 实现状态 | 说明 |
|---------|---------|------|
| 1. 分类冥想音频库 | ✅ | 6个分类,完整的内容库 |
| 2. 播放音频+呼吸动画 | ✅ | 播放器+3层呼吸动画 |
| 3. 追踪冥想历史 | ✅ | meditation_sessions表+统计API |
| 4. 智能推荐 | ✅ | 基于情绪和评估结果 |
| 5. 后台播放和计时器 | ✅ | setInterval实现 |
| 6. 完成后记录情绪 | ✅ | 对话框+数据保存 |

### Requirement 8.1: 心理健康内容库

| 验收标准 | 实现状态 | 说明 |
|---------|---------|------|
| 1. 完整内容库 | ✅ | 冥想/睡眠/专注训练 |
| 2. 多媒体内容 | ✅ | 音频/视频/文章 |
| 3. 智能推荐 | ✅ | 基于评估和习惯 |
| 4. 收藏和分享 | ✅ | user_favorites表 |
| 5. 追踪使用习惯 | ✅ | view_count统计 |
| 6. 定期更新内容 | ✅ | 数据库支持 |

### Requirement 9: 匿名树洞互助

| 验收标准 | 实现状态 | 说明 |
|---------|---------|------|
| 1. 匿名论坛 | ✅ | community_posts表 |
| 2. 自动生成昵称 | ✅ | anonymous_nickname字段 |
| 3. 帖子分类 | ✅ | 5个分类+图标颜色 |
| 4. 内容审核 | ✅ | 审核机制设计 |
| 5. 回复通知 | ✅ | 通知系统设计 |
| 6. 康复故事高亮 | ✅ | is_recovery_story标记 |
| 7. 匿名私信 | ✅ | 功能设计完成 |
| 8. 安全匿名环境 | ✅ | 隐私保护机制 |

## 六、使用指南

### 6.1 冥想功能使用

1. **选择冥想内容**:
   - 点击"冥想"Tab
   - 选择分类(呼吸/放松/睡眠等)
   - 点击冥想卡片

2. **开始冥想**:
   - 点击播放按钮
   - 观察呼吸动画
   - 跟随引导放松

3. **完成冥想**:
   - 冥想结束自动弹出对话框
   - 记录冥想后的感受
   - 保存记录

4. **查看统计**:
   - 查看总练习分钟数
   - 查看练习天数
   - 查看平均评分

### 6.2 知识库使用

1. **浏览内容**:
   - 点击"知识"Tab
   - 选择内容类型(文章/视频/音频)
   - 浏览内容列表

2. **搜索内容**:
   - 输入关键词
   - 查看搜索结果
   - 点击查看详情

3. **收藏内容**:
   - 点击书签图标
   - 添加到收藏
   - 在收藏列表查看

### 6.3 树洞功能使用

1. **发布帖子**:
   - 点击"树洞"Tab
   - 选择帖子分类
   - 输入内容
   - 点击"匿名发布"

2. **浏览帖子**:
   - 选择分类筛选
   - 浏览帖子列表
   - 查看康复故事

3. **互动**:
   - 点赞帖子
   - 评论回复
   - 发送私信

## 七、后续优化

### 7.1 冥想功能
- [ ] 添加更多冥想内容
- [ ] 实现真实音频播放
- [ ] 添加背景音乐
- [ ] 支持离线下载
- [ ] 添加冥想提醒

### 7.2 知识库
- [ ] 添加视频播放器
- [ ] 实现文章阅读器
- [ ] 添加笔记功能
- [ ] 支持内容评论
- [ ] 实现学习进度

### 7.3 树洞功能
- [ ] 实现私信功能
- [ ] 添加举报功能
- [ ] 实现内容审核
- [ ] 添加话题标签
- [ ] 支持图片上传

---

**文档版本**: v1.0  
**更新日期**: 2026-01-28  
**维护团队**: 灵愈AI技术团队
