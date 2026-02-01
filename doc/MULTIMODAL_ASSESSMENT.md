# 评估页面多模态功能完整实现文档

## 功能概述

评估页面集成了图片上传、语音识别、摄像头表情识别三大多模态输入功能,通过调用文心AI大模型进行智能分析。

## 一、核心功能

### 1.1 图片上传与情绪分析

**功能描述**:
- 用户上传图片(支持JPG/PNG/BMP,最大10MB)
- 使用多模态理解大模型分析图片中的情绪表现
- 识别面部表情、肢体语言、环境氛围
- 给出专业的情绪评估和抑郁风险分析

**技术实现**:
- Edge Function: `multimodal-chat`
- API: 文心一言多模态输入大模型
- 流式响应处理

**交互流程**:
```
1. 点击"图片"按钮
   ↓
2. 选择图片文件
   ↓
3. 显示"[已上传图片进行情绪分析]"
   ↓
4. 调用multimodal-chat分析
   ↓
5. 流式显示AI分析结果
   ↓
6. 保存到评估记录
```

### 1.2 语音录制与识别

**功能描述**:
- 录制用户语音(最长60秒)
- 自动转换webm为wav格式(16000Hz采样率)
- 使用短语音识别API转换为文字
- 使用文本大模型进行情绪分析

**技术实现**:
- Edge Function: `speech-recognition` + `text-chat`
- API: 短语音识别标准版 + 文心文本生成大模型
- 音频格式转换: webm → wav (16bit PCM, 单声道, 16000Hz)

**交互流程**:
```
1. 点击"语音"按钮开始录音
   ↓
2. 显示录音状态(红色图标)
   ↓
3. 点击停止录音
   ↓
4. 转换webm为wav格式
   ↓
5. 调用speech-recognition识别
   ↓
6. 显示"[语音识别: 文字内容]"
   ↓
7. 调用text-chat分析情绪
   ↓
8. 流式显示AI分析结果
```

### 1.3 摄像头表情识别

**功能描述**:
- 打开摄像头实时预览
- 拍摄用户面部照片
- 使用多模态理解大模型分析面部表情
- 识别情绪状态和抑郁风险

**技术实现**:
- 组件: `EmotionCamera`
- Edge Function: `multimodal-chat`
- API: 文心一言多模态输入大模型

**交互流程**:
```
1. 点击"摄像头"按钮
   ↓
2. 请求摄像头权限
   ↓
3. 显示实时预览
   ↓
4. 点击拍照按钮
   ↓
5. 捕获图片并转为base64
   ↓
6. 调用multimodal-chat分析
   ↓
7. 显示AI分析结果
   ↓
8. 关闭摄像头
```

## 二、Edge Functions实现

### 2.1 text-chat (文本对话)

**文件**: `supabase/functions/text-chat/index.ts`

**功能**: 调用文心文本生成大模型进行对话

**请求参数**:
```typescript
{
  messages: [
    {
      role: 'system' | 'user' | 'assistant',
      content: string
    }
  ]
}
```

**响应格式**: SSE流式响应
```
data: {"id":"as-xxx","choices":[{"index":0,"delta":{"role":"assistant","content":"文字"},"finish_reason":null,"flag":0}]}
```

**关键代码**:
```typescript
const response = await fetch(
  'https://app-97zabxvzebcx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages }),
  }
);

return new Response(response.body, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

### 2.2 multimodal-chat (多模态对话)

**文件**: `supabase/functions/multimodal-chat/index.ts`

**功能**: 调用文心一言多模态输入大模型分析图片

**请求参数**:
```typescript
{
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '分析这张图片' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
      ]
    }
  ]
}
```

**响应格式**: SSE流式响应

**关键代码**:
```typescript
const response = await fetch(
  'https://app-97zabxvzebcx-api-k93RZBjPykEa-gateway.appmiaoda.com/v2/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages }),
  }
);
```

### 2.3 speech-recognition (语音识别)

**文件**: `supabase/functions/speech-recognition/index.ts`

**功能**: 调用短语音识别API转换语音为文字

**请求参数**（multipart/form-data）:
- `file`: 音频文件
- `format`: wav | m4a（可选）
- `language`: zh 等（可选）

**响应格式**: JSON
```json
{
  "text": "识别的文字",
  "corpus_no": "6433214037620997779",
  "sn": "371191073711497849365"
}
```

**说明**：当前语音识别已迁移到 NestJS 后端 `/api/v1/ai/speech-recognition`，使用文件上传方式对接 StepFun `audio/transcriptions`。

## 三、前端实现

### 3.1 音频转换工具

**文件**: `src/utils/audio.ts`

**功能**:
- webm转wav格式
- Blob转Base64
- 图片转Base64
- 摄像头捕获图片

**关键函数**:

```typescript
// webm转wav (16000Hz, 16bit PCM, 单声道)
export async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const wav = audioBufferToWav(audioBuffer);
  return new Blob([wav], { type: 'audio/wav' });
}

// Blob转Base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### 3.2 SSE流式请求工具

**文件**: `src/utils/sse.ts`

**功能**:
- 处理Server-Sent Events流式响应
- 解析事件数据
- 错误处理和中断处理

**关键函数**:

```typescript
export const sendStreamRequest = async (options: StreamRequestOptions): Promise<void> => {
  const sseHook = createSSEHook({
    onData: options.onData,
    onCompleted: (error?: Error) => {
      if (error) {
        options.onError(error);
      } else {
        options.onComplete();
      }
    },
    onAborted: () => {
      console.log('请求已中断');
    }
  });

  await ky.post(options.functionUrl, {
    json: options.requestBody,
    headers: {
      'Authorization': `Bearer ${options.supabaseAnonKey}`,
      'apikey': options.supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    signal: options.signal,
    hooks: {
      afterResponse: [sseHook]
    }
  });
};
```

### 3.3 评估页面更新

**文件**: `src/pages/EnhancedAssessmentPage.tsx`

**更新内容**:

1. **导入新工具**:
```typescript
import { supabase } from '@/db/supabase';
import { convertWebmToWav, blobToBase64 } from '@/utils/audio';
```

2. **图片上传处理**:
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // 读取图片为base64
  const base64 = await readFileAsBase64(file);
  
  // 调用multimodal-chat
  const { data, error } = await supabase.functions.invoke('multimodal-chat', {
    body: {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '请分析这张图片中的情绪表现...' },
            { type: 'image_url', image_url: { url: base64 } },
          ],
        },
      ],
    },
  });
  
  // 解析流式响应
  const analysis = await parseStreamResponse(data);
  
  // 显示AI分析结果
  setMessages(prev => [...prev, { role: 'assistant', content: analysis }]);
};
```

3. **语音录制处理**:
```typescript
const handleStartRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    }
  });
  
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm',
  });
  
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    await processAudioRecording(audioBlob);
  };
  
  mediaRecorder.start();
  setIsRecording(true);
};

const processAudioRecording = async (audioBlob: Blob) => {
  // 转换webm为wav
  const wavBlob = await convertWebmToWav(audioBlob);
  
  // 通过 NestJS 后端上传文件进行语音识别
  const formData = new FormData();
  formData.append('file', wavBlob, 'audio.wav');
  formData.append('format', 'wav');
  formData.append('language', 'zh');

  const response = await fetch('/api/v1/ai/speech-recognition', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  const recognizedText = data?.text;
  
  // 调用text-chat分析
  const chatResponse = await fetch('/api/v1/ai/text-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: '你是灵愈AI助手...' },
        ...messages,
        { role: 'user', content: recognizedText },
      ],
    }),
  });
  const chatData = await chatResponse.json();
  
  // 解析流式响应
  const aiResponse = await parseStreamResponse(chatData);
  
  // 显示结果
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: `[语音识别: ${recognizedText}]\n\n${aiResponse}`,
  }]);
};
```

4. **流式响应解析**:
```typescript
const parseStreamResponse = async (data: any): Promise<string> => {
  let result = '';
  const reader = data.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6));
          const content = json.choices?.[0]?.delta?.content || '';
          result += content;
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
  
  return result;
};
```

## 四、UI界面

### 4.1 输入区域

```tsx
<div className="flex gap-2">
  {/* 图片上传 */}
  <Button
    variant="outline"
    size="icon"
    onClick={() => fileInputRef.current?.click()}
    disabled={loading}
  >
    <ImageIcon className="w-5 h-5" />
  </Button>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleImageUpload}
  />

  {/* 语音录制 */}
  <Button
    variant="outline"
    size="icon"
    onClick={isRecording ? handleStopRecording : handleStartRecording}
    disabled={loading}
    className={isRecording ? 'text-red-500' : ''}
  >
    {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
  </Button>

  {/* 摄像头 */}
  <Button
    variant="outline"
    size="icon"
    onClick={handleOpenCamera}
    disabled={loading}
  >
    <Camera className="w-5 h-5" />
  </Button>
</div>
```

### 4.2 进度条

```tsx
{analysisProgress > 0 && (
  <div className="space-y-2">
    <Progress value={analysisProgress} className="h-2" />
    <p className="text-sm text-muted-foreground text-center">
      分析中... {analysisProgress}%
    </p>
  </div>
)}
```

### 4.3 消息显示

```tsx
{messages.map((message, index) => (
  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] rounded-2xl p-4 ${
      message.role === 'user'
        ? 'bg-gradient-to-r from-primary to-info text-white'
        : 'bg-muted text-foreground'
    }`}>
      {message.type && (
        <Badge className="mb-2">
          {message.type === 'image' && '图片'}
          {message.type === 'voice' && '语音'}
          {message.type === 'video' && '视频'}
        </Badge>
      )}
      <p className="whitespace-pre-wrap">{message.content}</p>
      <span className="text-xs opacity-70 mt-2 block">
        {message.timestamp.toLocaleTimeString()}
      </span>
    </div>
  </div>
))}
```

## 五、技术亮点

### 5.1 音频处理

- **格式转换**: webm → wav (16000Hz, 16bit PCM, 单声道)
- **采样率控制**: MediaRecorder配置16000Hz采样率
- **降噪处理**: echoCancellation + noiseSuppression

### 5.2 流式响应

- **SSE解析**: 使用eventsource-parser解析Server-Sent Events
- **实时显示**: 逐字显示AI生成内容
- **错误处理**: 优雅处理网络错误和中断

### 5.3 多模态融合

- **图片分析**: 面部表情 + 肢体语言 + 环境氛围
- **语音分析**: 语音识别 + 文本情绪分析
- **摄像头分析**: 实时面部表情识别

### 5.4 用户体验

- **进度提示**: 实时显示分析进度(20% → 40% → 60% → 80% → 100%)
- **状态反馈**: 录音状态(红色图标)、加载状态(Loader2动画)
- **错误提示**: Toast通知用户操作结果

## 六、依赖包

```json
{
  "ky": "^1.2.3",
  "eventsource-parser": "^3.0.3"
}
```

## 七、API配置

**环境变量**: `INTEGRATIONS_API_KEY`

**API端点**:
- 文本生成: `https://app-97zabxvzebcx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions`
- 多模态: `https://app-97zabxvzebcx-api-k93RZBjPykEa-gateway.appmiaoda.com/v2/chat/completions`
- 语音识别: `https://app-97zabxvzebcx-api-Aa2PZnjEw5NL-gateway.appmiaoda.com/server_api`

## 八、验收标准

| 功能 | 实现状态 | 说明 |
|-----|---------|------|
| 图片上传 | ✅ | 支持JPG/PNG/BMP,最大10MB |
| 图片分析 | ✅ | 多模态大模型分析情绪 |
| 语音录制 | ✅ | 最长60秒,16000Hz采样率 |
| 语音识别 | ✅ | 短语音识别API转文字 |
| 语音分析 | ✅ | 文本大模型分析情绪 |
| 摄像头拍照 | ✅ | 实时预览+拍照 |
| 表情识别 | ✅ | 多模态大模型分析表情 |
| 流式响应 | ✅ | SSE实时显示AI生成内容 |
| 进度提示 | ✅ | 实时显示分析进度 |
| 错误处理 | ✅ | Toast通知+错误恢复 |

## 九、总结

评估页面成功集成了三大多模态输入功能:
- ✅ 图片上传与情绪分析
- ✅ 语音录制与识别
- ✅ 摄像头表情识别

**技术实现**:
- 3个Edge Functions (text-chat, multimodal-chat, speech-recognition)
- 音频格式转换 (webm → wav)
- SSE流式响应处理
- 多模态数据融合

**用户体验**:
- 实时进度提示
- 流式显示AI分析
- 友好的错误处理
- 美观的UI界面

---

**文档版本**: v1.0  
**更新日期**: 2026-01-28  
**维护团队**: 灵愈AI技术团队
