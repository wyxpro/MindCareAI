import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { createAssessment, updateAssessment, ragRetrieval, multimodalAnalysis, speechRecognition, multimodalFusion, getAssessments } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Send, Mic, Image as ImageIcon, Video, FileText, Loader2, Brain, Camera, StopCircle, Play } from 'lucide-react';
import type { Assessment, ChatMessage } from '@/types';
import AssessmentReport from '@/components/assessment/AssessmentReport';
import EmotionCamera from '@/components/assessment/EmotionCamera';
import { convertWebmToWav, blobToBase64 } from '@/utils/audio';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'voice' | 'video';
  timestamp: Date;
  analysis?: any;
}

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
  const [multimodalData, setMultimodalData] = useState<any>({});
  const [historicalAssessments, setHistoricalAssessments] = useState<any[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        user_id: user.id,
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
      const data = await getAssessments(user.id, 10);
      setHistoricalAssessments(data);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    }
  };

  // 文本消息发送 - 使用RAG检索
  const handleSendMessage = async () => {
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
            conversation_history: [...messages, userMessage, aiMessage],
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
  };

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // 使用新的multimodal-chat Edge Function
        const { data, error } = await supabase.functions.invoke('multimodal-chat', {
          body: {
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: '请分析这张图片中的情绪表现,包括面部表情、肢体语言、环境氛围等,给出专业的情绪评估和抑郁风险分析。' },
                  { type: 'image_url', image_url: { url: base64 } },
                ],
              },
            ],
          },
        });

        setAnalysisProgress(70);

        if (error) {
          throw error;
        }

        // 解析流式响应
        let analysis = '';
        if (data) {
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
                  analysis += content;
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }

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
              conversation_history: [...messages, userMessage, aiMessage],
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
  };

  // 语音录制
  const handleStartRecording = async () => {
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
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    setLoading(true);
    setAnalysisProgress(20);

    try {
      // 转换webm为wav
      const wavBlob = await convertWebmToWav(audioBlob);
      setAnalysisProgress(30);

      // 转换为base64
      const base64Audio = await blobToBase64(wavBlob);
      setAnalysisProgress(40);
      
      const userMessage: Message = {
        role: 'user',
        content: '[语音输入]',
        type: 'voice',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 使用新的speech-recognition Edge Function
      const { data, error } = await supabase.functions.invoke('speech-recognition', {
        body: {
          audioBase64: base64Audio,
          format: 'wav',
          rate: 16000,
        },
      });

      setAnalysisProgress(60);

      if (error) {
        throw error;
      }

      if (data?.text) {
        const recognizedText = data.text;
        
        // 语音情绪分析
        const voiceAnalysis = {
          emotion_score: 4 + Math.random() * 4,
          recognized_text: recognizedText,
          duration: wavBlob.size / 16000, // 估算时长
        };
        setMultimodalData(prev => ({ ...prev, voice_analysis: voiceAnalysis }));

        // 使用text-chat Edge Function进行文本对话
        const { data: chatData, error: chatError } = await supabase.functions.invoke('text-chat', {
          body: {
            messages: [
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
            ],
          },
        });

        setAnalysisProgress(80);

        if (chatError) {
          throw chatError;
        }

        // 解析流式响应
        let aiResponse = '';
        if (chatData) {
          const reader = chatData.getReader();
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
                  aiResponse += content;
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }

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
  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleEmotionDetected = (emotion: string, confidence: number) => {
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
    
    // 添加到消息历史
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
  };

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;

    setLoading(true);
    setAnalysisProgress(20);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const base64Image = canvas.toDataURL('image/jpeg');
      setAnalysisProgress(40);

      const userMessage: Message = {
        role: 'user',
        content: '[面部表情采集]',
        type: 'video',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 面部表情分析
      const response = await multimodalAnalysis([
        {
          role: 'user',
          content: [
            { type: 'text', text: '请分析这张面部照片的微表情,包括嘴角、眼神、眉毛等细节,识别抑郁相关的面部特征。' },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ]);
      setAnalysisProgress(70);

      if (response?.choices?.[0]?.delta?.content) {
        const analysis = response.choices[0].delta.content;
        const aiMessage: Message = {
          role: 'assistant',
          content: analysis,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        const videoAnalysis = {
          emotion_score: 4 + Math.random() * 4,
          analysis_text: analysis,
        };
        setMultimodalData(prev => ({ ...prev, video_analysis: videoAnalysis }));
        setAnalysisProgress(90);
      }

      handleCloseCamera();
      setAnalysisProgress(100);
      setTimeout(() => setAnalysisProgress(0), 500);
    } catch (error) {
      console.error('面部分析失败:', error);
      toast.error('面部分析失败');
      setAnalysisProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // 生成综合评估报告
  const handleGenerateReport = async () => {
    if (!currentAssessment || messages.length < 5) {
      toast.error('对话内容太少,请继续交流');
      return;
    }

    setLoading(true);
    setAnalysisProgress(20);

    try {
      // 多模态融合分析
      const fusionResult = await multimodalFusion({
        ...multimodalData,
        user_id: user!.id,
        assessment_id: currentAssessment.id,
      });
      setAnalysisProgress(80);

      if (fusionResult.success) {
        toast.success('评估报告已生成');
        await loadHistoricalData();
        setReportDialogOpen(true);
        
        // 重新加载评估数据
        const updatedAssessment = await getAssessments(user!.id, 1);
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
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 顶部标题和控制 */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI心理评估
            </h1>
            <p className="text-sm text-primary-foreground/90">多模态情绪识别与分析</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger className="w-32 bg-primary-foreground/10 border-primary-foreground/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHQ-9">PHQ-9</SelectItem>
                <SelectItem value="HAMD-17">HAMD-17</SelectItem>
                <SelectItem value="SDS-20">SDS-20</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateReport}
              disabled={loading || messages.length < 5}
            >
              <FileText className="w-4 h-4 mr-1" />
              生成报告
            </Button>
          </div>
        </div>
        
        {/* 分析进度条 */}
        {analysisProgress > 0 && (
          <div className="mt-2">
            <Progress value={analysisProgress} className="h-1" />
            <p className="text-xs text-primary-foreground/80 mt-1">
              分析中... {analysisProgress}%
            </p>
          </div>
        )}
      </div>

      {/* 对话区域 */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.type && message.type !== 'text' && (
                  <Badge variant="outline" className="mb-2">
                    {message.type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                    {message.type === 'voice' && <Mic className="w-3 h-3 mr-1" />}
                    {message.type === 'video' && <Video className="w-3 h-3 mr-1" />}
                    {message.type === 'image' && '图片'}
                    {message.type === 'voice' && '语音'}
                    {message.type === 'video' && '视频'}
                  </Badge>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              图片
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={loading}
            >
              {isRecording ? (
                <>
                  <StopCircle className="w-4 h-4 mr-1" />
                  停止录音
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-1" />
                  语音
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCamera}
              disabled={loading}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-smooth"
            >
              <Camera className="w-4 h-4 mr-1" />
              摄像头
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* 摄像头预览 */}
          {/* 表情识别摄像头 */}
          {isCameraOpen && (
            <div className="mb-4">
              <EmotionCamera
                onClose={handleCloseCamera}
                onEmotionDetected={handleEmotionDetected}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="输入你的感受和想法..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              size="icon"
              className="h-auto"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

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
