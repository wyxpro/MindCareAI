import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BarChart3, Check, ChevronRight, Download, Info, Mic, Play, StopCircle, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface VoiceStepProps {
  onComplete: (data: any) => void;
}

export default function VoiceStep({ onComplete }: VoiceStepProps) {
  const MAX_DURATION = 10;
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(40).fill(5));
  const [emotionTrend, setEmotionTrend] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 设置分析器用于波形
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        handleComplete();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setPauseTime(0);

      // 录音计时
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION && pauseTime <= 6) {
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);

      // 模拟波形更新
      updateWaveform();
      
      toast.success('正在实时采集语音特征...');
    } catch (error) {
      toast.error('无法开启麦克风，请检查权限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current!);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // 取前40个频率的平均值作为波形高度
    const newWave = Array.from(dataArray.slice(0, 40)).map(v => Math.max(5, v / 4));
    setWaveform(newWave);
    
    // 模拟情绪波动数据
    if (Math.random() > 0.8) {
      setEmotionTrend(prev => [...prev.slice(-19), Math.random() * 100]);
    }

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  const handleComplete = () => {
    setShowReport(true);
  };

  return (
    <div className="pt-28 px-4 max-w-md mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic className={`w-10 h-10 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">语音情绪识别</h2>
        <p className="text-slate-500 text-sm">请朗读一段文字或随意诉说 10 秒，系统将分析您的语速、音调及能量分布。</p>
      </div>

      {/* 状态面板 */}
      <Card className="rounded-[32px] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-8 space-y-8">
          {/* 实时波形 */}
          <div className="h-24 flex items-center justify-center gap-1">
            {waveform.map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: isRecording ? h : 5 }}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pause Time</span>
              <p className={`text-xl font-black ${pauseTime > 6 ? 'text-rose-500' : 'text-emerald-500'}`}>{pauseTime}s / 6s</p>
            </div>
          </div>

          <Progress value={(duration / MAX_DURATION) * 100} className="h-2 rounded-full" />

          <div className="flex flex-col gap-3">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'default'}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            >
              {isRecording ? (
                <><StopCircle className="w-5 h-5 mr-2" /> 停止采集</>
              ) : (
                <><Mic className="w-5 h-5 mr-2" /> 开始实时录音</>
              )}
            </Button>
            <Button variant="outline" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800">
              <Upload className="w-5 h-5 mr-2" /> 上传音频文件
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="p-4 bg-primary/5 rounded-2xl flex gap-3 items-start">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary/70 leading-relaxed font-medium">
          提示：请尽量在安静的环境下录音。当有效语音时长满 10s 且停顿在合理范围内时，系统将自动结束采集。
        </p>
      </div>

      {/* 报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <Activity className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">语音识别完成</h2>
              <p className="text-white/70 text-sm">声学特征分析与情绪模型匹配</p>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white dark:bg-slate-950">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" /> 情绪趋势分析
              </h3>
              <div className="h-32 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-end justify-between px-4 py-2">
                {emotionTrend.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">数据生成中...</div>
                ) : (
                  emotionTrend.map((v, i) => (
                    <div 
                      key={i} 
                      className="w-2 bg-indigo-500 rounded-t-full transition-all duration-500"
                      style={{ height: `${v}%` }}
                    />
                  ))
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                <span>Start</span>
                <span>Real-time Trend</span>
                <span>End</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-slate-400 text-xs">平均语速</p>
                <p className="font-bold text-slate-700 dark:text-slate-200">182 音节/分</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs">基频方差</p>
                <p className="font-bold text-slate-700 dark:text-slate-200">12.4 Hz</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => {
                  setShowReport(false);
                  onComplete({ duration, waveform });
                }}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
              >
                下一步：表情识别
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-slate-400 text-xs h-10">
                  <Download className="w-4 h-4 mr-2" /> 下载音频报告
                </Button>
                <Button variant="ghost" className="flex-1 text-slate-400 text-xs h-10">
                  <Play className="w-4 h-4 mr-2" /> 试听录音
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
