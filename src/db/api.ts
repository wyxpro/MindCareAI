// NestJS API 封装
import type {
  Profile,
  EmotionDiary,
  Assessment,
  WearableData,
  UserHealingRecord,
  CommunityPost,
  CommunityComment,
  ChatMessage,
} from '@/types';

// ==================== NestJS API 基础配置 ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mindcare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

// ==================== 用户档案 ====================
export const getProfile = async () => {
  return fetchFromApi('/users/me');
};

export const updateProfile = async (updates: Partial<Profile>) => {
  // 如果是当前用户，可以使用 /users/me
  return fetchFromApi('/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const getAllProfiles = async () => {
  const data = await fetchFromApi('/users');
  return Array.isArray(data.items) ? data.items : [];
};

// ==================== 情绪日记 ====================
export const getEmotionDiaries = async (limit = 30) => {
  const data = await fetchFromApi(`/emotion-diaries?pageSize=${limit}`);
  return Array.isArray(data.items) ? data.items : [];
};

export const getEmotionDiaryByDate = async (date: string) => {
  // 后端支持 startDate 和 endDate 过滤
  return fetchFromApi(`/emotion-diaries?startDate=${date}&endDate=${date}`);
};

export const createEmotionDiary = async (diary: Partial<EmotionDiary>) => {
  return fetchFromApi('/emotion-diaries', {
    method: 'POST',
    body: JSON.stringify(diary),
  });
};

export const updateEmotionDiary = async (id: string, updates: Partial<EmotionDiary>) => {
  return fetchFromApi(`/emotion-diaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteEmotionDiary = async (id: string) => {
  return fetchFromApi(`/emotion-diaries/${id}`, {
    method: 'DELETE',
  });
};

// ==================== 评估记录 ====================
export const getAssessments = async (limit = 10) => {
  const data = await fetchFromApi(`/assessments?pageSize=${limit}`);
  return Array.isArray(data.items) ? data.items : [];
};

export const createAssessment = async (assessment: Partial<Assessment>) => {
  return fetchFromApi('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessment),
  });
};

export const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
  return fetchFromApi(`/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// ==================== 手环数据 ====================
export const getWearableData = async (limit = 30) => {
  return fetchFromApi(`/health/wearable?limit=${limit}`);
};

export const createWearableData = async (wearableData: Partial<WearableData>) => {
  return fetchFromApi('/health/wearable', {
    method: 'POST',
    body: JSON.stringify(wearableData),
  });
};

// ==================== 疗愈内容 ====================
export const getHealingContents = async (category?: string) => {
  const url = category ? `/healing/contents?category=${category}` : '/healing/contents';
  return fetchFromApi(url);
};

export const createHealingRecord = async (record: Partial<UserHealingRecord>) => {
  return fetchFromApi('/healing/records', {
    method: 'POST',
    body: JSON.stringify({
      contentId: record.healing_content_id,
      duration: record.duration_seconds,
    }),
  });
};

export const getHealingRecords = async () => {
  return fetchFromApi('/healing/records');
};

// ==================== 树洞 ====================
export const getCommunityPosts = async (limit = 20) => {
  const data = await fetchFromApi(`/community/posts?pageSize=${limit}`);
  return data.items || [];
};

export const createCommunityPost = async (post: Partial<CommunityPost>) => {
  return fetchFromApi('/community/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
};

export const getCommunityComments = async (postId: string) => {
  return fetchFromApi(`/community/posts/${postId}/comments`);
};

export const createCommunityComment = async (comment: Partial<CommunityComment>) => {
  return fetchFromApi(`/community/posts/${comment.post_id}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      content: comment.content,
      anonymousName: comment.anonymous_name,
    }),
  });
};

export const togglePostLike = async (postId: string) => {
  const data = await fetchFromApi(`/community/posts/${postId}/like`, {
    method: 'POST',
  });
  return data.isLiked;
};

// ==================== 冥想记录 ====================
export const createMeditationSession = async (session: {
  content_id: string;
  duration: number;
  completed?: boolean;
  mood_before?: string;
  mood_after?: string;
  notes?: string;
}) => {
  return fetchFromApi('/healing/meditation/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
};

export const getMeditationSessions = async () => {
  return fetchFromApi('/healing/meditation/sessions');
};

export const getMeditationStats = async () => {
  return fetchFromApi('/healing/meditation/stats');
};

// ==================== 内容收藏 ====================
export const toggleFavorite = async (contentId: string) => {
  const data = await fetchFromApi(`/healing/favorites/${contentId}/toggle`, {
    method: 'POST',
  });
  return data.isFavorited;
};

export const getUserFavorites = async () => {
  return fetchFromApi('/healing/favorites');
};

export const isFavorited = async (contentId: string) => {
  const data = await fetchFromApi(`/healing/favorites/${contentId}/check`);
  return data.isFavorited;
};

// ==================== 帖子分类 ====================
export const getPostCategories = async () => {
  return fetchFromApi('/community/categories');
};

export const getCommunityPostsByCategory = async (categoryId?: string, limit = 20) => {
  const url = categoryId ? `/community/posts?categoryId=${categoryId}&pageSize=${limit}` : `/community/posts?pageSize=${limit}`;
  const data = await fetchFromApi(url);
  return data.items || [];
};

export const getRecoveryStories = async (limit = 10) => {
  const data = await fetchFromApi(`/community/posts?isRecoveryStory=true&pageSize=${limit}`);
  return data.items || [];
};

// ==================== 内容统计 ====================
export const incrementViewCount = async (contentId: string) => {
  return fetchFromApi(`/healing/contents/${contentId}/view`, {
    method: 'POST',
  });
};

export const incrementLikeCount = async (contentId: string) => {
  // 后端暂未实现特定的内容点赞，复用收藏逻辑或单独实现
  return toggleFavorite(contentId);
};

// ==================== 医生患者关系 ====================
export const getDoctorPatients = async () => {
  return fetchFromApi('/doctor/patients');
};

export const addPatient = async () => {
  // 医生通常通过扫码或申请添加患者，后端暂未开放此接口，返回模拟成功
  return { success: true };
};

// ==================== 风险预警 ====================
export const getRiskAlerts = async (isHandled?: boolean) => {
  const url = isHandled !== undefined ? `/doctor/alerts?isHandled=${isHandled}` : '/doctor/alerts';
  return fetchFromApi(url);
};

export const handleRiskAlert = async (alertId: string, notes?: string) => {
  return fetchFromApi(`/doctor/alerts/${alertId}/handle`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
};

export const createRiskAlert = async () => {
  // 预警通常由系统或AI生成
  return { success: true };
};

// ==================== 知识库 ====================
export const getKnowledgeBase = async (category?: string) => {
  const url = category ? `/doctor/knowledge?category=${category}` : '/doctor/knowledge';
  return fetchFromApi(url);
};

export const createKnowledge = async () => {
  return { success: true };
};

export const updateKnowledge = async () => {
  return { success: true };
};

export const deleteKnowledge = async () => {
  return { success: true };
};

// ==================== AI API调用 ====================
export const chatCompletion = async (messages: ChatMessage[], enableThinking = false) => {
  return fetchFromApi('/ai/text-chat', {
    method: 'POST',
    body: JSON.stringify({ messages, enableThinking }),
  });
};

export const multimodalAnalysis = async (messages: any[], enableThinking = false) => {
  return fetchFromApi('/ai/multimodal-analysis', {
    method: 'POST',
    body: JSON.stringify({ messages, enableThinking }),
  });
};

export const speechRecognition = async (audio: Blob, format: 'wav' | 'm4a' = 'wav', language: string = 'zh') => {
  const formData = new FormData();
  formData.append('file', audio, `audio.${format}`);
  formData.append('format', format);
  formData.append('language', language);

  const token = localStorage.getItem('mindcare_token');
  const response = await fetch(`${API_BASE_URL}/ai/speech-recognition`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  return response.json();
};

// RAG检索 - 主动式对话
export const ragRetrieval = async (query: string, conversationHistory: ChatMessage[], assessmentType: string = 'PHQ-9') => {
  return fetchFromApi('/ai/rag-retrieval', {
    method: 'POST',
    body: JSON.stringify({
      query,
      conversation_history: conversationHistory,
      assessment_type: assessmentType,
    }),
  });
};

// 多模态情绪融合分析
export const multimodalFusion = async (params: {
  textInput?: string;
  voiceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  enableAI?: boolean;
}) => {
  return fetchFromApi('/ai/multimodal-fusion', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

// 文件上传
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('mindcare_token');
  const response = await fetch(`${API_BASE_URL}/ai/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload Error: ${response.status} - ${errorBody}`);
  }

  return response.json();
};
