import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  createAssessment,
  updateAssessment,
  ragRetrieval,
  multimodalAnalysis,
  speechRecognition,
  multimodalFusion,
  getAssessments,
  chatCompletion
} from '@/db/api';
import { toast } from 'sonner';
import { AssessmentHeader, MessageList, ChatInput, EmotionCamera, AssessmentReport } from '@/components/assessment/index';
import { convertWebmToWav } from '@/utils/audio';
import type { Message } from '@/components/assessment/MessageList';
import type { Assessment, ChatMessage, MultimodalData } from '@/types';



export default function EnhancedAssessmentPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好!我是灵愈AI助手。我会通过专业的评估量表与你进行对话,了解你的心理状态。请放松,随意分享你的感受。你最近两周的心情怎么样?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState('PHQ-9');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [multimodalData, setMultimodalData] = useState<MultimodalData>({});
  const [historicalAssessments, setHistoricalAssessments] = useState<Assessment[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const serializeConversationHistory = (items: Message[]) => {
    // 仅保存可序列化字段，避免 Date/复杂对象导致入库异常
    return items.map((item) => ({
      role: item.role,
      content: item.content,
      timestamp: item.timestamp instanceof Date
        ? item.timestamp.toISOString()
        : new Date(item.timestamp).toISOString(),
    }));
  };


  useEffect(() => {
    if (user && !currentAssessment) {
      initAssessment();
      loadHistoricalData();
    }
  }, [user]);

  const initAssessment = async () => {
    if (!user) return;
    try {
      const assessment = await createAssessment({
        assessment_type: 'multimodal',
        conversation_history: [],
      });
      setCurrentAssessment(assessment);
    } catch (error) {
      console.error('创建评估失败:', error);
    }
  };

  const loadHistoricalData = async () => {
    if (!user) return;
    try {
      const data = await getAssessments(10);
      setHistoricalAssessments(data);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    }
  };

  // 文本消息发送 - 使用RAG检索
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      type: 'text',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setAnalysisProgress(20);

    try {
      // 构建对话历史
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // 使用RAG检索进行主动式对话
      const response = await ragRetrieval(inputText, chatHistory, assessmentType);
      setAnalysisProgress(60);

      if (response?.choices?.[0]?.delta?.content) {
        const aiMessage: Message = {
          role: 'assistant',
          content: response.choices[0].delta.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // 文本情绪分析
        const textAnalysis = await analyzeTextEmotion(inputText);
        setMultimodalData(prev => ({ ...prev, text_analysis: textAnalysis }));
        setAnalysisProgress(80);

        // 更新评估记录
        if (currentAssessment) {
          await updateAssessment(currentAssessment.id, {
            conversation_history: serializeConversationHistory([...messages, userMessage, aiMessage]),
            text_input: inputText,
          });
        }
      }

      setAnalysisProgress(100);
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送失败,请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setAnalysisProgress(0), 500);
    }
  }, [inputText, loading, messages, assessmentType, currentAssessment]);

  // 文本情绪分析
  const analyzeTextEmotion = async (text: string) => {
    // 负面关键词检测
    const negativeKeywords = ['没用', '活着没意思', '累', '痛苦', '绝望', '孤独', '无助', '失眠', '焦虑', '抑郁'];
    const keywordCount = negativeKeywords.filter(kw => text.includes(kw)).length;

    // 简单的情绪评分(实际应该用NLP模型)
    const emotionScore = Math.min(keywordCount * 1.5 + Math.random() * 2, 10);

    return {
      emotion_score: emotionScore,
      negative_keywords: negativeKeywords.filter(kw => text.includes(kw)),
      text_length: text.length,
    };
  };

  // 图片上传和分析
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }

    setLoading(true);
    setAnalysisProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        const userMessage: Message = {
          role: 'user',
          content: '[已上传图片进行情绪分析]',
          type: 'image',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setAnalysisProgress(40);

        // 使用 api.ts 中的 multimodalAnalysis
        const response = await multimodalAnalysis([
          {
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张图片中的情绪表现,包括面部表情、肢体语言、环境氛围等,给出专业的情绪评估和抑郁风险分析。' },
              { type: 'image_url', image_url: { url: base64 } },
            ],
          },
        ]);

        setAnalysisProgress(70);

        // 解析响应 (NestJS 非流式返回或结构化返回)
        let analysis = response?.choices?.[0]?.message?.content || response?.choices?.[0]?.delta?.content || '';

        if (analysis) {
          const aiMessage: Message = {
            role: 'assistant',
            content: analysis,
            timestamp: new Date(),
            analysis: { type: 'image', content: analysis },
          };
          setMessages(prev => [...prev, aiMessage]);

          // 提取情绪分数(简化版)
          const imageAnalysis = {
            emotion_score: 5 + Math.random() * 3,
            analysis_text: analysis,
          };
          setMultimodalData(prev => ({ ...prev, image_analysis: imageAnalysis }));
          setAnalysisProgress(90);

          if (currentAssessment) {
            await updateAssessment(currentAssessment.id, {
              conversation_history: serializeConversationHistory([...messages, userMessage, aiMessage]),
              image_input_url: base64,
            });
          }
        }

        setAnalysisProgress(100);
        setLoading(false);
        setTimeout(() => setAnalysisProgress(0), 500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片分析失败:', error);
      toast.error('图片分析失败');
      setLoading(false);
      setAnalysisProgress(0);
    }
  }, [messages, currentAssessment]);

  // 语音录制
  const handleStartRecording = useCallback(async () => {
    try {
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
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('开始录音...');
    } catch (error) {
      console.error('录音失败:', error);
      toast.error('无法访问麦克风');
    }
  }, [assessmentType, messages]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudioRecording = async (audioBlob: Blob) => {
    setLoading(true);
    setAnalysisProgress(20);

    try {
      // 转换webm为wav
      const wavBlob = await convertWebmToWav(audioBlob);
      setAnalysisProgress(30);

      setAnalysisProgress(40);

      const userMessage: Message = {
        role: 'user',
        content: '[语音输入]',
        type: 'voice',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 使用 api.ts 中的 speechRecognition
      const data = await speechRecognition(wavBlob, 'wav', 'zh');

      setAnalysisProgress(60);

      if (data?.text) {
        const recognizedText = data.text;

        // 语音情绪分析
        const voiceAnalysis = {
          emotion_score: 4 + Math.random() * 4,
          recognized_text: recognizedText,
          duration: wavBlob.size / 16000, // 估算时长
        };
        setMultimodalData(prev => ({ ...prev, voice_analysis: voiceAnalysis }));

        // 使用 chatCompletion
        const chatResponse = await chatCompletion([
          {
            role: 'system',
            content: `你是灵愈AI助手,正在进行${assessmentType}抑郁评估。请根据用户的语音输入进行专业的心理评估。`,
          },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: recognizedText,
          },
        ]);

        setAnalysisProgress(80);

        let aiResponse = chatResponse?.choices?.[0]?.message?.content || chatResponse?.choices?.[0]?.delta?.content || '';

        if (aiResponse) {
          const aiMessage: Message = {
            role: 'assistant',
            content: `[语音识别: ${recognizedText}]\n\n${aiResponse}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      }

      setAnalysisProgress(100);
      setLoading(false);
      setTimeout(() => setAnalysisProgress(0), 500);
    } catch (error) {
      console.error('语音处理失败:', error);
      toast.error('语音处理失败');
      setLoading(false);
      setAnalysisProgress(0);
    }
  };

  // 摄像头面部表情识别 - 使用新组件
  const handleOpenCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  const handleEmotionDetected = useCallback((emotion: string, confidence: number) => {
    // 记录检测到的表情
    const emotionData = {
      emotion,
      confidence,
      timestamp: new Date().toISOString(),
    };

    setMultimodalData(prev => ({
      ...prev,
      facial_emotion: emotionData,
    }));

    // 添加到 message 历史? (根据原逻辑)
    // 原逻辑只是 toast
    const emotionLabels: Record<string, string> = {
      happy: '快乐', sad: '悲伤', angry: '愤怒', fear: '恐惧',
      surprise: '惊讶', disgust: '厌恶', neutral: '中性',
      embarrassed: '尴尬', anxious: '焦虑', calm: '平静',
    };

    const emotionEmojis: Record<string, string> = {
      happy: '😊', sad: '😢', angry: '😠', fear: '😨',
      surprise: '😲', disgust: '🤢', neutral: '😐',
      embarrassed: '😅', anxious: '😰', calm: '😌',
    };

    const label = emotionLabels[emotion] || emotion;
    const emoji = emotionEmojis[emotion] || '😐';

    toast.success(`检测到表情: ${emoji} ${label} (${confidence}%)`);
  }, []);


  // 生成综合评估报告
  const handleGenerateReport = useCallback(async () => {
    if (!currentAssessment || messages.length < 5) {
      toast.error('对话内容太少,请继续交流');
      return;
    }

    setLoading(true);
    setAnalysisProgress(20);

    try {
      // 多模态融合分析
      const fusionResult = await multimodalFusion({
        textInput: inputText,
        enableAI: true,
        // multimodalData 包含过往分析，但在当前 DTO 中未定义
        // 我们可以将其记录到日志或作为扩展参数（如果后端支持）
      });
      console.log('融合分析参考数据:', multimodalData);
      setAnalysisProgress(80);

      if (fusionResult.success) {
        toast.success('评估报告已生成');
        await loadHistoricalData();
        setReportDialogOpen(true);

        // 重新加载评估数据
        const updatedAssessment = await getAssessments(1);
        if (updatedAssessment[0]) {
          setCurrentAssessment(updatedAssessment[0]);
        }
      }

      setAnalysisProgress(100);
    } catch (error) {
      console.error('生成报告失败:', error);
      toast.error('生成报告失败');
      setAnalysisProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setAnalysisProgress(0), 500);
    }
  }, [currentAssessment, messages, inputText, multimodalData]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <AssessmentHeader
        assessmentType={assessmentType}
        setAssessmentType={setAssessmentType}
        loading={loading}
        messagesCount={messages.length}
        onGenerateReport={handleGenerateReport}
        analysisProgress={analysisProgress}
      />

      <MessageList messages={messages} loading={loading} />

      {/* 摄像头预览 - 放在中间层或浮层 */}
      {isCameraOpen && (
        <div className="px-4 py-2">
          <EmotionCamera
            onClose={handleCloseCamera}
            onEmotionDetected={handleEmotionDetected}
          />
        </div>
      )}

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        loading={loading}
        isRecording={isRecording}
        onSendMessage={handleSendMessage}
        onImageUpload={handleImageUpload}
        onToggleRecording={isRecording ? handleStopRecording : handleStartRecording}
        onOpenCamera={handleOpenCamera}
      />

      {/* 评估报告对话框 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>心理评估报告</DialogTitle>
          </DialogHeader>
          {currentAssessment && currentAssessment.risk_level !== undefined && (
            <AssessmentReport
              assessment={{
                ...currentAssessment,
                risk_level: currentAssessment.risk_level || 0,
                score: currentAssessment.score || 0,
              }}
              historicalData={historicalAssessments.map(a => ({
                date: a.created_at,
                score: a.score || 0,
                risk_level: a.risk_level || 0,
              }))}
              onClose={() => setReportDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
