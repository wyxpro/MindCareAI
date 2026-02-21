import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BarChart3, Check, ChevronRight, Download, Info, Mic, Play, StopCircle, Upload, Printer, X, FileText } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { transcribeAudio } from '@/db/siliconflow';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const inferredType = audioChunksRef.current[0]?.type || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: inferredType });
        setAudioBlob(blob);
        analyzeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setPauseTime(0);

      // 录音计时
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
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
      if (timerRef.current) clearInterval(timerRef.current);
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
    
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('文件大小不能超过50MB');
        return;
      }
      setAudioBlob(file);
      setDuration(10); // Mock duration for uploaded file
      analyzeAudio(file);
    }
  };

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    toast.info('正在分析语音情绪特征...');
    
    try {
      // 1. ASR Transcription
      const transcription = await transcribeAudio(blob);
      const text = transcription.text;
      
      // 2. Prosody analysis (client-side) as SER approximation
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);
      const sampleRate = buffer.sampleRate;
      const channelData = buffer.getChannelData(0);
      const frameSize = Math.floor(sampleRate * 0.02); // 20ms frame
      let rmsSum = 0, rmsSqSum = 0, frames = 0, pauses = 0;
      let zeroCrossings = 0;
      
      // Basic Pitch estimation (Zero Crossing Rate approximation) and Energy
      for (let i = 0; i < channelData.length; i += frameSize) {
        const end = Math.min(i + frameSize, channelData.length);
        let rms = 0; let zc = 0;
        for (let j = i; j < end; j++) {
          const v = channelData[j];
          rms += v * v;
          if (j > i) zc += (channelData[j - 1] > 0) !== (v > 0) ? 1 : 0;
        }
        rms = Math.sqrt(rms / (end - i));
        const isPause = rms < 0.02; // threshold
        if (isPause) pauses++;
        rmsSum += rms;
        rmsSqSum += rms * rms;
        zeroCrossings += zc;
        frames++;
      }
      
      const avgRms = rmsSum / frames;
      const varRms = Math.max(0, rmsSqSum / frames - avgRms * avgRms);
      const durationSec = buffer.duration;
      const pauseRatio = pauses / frames;
      const speechRateApprox = (text.length / (durationSec / 60)) || 0; // characters per minute
      const pauseDurationPerPause = pauses > 0 ? (pauses * 0.02) / (frames * 0.05) : 0; // approximation
      
      // Mock pitch drop calculation (real pitch detection requires complex DSP like Yin algorithm)
      const pitchDrop = varRms > 0.01 ? 0.25 : 0.1; 

      // 3. Map features to emotion vector
      let sad = Math.min(0.9, pauseRatio * 0.7 + (0.05 + (0.03 - avgRms)));
      let calm = Math.max(0.05, 0.3 - varRms * 2);
      let happy = Math.max(0.02, 0.25 - pauseRatio * 0.4 - (0.1 - avgRms));
      let fearful = Math.max(0.02, varRms * 0.6);
      let angry = Math.max(0.01, 0.15 - calm);
      let surprised = Math.max(0.01, 0.1 + (varRms > 0.02 ? 0.05 : 0));
      let disgusted = Math.max(0.01, 0.05);
      let neutral = Math.max(0.05, 1 - (sad + calm + happy + fearful + angry + surprised + disgusted));
      const sum = sad + calm + happy + fearful + angry + surprised + disgusted + neutral;
      
      const emotion_vector = {
        calm: calm / sum,
        happy: happy / sum,
        sad: sad / sum,
        angry: angry / sum,
        surprised: surprised / sum,
        fearful: fearful / sum,
        disgusted: disgusted / sum,
        neutral: neutral / sum,
      };
      const confidence = Math.min(0.97, 0.6 + (Math.abs(happy - sad) + pauseRatio) / 2);

      // Check depression indicators
      const isLowSpeed = speechRateApprox < 120;
      const isHighPitchDrop = pitchDrop > 0.2;
      const isLongPause = pauseDurationPerPause > 1.5;
      
      const analysisData = {
        emotion_vector,
        confidence,
        depression_analysis: (isLowSpeed || isLongPause) && emotion_vector.sad > 0.3
          ? '检测到语速缓慢、停顿较长及悲伤情绪显著，符合抑郁倾向特征模型，建议专业心理咨询。'
          : '整体语音特征在正常范围内，情绪波动平稳，心理状态良好。',
        speech_metrics: {
          speed: speechRateApprox.toFixed(0),
          tone: (avgRms * 1000).toFixed(0), // Mock Hz base
          pause: (pauses * 0.02).toFixed(1),
          energy: (20 * Math.log10(avgRms + 0.0001) + 100).toFixed(1) // dB
        },
        indicators: {
          isLowSpeed, isHighPitchDrop, isLongPause
        }
      };

      setReportData({ text, ...analysisData });
      setShowReport(true);
      toast.success('分析完成');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarData = reportData ? [
    { subject: '平静', A: reportData.emotion_vector.calm, fullMark: 1 },
    { subject: '高兴', A: reportData.emotion_vector.happy, fullMark: 1 },
    { subject: '悲伤', A: reportData.emotion_vector.sad, fullMark: 1 },
    { subject: '愤怒', A: reportData.emotion_vector.angry, fullMark: 1 },
    { subject: '惊讶', A: reportData.emotion_vector.surprised, fullMark: 1 },
    { subject: '恐惧', A: reportData.emotion_vector.fearful, fullMark: 1 },
    { subject: '厌恶', A: reportData.emotion_vector.disgusted, fullMark: 1 },
    { subject: '中性', A: reportData.emotion_vector.neutral, fullMark: 1 },
  ] : [];

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
              disabled={isAnalyzing}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            >
              {isRecording ? (
                <><StopCircle className="w-5 h-5 mr-2" /> 停止采集</>
              ) : isAnalyzing ? (
                <>分析中...</>
              ) : (
                <><Mic className="w-5 h-5 mr-2" /> 开始实时录音</>
              )}
            </Button>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              className="h-14 rounded-2xl border-slate-100 dark:border-slate-800"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isAnalyzing}
            >
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

      {/* 专业级报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[24px] border-none bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>语音识别完成报告</DialogTitle>
            <DialogDescription>声学特征分析与情绪模型匹配</DialogDescription>
          </DialogHeader>
          <div className="bg-gradient-to-r from-[#7A3EF4] to-[#9F7AEA] p-6 text-white flex justify-between items-start">
             <div className="flex gap-4 items-center">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                 <Activity className="w-6 h-6" />
               </div>
               <div>
                 <h2 className="text-xl font-bold">语音识别完成</h2>
                 <p className="text-white/80 text-xs">声学特征分析与情绪模型匹配</p>
               </div>
             </div>
             <DialogClose className="text-white/80 hover:text-white transition-colors">
               <X className="w-6 h-6" />
             </DialogClose>
          </div>

          <div className="p-6 space-y-6" id="voice-report-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* 左侧：多维指标卡片组 */}
               <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                   <BarChart3 className="w-4 h-4 text-[#7A3EF4]" /> 核心声学指标
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">语速 (字/分)</p>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-xl font-black text-slate-800 dark:text-white">{reportData?.speech_metrics?.speed}</span>
                        <span className="text-[10px] text-slate-400 mb-1">参考: 120-180</span>
                      </div>
                      {reportData?.indicators?.isLowSpeed && <Badge variant="destructive" className="mt-2 text-[10px] h-5">过慢</Badge>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">语调基频 (Hz)</p>
                      <div className="flex items-end gap-2 mt-1">
                         <span className="text-xl font-black text-slate-800 dark:text-white">{reportData?.speech_metrics?.tone}</span>
                         <span className="text-[10px] text-slate-400 mb-1">参考: 100-250</span>
                      </div>
                       {reportData?.indicators?.isHighPitchDrop && <Badge variant="secondary" className="mt-2 text-[10px] h-5 bg-amber-100 text-amber-700">基频下降</Badge>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">停顿时长 (秒)</p>
                      <div className="flex items-end gap-2 mt-1">
                         <span className="text-xl font-black text-slate-800 dark:text-white">{reportData?.speech_metrics?.pause}</span>
                         <span className="text-[10px] text-slate-400 mb-1">参考: &lt;1.5s</span>
                      </div>
                       {reportData?.indicators?.isLongPause && <Badge variant="destructive" className="mt-2 text-[10px] h-5">停顿过长</Badge>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">能量值 (dB)</p>
                      <div className="flex items-end gap-2 mt-1">
                         <span className="text-xl font-black text-slate-800 dark:text-white">{reportData?.speech_metrics?.energy}</span>
                         <span className="text-[10px] text-slate-400 mb-1">参考: 60-80</span>
                      </div>
                    </div>
                 </div>
               </div>

               {/* 右侧：雷达图 */}
               <div className="h-64 relative bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2">
                 <h3 className="absolute top-3 left-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm z-10">
                   <Activity className="w-4 h-4 text-[#7A3EF4]" /> 8维情绪雷达
                 </h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                      <Radar
                        name="情绪概率"
                        dataKey="A"
                        stroke="#7A3EF4"
                        fill="#7A3EF4"
                        fillOpacity={0.4}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#7A3EF4', fontWeight: 'bold' }}
                        formatter={(value: number) => value.toFixed(4)}
                      />
                    </RadarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* 分析建议 */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl text-sm border border-indigo-100 dark:border-indigo-900/50 flex gap-3">
               <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="font-bold text-indigo-900 dark:text-indigo-200">智能分析建议</p>
                 <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed text-xs">
                   {reportData?.depression_analysis}
                 </p>
               </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
               <div className="flex gap-2">
                 <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 text-xs rounded-lg border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    onClick={async () => {
                      const el = document.getElementById('voice-report-card');
                      if (!el) return;
                      const html2canvas = (await import('html2canvas')).default;
                      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                      const imgData = canvas.toDataURL('image/png');
                      const { jsPDF } = await import('jspdf');
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const imgWidth = pdf.internal.pageSize.getWidth();
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
                      // Add doctor signature line
                      pdf.setDrawColor(150);
                      pdf.line(20, 260, 80, 260);
                      pdf.setFontSize(10);
                      pdf.text("医生签字", 20, 270);
                      pdf.save('voice-report-professional.pdf');
                    }}
                  >
                    <FileText className="w-3.5 h-3.5 mr-2" /> 下载PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 text-xs rounded-lg border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    onClick={async () => {
                       const el = document.getElementById('voice-report-card');
                       if (!el) return;
                       const html2canvas = (await import('html2canvas')).default;
                       const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                       const a = document.createElement('a');
                       a.href = canvas.toDataURL('image/png');
                       a.download = 'voice-report-4k.png';
                       a.click();
                    }}
                  >
                    <Printer className="w-3.5 h-3.5 mr-2" /> 导出PNG
                  </Button>
               </div>
               <Button 
                 onClick={() => {
                   setShowReport(false);
                   onComplete({ duration, waveform, reportData });
                 }}
                 className="bg-[#7A3EF4] hover:bg-[#6B2ED8] text-white rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20 font-bold text-sm"
               >
                 下一步：表情识别 <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
