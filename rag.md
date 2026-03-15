# MindCareAI RAG（检索增强生成）技术实现文档

## 1. 概述

MindCareAI 的 RAG（Retrieval-Augmented Generation，检索增强生成）系统是一个专为心理评估对话设计的知识增强模块。该系统通过从知识库中检索相关内容，结合 AI 大模型生成专业、有依据的心理咨询回复，提升量表评估对话的专业性和准确性。

### 1.1 核心功能

- **知识库检索**：从 `knowledge_base` 表中检索与评估类型相关的知识项
- **文档解析**：支持 PDF、Word 等文档类型的内容提取
- **上下文增强**：将检索到的知识作为上下文注入 AI 提示词
- **对话策略控制**：根据对话轮次动态调整提问策略

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端应用层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ ScaleStep    │  │ Assessment   │  │ EnhancedAssessment   │  │
│  │ 量表评估组件  │  │   Page       │  │      Page            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API 调用层 (src/db/api.ts)                  │
│                    ┌──────────────────┐                         │
│                    │   ragRetrieval   │                         │
│                    │   (RAG检索函数)   │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase Edge Function 层                        │
│              ┌──────────────────────────────┐                   │
│              │   rag-retrieval/index.ts     │                   │
│              │      RAG检索 Edge Function    │                   │
│              └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   知识库检索     │  │   文档解析      │  │    AI 模型调用       │
│ knowledge_base  │  │ Storage Bucket  │  │  豆包大模型 API      │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
```

---

## 2. RAG 检索实现详解

### 2.1 核心文件位置

- **Edge Function**: `supabase/functions/rag-retrieval/index.ts`
- **前端调用**: `src/db/api.ts` (第 765-776 行)
- **知识库表**: `public.knowledge_base`

### 2.2 请求/响应数据结构

#### 请求参数 (RAGRequest)

```typescript
interface RAGRequest {
  query: string;                    // 用户输入的查询文本
  conversation_history?: any[];     // 对话历史记录
  assessment_type?: string;         // 评估类型，默认为 'PHQ-9'
}
```

#### 响应数据结构

```typescript
{
  // AI 模型返回的标准响应
  choices: [...],
  usage: {...},
  // RAG 增强信息
  knowledge_used: number,           // 使用的知识项数量
  assessment_type: string           // 评估类型
}
```

### 2.3 检索流程详解

#### 步骤 1: 知识库检索

```typescript
// 从知识库检索相关内容（支持所有分类：assessment, therapy, research）
const { data: knowledgeItems, error: kbError } = await supabase
  .from('knowledge_base')
  .select('*')
  .eq('is_active', true)
  .or(`category.eq.assessment,category.eq.therapy,category.eq.research,tags.cs.{${assessment_type}}`)
  .limit(5);
```

**检索逻辑说明**:

| 条件 | 说明 |
|------|------|
| `is_active = true` | 只检索激活状态的知识项 |
| `category.eq.assessment` | 评估量表类知识 |
| `category.eq.therapy` | 治疗方法类知识 |
| `category.eq.research` | 研究资料类知识 |
| `tags.cs.{${assessment_type}}` | 标签包含当前评估类型（如 PHQ-9） |
| `limit(5)` | 最多返回 5 条知识项 |

#### 步骤 2: 文档内容解析

```typescript
const enrichedItems = await Promise.all(
  (knowledgeItems || []).map(async (item) => {
    // 如果是文档类型且有文件URL，尝试下载并解析
    if (item.content_type === 'document' && item.file_url) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('knowledge-documents')
          .download(item.file_url);
        
        if (fileData && !downloadError) {
          const arrayBuffer = await fileData.arrayBuffer();
          // 尝试将文档内容解码为文本
          const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
          // 过滤掉二进制字符，保留可读文本
          const cleanText = text.replace(/[^\x20-\x7E\u4E00-\u9FA5\n\r]/g, '');
          
          // 使用解析后的内容替换原content字段（限制长度为3000字符）
          return { 
            ...item, 
            content: cleanText.slice(0, 3000) || item.content 
          };
        }
      } catch (err) {
        console.error('文档解析失败:', err);
      }
    }
    return item;
  })
);
```

**文档解析特点**:

- 支持从 Supabase Storage 的 `knowledge-documents` bucket 下载文档
- 使用 UTF-8 解码器处理二进制文件
- 过滤非可读字符（保留 ASCII 可打印字符和中文字符）
- 内容截断至 3000 字符以控制上下文长度

#### 步骤 3: 构建 RAG 上下文

```typescript
const knowledgeContext = enrichedItems.length > 0
  ? enrichedItems.map(item => `【${item.title}】\n${item.content}`).join('\n\n')
  : '暂无相关知识库内容';
```

上下文格式示例：

```
【PHQ-9 抑郁症筛查量表说明】
PHQ-9 是一个用于筛查抑郁症状及其严重程度的自评量表...

【抑郁症治疗方法】
认知行为疗法（CBT）是治疗抑郁症的有效方法...
```

#### 步骤 4: 构建系统提示词

```typescript
const systemPrompt = `你是一位专业的心理咨询师,正在进行抑郁症评估对话。

【评估量表】${assessment_type}

【知识库参考】
${knowledgeContext}

【对话策略】
1. 主动式提问:根据评估量表的维度,逐步深入了解用户状态
2. 渐进式探索:从轻松话题开始,逐渐深入敏感问题
3. 共情回应:对用户的感受表示理解和关怀
4. 洞察分析:识别用户话语中的情绪信号和风险因素
5. 多维评估:涵盖情绪、睡眠、兴趣、精力、自我评价等维度

【当前对话轮次】${conversation_history.length / 2}

【下一步行动】
${conversation_history.length === 0 
  ? '开场:温和地介绍评估目的,询问用户最近的整体感受'
  : conversation_history.length < 6
  ? '探索期:根据用户回答,选择1-2个核心维度深入询问'
  : conversation_history.length < 12
  ? '深入期:关注用户提到的困扰,探索具体表现和影响'
  : '总结期:整合信息,给予初步反馈,询问是否还有补充'
}

请以温暖、专业的方式继续对话,每次回复控制在80字以内。`;
```

#### 步骤 5: 调用 AI 生成回复

```typescript
const response = await fetch(
  'https://app-97zabxvzebcx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway-Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation_history,
        { role: 'user', content: query },
      ],
    }),
  }
);
```

---

## 3. 与量表评估系统的集成

### 3.1 前端调用方式

在 `src/db/api.ts` 中封装了 RAG 检索函数：

```typescript
// RAG检索 - 主动式对话
export const ragRetrieval = async (
  query: string, 
  conversationHistory: ChatMessage[], 
  assessmentType: string = 'PHQ-9'
) => {
  const { data, error } = await supabase.functions.invoke('rag-retrieval', {
    body: {
      query,
      conversation_history: conversationHistory,
      assessment_type: assessmentType,
    },
  });
  if (error) throw error;
  return data;
};
```

### 3.2 在量表评估组件中的应用

在 `ScaleStep.tsx` 组件中，RAG 知识库被用于增强 AI 对话：

```typescript
// KB 预加载：组件挂载后立即后台加载，缓存到 ref
useEffect(() => {
  if (kbCacheRef.current.loaded) return;
  getKnowledgeBase('assessment').then(kb => {
    kbCacheRef.current.text = (kb || []).slice(0, 3)
      .map(k => `【${k.title}】${(k.content || '').slice(0, 200)}`)
      .join('\n');
    kbCacheRef.current.loaded = true;
  }).catch(() => {
    kbCacheRef.current.loaded = true;
  });
}, []);

// 构建 systemPrompt 时注入知识库片段
const kbSnippet = kbCacheRef.current.text;
const systemPrompt = `你是温暖专业的心理咨询师，正在进行${selectedScales.join('、')}量表评估。

回复要求（严格遵守）：
1. 共情回应（20-40字）：针对用户具体回答，个性化反馈，加1-2个情绪emoji
2. 自然过渡到下一题...
${kbSnippet ? `\n\n参考：${kbSnippet}` : ''}`;
```

**注意**：当前 `ScaleStep.tsx` 使用的是直接调用 `volcResponses` 的方式，而非通过 `ragRetrieval` Edge Function。Edge Function 主要用于其他评估场景。

---

## 4. 评估类型参数 (assessment_type) 的作用

### 4.1 参数定义

`assessment_type` 参数用于指定当前进行的评估类型，影响知识库检索和对话策略：

| 评估类型 | 说明 | 应用场景 |
|---------|------|---------|
| `PHQ-9` | 患者健康问卷 | 抑郁症筛查 |
| `HAMD-17` | 汉密尔顿抑郁量表 | 临床抑郁评估 |
| `SDS-20` | 自评抑郁量表 | 主观抑郁感受评估 |
| `multimodal` | 多模态评估 | 综合评估 |

### 4.2 在检索中的作用

```typescript
.or(`category.eq.assessment,category.eq.therapy,category.eq.research,tags.cs.{${assessment_type}}`)
```

- 检索所有评估、治疗、研究类别的知识
- **特别检索**标签中包含当前评估类型的知识项（如 `PHQ-9`）
- 使用 `cs`（contains）操作符进行数组包含检查

### 4.3 在提示词中的作用

```typescript
【评估量表】${assessment_type}
```

AI 模型根据评估类型调整：
- 提问的专业术语
- 评估维度侧重
- 风险判断标准

---

## 5. 会话历史 (conversation_history) 的影响

### 5.1 数据结构

```typescript
conversation_history: ChatMessage[]

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### 5.2 对话阶段策略

RAG 系统根据对话历史长度动态调整策略：

```typescript
${conversation_history.length === 0 
  ? '开场:温和地介绍评估目的,询问用户最近的整体感受'
  : conversation_history.length < 6
  ? '探索期:根据用户回答,选择1-2个核心维度深入询问'
  : conversation_history.length < 12
  ? '深入期:关注用户提到的困扰,探索具体表现和影响'
  : '总结期:整合信息,给予初步反馈,询问是否还有补充'
}
```

| 对话轮次 | 阶段 | 策略 |
|---------|------|------|
| 0 | 开场 | 介绍评估目的，询问整体感受 |
| 1-3 | 探索期 | 选择 1-2 个核心维度深入 |
| 4-6 | 深入期 | 关注困扰，探索具体表现 |
| 7+ | 总结期 | 整合信息，给予初步反馈 |

### 5.3 历史记录传递

```typescript
messages: [
  { role: 'system', content: systemPrompt },
  ...conversation_history,  // 展开历史对话
  { role: 'user', content: query },  // 当前用户输入
],
```

---

## 6. 安全与配置

### 6.1 CORS 配置

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // ...
});
```

**CORS 配置说明**:

- 允许所有来源访问 (`*`)
- 支持授权头、客户端信息、API 密钥和内容类型头
- 处理预检 OPTIONS 请求

### 6.2 API 密钥验证

```typescript
const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');

if (!apiKey) {
  throw new Error('INTEGRATIONS_API_KEY未配置');
}

// 调用 AI 时使用
headers: {
  'X-Gateway-Authorization': `Bearer ${apiKey}`,
}
```

**环境变量要求**:

| 变量名 | 用途 |
|--------|------|
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥（用于数据库操作） |
| `INTEGRATIONS_API_KEY` | AI 网关 API 密钥 |

### 6.3 错误处理

```typescript
try {
  // ... 主要逻辑
} catch (error) {
  console.error('rag-retrieval错误:', error);
  return new Response(
    JSON.stringify({ error: error.message || '服务器错误' }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

---

## 7. 知识库表结构

### 7.1 表定义

```sql
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,           -- assessment | therapy | research
  tags TEXT[],                      -- 如 ['PHQ-9', 'depression']
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 文档支持字段
  content_type TEXT DEFAULT 'text', -- 'text' | 'document'
  file_url TEXT,                    -- Storage 文件路径
  file_name TEXT,                   -- 原始文件名
  file_size INTEGER,                -- 文件大小(bytes)
  file_mime_type TEXT               -- MIME类型
);
```

### 7.2 索引

```sql
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category, is_active);
CREATE INDEX idx_knowledge_base_content_type ON knowledge_base(content_type);
CREATE INDEX idx_knowledge_base_file_url ON knowledge_base(file_url) WHERE file_url IS NOT NULL;
```

### 7.3 RLS 策略

```sql
-- 医生可以查看知识库
CREATE POLICY "医生可以查看知识库" ON knowledge_base
  FOR SELECT TO authenticated USING (true);

-- 管理员可以管理知识库
CREATE POLICY "管理员可以管理知识库" ON knowledge_base
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
```

---

## 8. 部署与配置

### 8.1 部署 Edge Function

```bash
# 使用 Supabase CLI 部署
supabase functions deploy rag-retrieval

# 设置环境变量
supabase secrets set INTEGRATIONS_API_KEY=your-api-key
```

### 8.2 本地开发

```bash
# 启动 Supabase 本地环境
supabase start

# 提供环境变量文件
supabase secrets set --env-file .env

# 本地运行 Edge Function
supabase functions serve rag-retrieval
```

---

## 9. 性能优化建议

1. **知识库缓存**：前端组件已实现对知识库的预加载和缓存（`kbCacheRef`）
2. **文档解析优化**：大文档解析可考虑异步处理或预解析存储
3. **检索结果缓存**：相同评估类型的检索结果可缓存一定时间
4. **向量检索**：未来可升级为基于向量的语义检索，提升匹配准确度

---

## 10. 总结

MindCareAI 的 RAG 系统通过以下方式增强量表评估对话：

1. **知识增强**：从专业心理知识库检索相关内容，提升 AI 回复的专业性
2. **动态策略**：根据对话轮次调整提问策略，实现渐进式评估
3. **文档支持**：支持上传和解析专业文档，扩展知识来源
4. **类型适配**：根据评估类型（PHQ-9/HAMD-17/SDS-20）调整检索和对话策略
5. **安全可控**：完善的 CORS 配置和 API 密钥验证机制

该系统的核心价值在于将静态的专业心理知识库与动态的 AI 对话能力相结合，为用户提供更专业、更有依据的心理评估体验。
