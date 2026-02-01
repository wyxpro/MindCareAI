import { motion } from 'framer-motion';
import { Activity, Check, Info, Loader2, Mic, Sparkles, StopCircle, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { audioEmotionAnalysis } from '@/db/api';

// 常量定义
const MAX_DURATION = 10;
const WAVEFORM_BARS = 40;
const FFT_SIZE = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface VoiceStepProps {
  onComplete: (data: VoiceStepData) => void;
}

interface VoiceStepData {
  duration: number;
  audioBlob?: Blob;
  emotionAnalysis?: string;
  recognizedText?: string;
  emotionType?: 'positive' | 'negative' | 'neutral';
  waveform?: number[];
}

/**
 * 解析 AI 返回的分析结果，提取情绪类型和可能识别的文字
 */
function parseAnalysisResult(analysis: string): {
  emotionType: 'positive' | 'negative' | 'neutral';
  recognizedText?: string;
} {
  const text = analysis.toLowerCase();

  // 判断情绪类型
  if (text.includes('积极') || text.includes('正面') || text.includes('乐观') ||
    text.includes('开心') || text.includes('愉悦') || text.includes('平静') && !text.includes('焦虑')) {
    return { emotionType: 'positive' };
  }
  if (text.includes('消极') || text.includes('负面') || text.includes('焦虑') ||
    text.includes('抑郁') || text.includes('压力') || text.includes('悲伤')) {
    return { emotionType: 'negative' };
  }
  return { emotionType: 'neutral' };
}

export default function VoiceStep({ onComplete }: VoiceStepProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(WAVEFORM_BARS).fill(5));
  const [emotionTrend, setEmotionTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [emotionAnalysis, setEmotionAnalysis] = useState('');
  const [emotionType, setEmotionType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [recognizedText, setRecognizedText] = useState<string | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 清理资源
  useEffect(() => {
    return () => {
      // 停止录音
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // 清理定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // 取消动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 停止音频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 情绪类型显示文本
  const emotionTypeLabel = useMemo(() => {
    if (emotionType === 'positive') return '积极';
    if (emotionType === 'negative') return '消极';
    return '中性';
  }, [emotionType]);

  // 处理分析结果（提取重复代码）
  const handleAnalysisResult = useCallback((result: { recognizedText?: string; text?: string; emotionAnalysis?: string; analysis?: string }) => {
    setRecognizedText(result.recognizedText || result.text || '');
    setEmotionAnalysis(result.emotionAnalysis || result.analysis || '语音情绪分析完成。');
    const parsed = parseAnalysisResult(result.emotionAnalysis || result.analysis || '');
    setEmotionType(parsed.emotionType);
    setShowReport(true);
  }, []);

  // 获取文件扩展名
  const getFileExtension = useCallback((mimeType: string): string => {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('mp3')) return 'mp3';
    return 'webm';
  }, []);

  const startRecording = async () => {
    try {
      // 清理之前的音频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // 检查支持的 MIME 类型
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        // @ts-ignore - fallback for Safari
        options.mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 设置分析器用于波形显示
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // 停止音频流
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // 自动处理录音并显示报告
        await processRecording(blob);
      };

      mediaRecorder.start(1000); // 每秒触发一次 ondataavailable
      setIsRecording(true);
      setDuration(0);
      setEmotionAnalysis('');
      setEmotionType('neutral');
      setRecognizedText(undefined);

      // 录音计时
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }
          return prev + 1;
        });
      }, 1000);

      // 实时波形更新
      updateWaveform();

      toast.success('开始录音...请说话');
    } catch (error) {
      console.error('录音失败:', error);
      toast.error('无法开启麦克风，请检查权限');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    try {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // 取前 WAVEFORM_BARS 个频率的平均值作为波形高度
      const newWave = Array.from(dataArray.slice(0, WAVEFORM_BARS)).map(v => Math.max(5, v / 4));
      setWaveform(newWave);

      // 模拟情绪波动数据
      if (Math.random() > 0.8) {
        setEmotionTrend(prev => [...prev.slice(-19), Math.random() * 100]);
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (e) {
      // 忽略音频上下文已关闭的错误
    }
  }, []);

  // 处理录音：使用后端 API 进行语音识别 + 情绪分析
  const processRecording = useCallback(async (blob: Blob) => {
    setLoading(true);
    toast.info('正在分析语音情绪...');

    try {
      const mimeType = blob.type || 'audio/webm';
      const ext = getFileExtension(mimeType);
      const result = await audioEmotionAnalysis(blob, `recording.${ext}`);
      handleAnalysisResult(result);
    } catch (error: any) {
      console.error('语音情绪分析失败:', error);
      toast.error(error.message || '语音情绪分析失败，请重试');
      setEmotionAnalysis('语音情绪分析暂时不可用，请稍后再试。');
      setShowReport(true);
    } finally {
      setLoading(false);
    }
  }, [getFileExtension, handleAnalysisResult]);

  // 上传音频文件处理
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('音频文件大小不能超过 10MB');
      return;
    }

    setLoading(true);
    toast.info('正在分析音频文件情绪...');

    try {
      const result = await audioEmotionAnalysis(file, file.name);
      handleAnalysisResult(result);
    } catch (error: any) {
      console.error('文件上传处理失败:', error);
      toast.error(error.message || '音频情绪分析失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [handleAnalysisResult]);

  const handleComplete = () => {
    const data: VoiceStepData = {
      duration,
      audioBlob: audioBlob || undefined,
      emotionAnalysis,
      emotionType,
      recognizedText,
      waveform,
    };
    onComplete(data);
  };

  return (
    <div className="pt-28 px-4 max-w-md mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {loading ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : (
            <Mic className={`w-10 h-10 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
          )}
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">语音情绪分析</h2>
        <p className="text-slate-500 text-sm">请随意诉说 10 秒，AI 将直接分析您的语调、情绪及心理特征。</p>
      </div>

      {/* 状态面板 */}
      <Card className="rounded-[32px] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-8 space-y-8">
          {/* 实时波形 */}
          <div className="h-24 flex items-center justify-center gap-1">
            {waveform.map((h, i) => (
              <motion.div
                key={`wave-${i}`}
                animate={{ height: isRecording ? h : 5 }}
                transition={{ duration: 0.1 }}
                className="w-1 bg-primary/40 rounded-full"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
              <p className="text-xl font-black text-slate-800 dark:text-white">{duration}s / {MAX_DURATION}s</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <p className={`text-sm font-bold ${loading ? 'text-amber-500' : isRecording ? 'text-rose-500' : 'text-emerald-500'}`}>
                {loading ? '处理中...' : isRecording ? '录音中...' : '就绪'}
              </p>
            </div>
          </div>

          <Progress value={(duration / MAX_DURATION) * 100} className="h-2 rounded-full" />

          <div className="flex flex-col gap-3">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'default'}
              disabled={loading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            >
              {isRecording ? (
                <><StopCircle className="w-5 h-5 mr-2" /> 停止录音</>
              ) : loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 处理中...</>
              ) : (
                <><Mic className="w-5 h-5 mr-2" /> 开始录音</>
              )}
            </Button>

            <div className="relative">
              <input
                type="file"
                accept="audio/*,.wav,.m4a,.mp3"
                onChange={handleFileUpload}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                disabled={loading}
                className="w-full h-14 rounded-2xl border-slate-100 dark:border-slate-800"
              >
                <Upload className="w-5 h-5 mr-2" /> 上传音频文件
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="p-4 bg-primary/5 rounded-2xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary/70 leading-relaxed font-medium">
          提示：请在安静环境下录音。AI 将直接分析您的语音情绪和语调特征，无需预先转文字。支持 wav/m4a/mp3 格式，最大 10MB。
        </p>
      </div>

      {/* 报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none">
          <DialogTitle className="sr-only">语音情绪分析报告</DialogTitle>
          <div className={`bg-gradient-to-br p-8 text-center text-white space-y-4 ${emotionType === 'positive' ? 'from-emerald-500 to-teal-600' :
            emotionType === 'negative' ? 'from-rose-500 to-pink-600' :
              'from-indigo-600 to-purple-600'
            }`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">语音情绪分析完成</h2>
              <p className="text-white/70 text-sm">AI 多模态语音情绪与心理特征分析</p>
            </div>
          </div>

          <div className="p-8 space-y-6 bg-white dark:bg-slate-950">
            {/* 情绪分析 - 主要内容 */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" /> 情绪分析
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                {emotionAnalysis || '分析中...'}
              </p>
            </div>

            {/* 识别文本 - 可选显示（仅当 AI 提供了文字时显示） */}
            {recognizedText && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> 语音内容
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                  {recognizedText}
                </p>
              </div>
            )}

            {/* 数据统计 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs">录音时长</p>
                <p className="font-bold text-slate-700 dark:text-slate-200">{duration} 秒</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs">情绪状态</p>
                <p className={`font-bold ${emotionType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                  emotionType === 'negative' ? 'text-rose-600 dark:text-rose-400' :
                    'text-indigo-600 dark:text-indigo-400'
                  }`}>
                  {emotionTypeLabel}
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowReport(false);
                handleComplete();
              }}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
            >
              下一步：表情识别
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
