// Supabase API封装

import type {
  Assessment,
  ChatMessage,
  CommunityComment,
  CommunityPost,
  DoctorPatient,
  EmotionDiary,
  HealingContent,
  KnowledgeBase,
  MultimodalMessage,
  Profile,
  RiskAlert,
  UserHealingRecord,
  WearableData,
} from '@/types';
import { supabase } from './supabase';

// ==================== 用户档案 ====================
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile | null;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Profile;
};

export const getAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ==================== 情绪日记 ====================
export const getEmotionDiaries = async (userId: string, limit = 30) => {
  const { data, error } = await supabase
    .from('emotion_diaries')
    .select('*')
    .eq('user_id', userId)
    .order('diary_date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getEmotionDiaryByDate = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('emotion_diaries')
    .select('*')
    .eq('user_id', userId)
    .eq('diary_date', date)
    .maybeSingle();
  
  if (error) throw error;
  return data as EmotionDiary | null;
};

export const createEmotionDiary = async (diary: Partial<EmotionDiary>) => {
  const { data, error } = await supabase
    .from('emotion_diaries')
    .upsert(diary, { onConflict: 'user_id,diary_date' })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as EmotionDiary;
};

export const updateEmotionDiary = async (id: string, updates: Partial<EmotionDiary>) => {
  const { data, error } = await supabase
    .from('emotion_diaries')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as EmotionDiary;
};

export const deleteEmotionDiary = async (id: string) => {
  const { error } = await supabase
    .from('emotion_diaries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ==================== 评估记录 ====================
export const getAssessments = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createAssessment = async (assessment: Partial<Assessment>) => {
  const { data, error } = await supabase
    .from('assessments')
    .insert(assessment)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Assessment;
};

export const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
  const { data, error } = await supabase
    .from('assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Assessment;
};

// ==================== 手环数据 ====================
export const getWearableData = async (userId: string, limit = 30) => {
  const { data, error } = await supabase
    .from('wearable_data')
    .select('*')
    .eq('user_id', userId)
    .order('record_date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createWearableData = async (wearableData: Partial<WearableData>) => {
  const { data, error } = await supabase
    .from('wearable_data')
    .insert(wearableData)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as WearableData;
};

// ==================== 疗愈内容 ====================
export const getHealingContents = async (category?: string) => {
  let query = supabase
    .from('healing_contents')
    .select('*')
    .eq('is_active', true);
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createHealingRecord = async (record: Partial<UserHealingRecord>) => {
  const { data, error } = await supabase
    .from('user_healing_records')
    .insert(record)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as UserHealingRecord;
};

export const getHealingRecords = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('user_healing_records')
    .select('*, healing_contents(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ==================== 树洞 ====================
export const getCommunityPosts = async (limit = 20) => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCommunityPost = async (post: Partial<CommunityPost>) => {
  const { data, error } = await supabase
    .from('community_posts')
    .insert(post)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CommunityPost;
};

export const getCommunityComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCommunityComment = async (comment: Partial<CommunityComment>) => {
  const { data, error } = await supabase
    .from('community_comments')
    .insert(comment)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as CommunityComment;
};

export const togglePostLike = async (postId: string, userId: string) => {
  // 检查是否已点赞
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existing) {
    // 取消点赞
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  } else {
    // 添加点赞
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    return true;
  }
};

// ==================== 冥想记录 ====================
export const createMeditationSession = async (session: {
  user_id: string;
  content_id: string;
  duration: number;
  completed?: boolean;
  mood_before?: string;
  mood_after?: string;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('meditation_sessions')
    .insert(session)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getMeditationSessions = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('meditation_sessions')
    .select('*, healing_contents(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getMeditationStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('meditation_sessions')
    .select('duration, completed')
    .eq('user_id', userId)
    .eq('completed', true);
  
  if (error) throw error;
  
  const sessions = Array.isArray(data) ? data : [];
  const totalMinutes = sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
  const totalSessions = sessions.length;
  
  return { totalMinutes, totalSessions };
};

// ==================== 内容收藏 ====================
export const toggleFavorite = async (userId: string, contentId: string) => {
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  
  if (existing) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, content_id: contentId });
    if (error) throw error;
    return true;
  }
};

export const getUserFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, healing_contents(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const isFavorited = async (userId: string, contentId: string) => {
  const { data } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  
  return !!data;
};

// ==================== 帖子分类 ====================
export const getPostCategories = async () => {
  const { data, error } = await supabase
    .from('post_categories')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCommunityPostsByCategory = async (categoryId?: string, limit = 20) => {
  let query = supabase
    .from('community_posts')
    .select('*, post_categories(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getRecoveryStories = async (limit = 10) => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, post_categories(*)')
    .eq('is_recovery_story', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ==================== 内容统计 ====================
export const incrementViewCount = async (contentId: string) => {
  const { error } = await supabase.rpc('increment_view_count', { content_id: contentId });
  if (error) throw error;
};

export const incrementLikeCount = async (contentId: string) => {
  const { error } = await supabase.rpc('increment_like_count', { content_id: contentId });
  if (error) throw error;
};

// ==================== 医生患者关系 ====================
export const getDoctorPatients = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('doctor_patients')
    .select('*, profiles!doctor_patients_patient_id_fkey(*)')
    .eq('doctor_id', doctorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const addPatient = async (doctorId: string, patientId: string, notes?: string) => {
  const { data, error } = await supabase
    .from('doctor_patients')
    .insert({ doctor_id: doctorId, patient_id: patientId, notes })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as DoctorPatient;
};

// ==================== 风险预警 ====================
export const getRiskAlerts = async (isHandled?: boolean) => {
  let query = supabase
    .from('risk_alerts')
    .select('*, profiles!risk_alerts_patient_id_fkey(username, full_name)');
  
  if (isHandled !== undefined) {
    query = query.eq('is_handled', isHandled);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const handleRiskAlert = async (alertId: string, handledBy: string, notes?: string) => {
  const { data, error } = await supabase
    .from('risk_alerts')
    .update({
      is_handled: true,
      handled_by: handledBy,
      handled_at: new Date().toISOString(),
      notes,
    })
    .eq('id', alertId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as RiskAlert;
};

export const createRiskAlert = async (alert: Partial<RiskAlert>) => {
  const { data, error } = await supabase
    .from('risk_alerts')
    .insert(alert)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as RiskAlert;
};

// ==================== 知识库 ====================
export const getKnowledgeBase = async (category?: string) => {
  let query = supabase
    .from('knowledge_base')
    .select('*')
    .eq('is_active', true);
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createKnowledge = async (knowledge: Partial<KnowledgeBase>) => {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(knowledge)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as KnowledgeBase;
};

export const updateKnowledge = async (id: string, updates: Partial<KnowledgeBase>) => {
  const { data, error } = await supabase
    .from('knowledge_base')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as KnowledgeBase;
};

export const deleteKnowledge = async (id: string) => {
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ==================== AI API调用 ====================
export const chatCompletion = async (messages: ChatMessage[], enableThinking = false) => {
  const { data, error } = await supabase.functions.invoke('chat-completion', {
    body: { messages, enable_thinking: enableThinking },
  });
  
  if (error) throw error;
  return data;
};

export const multimodalAnalysis = async (messages: MultimodalMessage[], enableThinking = false) => {
  const { data, error } = await supabase.functions.invoke('multimodal-analysis', {
    body: { messages, enable_thinking: enableThinking },
  });
  
  if (error) throw error;
  return data;
};

export const speechRecognition = async (audioBase64: string, format: 'wav' | 'm4a', rate: 16000 | 8000, len: number) => {
  const { data, error } = await supabase.functions.invoke('speech-recognition', {
    body: {
      format,
      rate,
      cuid: crypto.randomUUID(),
      speech: audioBase64,
      len,
    },
  });
  if (error) {
    const msg = String((error as any)?.message || 'speech_recognition_error');
    if (/API密钥未配置|apikey|authorization/i.test(msg)) {
      throw new Error('语音识别未配置 API Key，请在 Supabase Functions 环境中设置 INTEGRATIONS_API_KEY');
    }
    throw error;
  }
  return data;
};

// RAG检索 - 主动式对话
export const ragRetrieval = async (query: string, conversationHistory: ChatMessage[], assessmentType: string = 'PHQ-9') => {
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

// 多模态情绪融合分析
export const multimodalFusion = async (params: {
  text_analysis?: any;
  image_analysis?: any;
  voice_analysis?: any;
  video_analysis?: any;
  user_id: string;
  assessment_id: string;
}) => {
  const { data, error } = await supabase.functions.invoke('multimodal-fusion', {
    body: params,
  });
  if (error) throw error;
  return data;
};
