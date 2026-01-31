# 随手记功能增强说明

## 一、功能概述

在原有随手记功能基础上,新增多模态输入支持(文本、语音、图片)和日历集成功能,实现完整的日记记录与管理系统。

## 二、核心功能

### 2.1 多模态输入

#### 文本输入
- **组件**: Textarea
- **特点**: 
  - 大尺寸输入框 (min-h-[120px])
  - 无边框设计 (border-0)
  - 占位符提示 "写下点什么..."
  - 实时保存输入内容

#### 语音输入
- **实现**: MediaRecorder API + speech-recognition Edge Function
- **流程**:
  1. 点击"语音"按钮开始录音
  2. 录音中显示脉动动画 (animate-pulse)
  3. 点击"停止"结束录音
  4. 自动转换webm→wav格式
  5. 调用语音识别API
  6. 识别结果追加到文本框
- **限制**: 
  - 最长60秒
  - 16000Hz采样率
  - 16bit位深

#### 图片上传
- **实现**: Supabase Storage + 文件选择器
- **支持方式**:
  - 从相册选择 (multiple)
  - 直接拍照 (accept="image/*")
- **限制**:
  - 单张最大5MB
  - 支持格式: JPEG, PNG, GIF, WebP
- **预览**: 3列网格布局,悬停显示删除按钮

### 2.2 日历集成

#### 日历视图
- **组件**: shadcn/ui Calendar
- **特点**:
  - 中文本地化 (zhCN)
  - 有记录的日期高亮显示 (绿色背景)
  - 禁用未来日期
  - 点击日期查看记录

#### 日期标记
- **实现**: modifiers + modifiersStyles
- **样式**:
  ```tsx
  modifiers={{
    hasRecord: getDiaryDates(),
  }}
  modifiersStyles={{
    hasRecord: {
      backgroundColor: 'rgb(16 185 129 / 0.2)',
      color: 'rgb(5 150 105)',
      fontWeight: 'bold',
    },
  }}
  ```

### 2.3 记录详情弹窗

#### 弹窗组件 (NoteDetailDialog)
- **显示内容**:
  - 日期 + 情绪标签
  - 标题 (如果有)
  - 文本内容
  - 图片网格 (2列)
  - 标签列表
  - AI分析结果
  - 创建/更新时间

#### 编辑功能
- **流程**:
  1. 点击"编辑"按钮
  2. 文本内容变为可编辑
  3. 修改后点击"保存"
  4. 自动刷新列表

#### 删除功能
- **流程**:
  1. 点击"删除"按钮
  2. 确认对话框
  3. 删除记录
  4. 关闭弹窗并刷新

### 2.4 最近记录列表

#### 列表展示
- **布局**: 卡片式列表
- **内容**:
  - 日期 (月日)
  - 图片数量徽章
  - 文本预览 (最多2行)
  - 缩略图 (如果有图片)
- **交互**: 点击卡片打开详情弹窗

#### 加载状态
- **骨架屏**: animate-pulse
- **空状态**: 图标 + 提示文字

## 三、数据库设计

### 3.1 Schema更新

```sql
ALTER TABLE emotion_diaries 
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS voice_url TEXT;
```

**字段说明**:
- `image_urls`: 图片URL数组,存储多张图片
- `voice_url`: 语音文件URL (预留字段)

### 3.2 Storage Bucket

**Bucket配置**:
- 名称: `diary-images`
- 公开访问: true
- 文件大小限制: 5MB
- 允许类型: JPEG, PNG, GIF, WebP

**访问策略**:
- 认证用户可上传
- 所有人可查看
- 用户可删除自己的图片

## 四、组件架构

### 4.1 QuickNote组件

**文件**: `src/components/record/QuickNote.tsx`

**Props**:
```typescript
interface QuickNoteProps {
  onSave: (data: {
    content: string;
    imageUrls: string[];
    voiceUrl?: string;
  }) => Promise<void>;
  initialContent?: string;
  initialImages?: string[];
}
```

**状态管理**:
- `content`: 文本内容
- `imageUrls`: 图片URL数组
- `isRecording`: 录音状态
- `isProcessing`: 处理状态
- `isSaving`: 保存状态

**核心方法**:
- `startRecording()`: 开始录音
- `stopRecording()`: 停止录音
- `processAudio()`: 处理音频并识别
- `handleImageSelect()`: 处理图片上传
- `removeImage()`: 删除图片
- `handleSave()`: 保存记录

### 4.2 NoteDetailDialog组件

**文件**: `src/components/record/NoteDetailDialog.tsx`

**Props**:
```typescript
interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diary: EmotionDiary | null;
  onUpdate: (id: string, data: Partial<EmotionDiary>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
```

**状态管理**:
- `isEditing`: 编辑模式
- `editContent`: 编辑内容
- `isUpdating`: 更新状态
- `isDeleting`: 删除状态

**核心方法**:
- `handleStartEdit()`: 开始编辑
- `handleCancelEdit()`: 取消编辑
- `handleSaveEdit()`: 保存编辑
- `handleDelete()`: 删除记录

### 4.3 RecordPageEnhanced页面

**文件**: `src/pages/RecordPageEnhanced.tsx`

**状态管理**:
- `diaries`: 日记列表
- `selectedDate`: 选中日期
- `selectedDiary`: 选中日记
- `dialogOpen`: 弹窗状态

**核心方法**:
- `loadDiaries()`: 加载日记列表
- `handleQuickNoteSave()`: 保存快速记录
- `handleUpdateDiary()`: 更新日记
- `handleDeleteDiary()`: 删除日记
- `getDiaryDates()`: 获取有记录的日期
- `hasRecordOnDate()`: 检查日期是否有记录
- `handleDateSelect()`: 处理日期选择
- `getMonthStats()`: 获取当月统计

## 五、技术实现

### 5.1 语音识别

**流程**:
```typescript
// 1. 录音
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

// 2. 转换格式
const wavBlob = await convertWebmToWav(audioBlob);

// 3. 转base64
const reader = new FileReader();
reader.readAsDataURL(wavBlob);
const base64Data = reader.result.split(',')[1];

// 4. 调用API
const { data } = await supabase.functions.invoke('speech-recognition', {
  body: {
    format: 'wav',
    rate: 16000,
    cuid: 'lingyu-ai-user',
    speech: base64Data,
    len: wavBlob.size,
  },
});

// 5. 显示结果
if (data.err_no === 0 && data.result.length > 0) {
  const recognizedText = data.result[0];
  setContent(prev => prev ? `${prev}\n${recognizedText}` : recognizedText);
}
```

### 5.2 图片上传

**流程**:
```typescript
// 1. 选择文件
<input type="file" accept="image/*" multiple onChange={handleImageSelect} />

// 2. 验证文件
if (file.size > 5 * 1024 * 1024) {
  toast.error('图片超过5MB限制');
  return;
}

// 3. 上传到Storage
const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
const filePath = `diary-images/${fileName}`;

const { data } = await supabase.storage
  .from('diary-images')
  .upload(filePath, file);

// 4. 获取公开URL
const { data: urlData } = supabase.storage
  .from('diary-images')
  .getPublicUrl(filePath);

// 5. 保存URL
setImageUrls(prev => [...prev, urlData.publicUrl]);
```

### 5.3 日历标记

**实现**:
```typescript
// 1. 获取有记录的日期
const getDiaryDates = () => {
  return diaries.map(diary => new Date(diary.diary_date));
};

// 2. 配置modifiers
<Calendar
  modifiers={{
    hasRecord: getDiaryDates(),
  }}
  modifiersStyles={{
    hasRecord: {
      backgroundColor: 'rgb(16 185 129 / 0.2)',
      color: 'rgb(5 150 105)',
      fontWeight: 'bold',
    },
  }}
/>

// 3. 点击日期
const handleDateSelect = (date: Date | undefined) => {
  const dateStr = date.toISOString().split('T')[0];
  const diaryOnDate = diaries.find(diary => diary.diary_date === dateStr);
  
  if (diaryOnDate) {
    setSelectedDiary(diaryOnDate);
    setDialogOpen(true);
  }
};
```

## 六、用户体验优化

### 6.1 视觉反馈

**录音状态**:
- 录音中: 红色文字 + 脉动动画
- 处理中: 加载图标 + "处理中..."徽章
- 完成: 成功提示

**图片上传**:
- 上传中: 加载图标
- 成功: 显示预览
- 失败: 错误提示

**保存状态**:
- 保存中: 按钮禁用 + "保存中..."
- 成功: 成功提示 + 清空表单
- 失败: 错误提示

### 6.2 交互优化

**图片预览**:
- 3列网格布局
- 悬停显示删除按钮
- 点击图片放大查看

**日历交互**:
- 有记录的日期绿色高亮
- 禁用未来日期
- 点击日期打开详情

**弹窗动画**:
- 淡入淡出效果
- 平滑过渡
- 点击遮罩关闭

### 6.3 错误处理

**语音识别**:
- 无法访问麦克风: 提示用户授权
- 识别失败: 显示错误信息
- 无法识别内容: 提示重新录音

**图片上传**:
- 文件过大: 提示大小限制
- 格式错误: 提示支持的格式
- 上传失败: 显示错误原因

**保存失败**:
- 网络错误: 提示检查网络
- 权限错误: 提示登录状态
- 其他错误: 显示具体原因

## 七、性能优化

### 7.1 图片优化

**上传优化**:
- 限制单张大小5MB
- 支持批量上传
- 异步上传不阻塞UI

**显示优化**:
- 使用缩略图
- 懒加载图片
- 点击查看原图

### 7.2 数据加载

**分页加载**:
- 最近记录显示前10条
- 日历加载最近100条
- 按需加载更多

**缓存策略**:
- 列表数据缓存
- 图片URL缓存
- 减少重复请求

### 7.3 音频处理

**格式转换**:
- 使用Web Worker (如果可用)
- 异步处理不阻塞UI
- 显示处理进度

**内存管理**:
- 及时释放MediaStream
- 清理音频Blob
- 避免内存泄漏

## 八、API接口

### 8.1 数据库操作

**创建日记**:
```typescript
await createEmotionDiary({
  user_id: user.id,
  diary_date: '2026-01-29',
  emotion_level: 'neutral',
  content: '今天天气不错',
  image_urls: ['https://...', 'https://...'],
  voice_url: 'https://...',
});
```

**更新日记**:
```typescript
await updateEmotionDiary(diaryId, {
  content: '更新后的内容',
});
```

**删除日记**:
```typescript
await deleteEmotionDiary(diaryId);
```

**查询日记**:
```typescript
const diaries = await getEmotionDiaries(userId, 100);
```

### 8.2 Edge Functions

**语音识别**:
```typescript
const { data } = await supabase.functions.invoke('speech-recognition', {
  body: {
    format: 'wav',
    rate: 16000,
    cuid: 'lingyu-ai-user',
    speech: base64Data,
    len: wavBlob.size,
  },
});
```

### 8.3 Storage操作

**上传图片**:
```typescript
const { data } = await supabase.storage
  .from('diary-images')
  .upload(filePath, file);
```

**获取URL**:
```typescript
const { data } = supabase.storage
  .from('diary-images')
  .getPublicUrl(filePath);
```

**删除图片**:
```typescript
await supabase.storage
  .from('diary-images')
  .remove([filePath]);
```

## 九、测试要点

### 9.1 功能测试

**文本输入**:
- [ ] 输入文本并保存
- [ ] 输入空文本提示错误
- [ ] 输入长文本正常显示

**语音输入**:
- [ ] 开始录音显示状态
- [ ] 停止录音自动识别
- [ ] 识别结果追加到文本
- [ ] 识别失败显示错误

**图片上传**:
- [ ] 选择单张图片上传
- [ ] 选择多张图片批量上传
- [ ] 上传超大图片提示错误
- [ ] 删除图片正常工作

**日历集成**:
- [ ] 有记录的日期高亮显示
- [ ] 点击日期打开详情
- [ ] 未来日期禁用
- [ ] 无记录日期点击无反应

**详情弹窗**:
- [ ] 显示完整信息
- [ ] 编辑功能正常
- [ ] 删除功能正常
- [ ] 图片点击放大

### 9.2 兼容性测试

**浏览器**:
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

**设备**:
- [ ] iOS
- [ ] Android
- [ ] Desktop

**功能**:
- [ ] 麦克风权限
- [ ] 文件选择器
- [ ] 相机拍照

### 9.3 性能测试

**加载性能**:
- [ ] 首次加载时间 < 2s
- [ ] 列表滚动流畅
- [ ] 图片加载不卡顿

**上传性能**:
- [ ] 单张图片上传 < 3s
- [ ] 批量上传不阻塞UI
- [ ] 语音识别 < 5s

**内存占用**:
- [ ] 长时间使用无内存泄漏
- [ ] 图片预览内存可控
- [ ] 音频处理后释放资源

## 十、总结

### 10.1 功能亮点

1. **多模态输入**: 支持文本、语音、图片三种输入方式
2. **日历集成**: 直观展示记录分布,点击查看详情
3. **实时反馈**: 录音、上传、保存全程状态提示
4. **编辑管理**: 支持查看、编辑、删除记录
5. **美观界面**: 清新绿色主题,卡片式布局

### 10.2 技术特点

1. **组件化设计**: QuickNote、NoteDetailDialog独立组件
2. **类型安全**: TypeScript完整类型定义
3. **错误处理**: 完善的错误提示和异常处理
4. **性能优化**: 图片懒加载、数据分页、异步处理
5. **用户体验**: 流畅动画、即时反馈、友好提示

### 10.3 未来扩展

1. **AI分析**: 自动分析日记内容,提供情绪洞察
2. **标签系统**: 支持添加和管理标签
3. **搜索功能**: 按关键词、日期、标签搜索
4. **导出功能**: 导出为PDF、Markdown等格式
5. **分享功能**: 分享到社交平台

---

**文档版本**: v1.0  
**更新日期**: 2026-01-29  
**开发团队**: 灵愈AI开发团队
