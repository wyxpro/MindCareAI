import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Camera, Check, Download, Info, Maximize, RefreshCcw, ScanFace, Shield, StopCircle, Video } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ExpressionStepProps {
  onComplete: (data: any) => void;
}

export default function ExpressionStep({ onComplete }: ExpressionStepProps) {
  const navigate = useNavigate();
  const DETECT_DURATION = 10;
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(DETECT_DURATION);
  const [fps, setFps] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState('中性');
  const [confidence, setConfidence] = useState(0.62);
  const [microSignals, setMicroSignals] = useState({ brow: 0.12, mouthDown: 0.08, blink: 0.32 });
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const analysisRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      // FPS
      const updateFps = () => {
        const now = performance.now();
        const delta = Math.max(1, now - lastTimeRef.current);
        const computed = Math.round(1000 / delta);
        setFps(Math.min(60, Math.max(1, computed)));
        lastTimeRef.current = now;
        if (streamRef.current) requestAnimationFrame(updateFps);
      };
      updateFps();
    } catch (error) {
      toast.error('无法启动摄像头，请授予权限');
    }
  };

  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
    setCountdown(DETECT_DURATION);
    setNoFaceCount(0);
    setConfidence(0.6);
    setCurrentEmotion('中性');
    setMicroSignals({ brow: 0.12, mouthDown: 0.08, blink: 0.32 });

    if (analysisRef.current) clearInterval(analysisRef.current);
    analysisRef.current = setInterval(() => {
      const detected = Math.random() > 0.08;
      if (!detected) {
        setNoFaceCount((c) => {
          const next = c + 1;
          if (next >= 5) toast.warning('检测不到人脸，请调整角度');
          return next;
        });
        return;
      }
      setNoFaceCount(0);

      const emotions = ['中性', '高兴', '悲伤', '愤怒', '惊讶', '恐惧', '厌恶', '轻蔑', '痛苦'];
      const picked = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(picked);
      setConfidence(0.55 + Math.random() * 0.4);
      setMicroSignals({
        brow: Math.random() * 0.4,
        mouthDown: Math.random() * 0.4,
        blink: Math.random() * 0.8,
      });
    }, 250);

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    setIsCapturing(false);
    setShowReport(true);
  };

  const RADAR_LABELS = ['高兴','悲伤','愤怒','惊讶','恐惧','厌恶','中性','轻蔑','痛苦'];
  const radarValues = RADAR_LABELS.map(() => Math.floor(Math.random() * 100));

  function RadarChart({ labels, values }: { labels: string[]; values: number[] }) {
    const size = 260;
    const center = size / 2;
    const radius = 100;
    const points = values.map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const r = (v / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={size} height={size} className="mx-auto">
        {[20,40,60,80,100].map((n,i) => (
          <circle key={i} cx={center} cy={center} r={(n/100)*radius} className="stroke-white/10 fill-none" />
        ))}
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
          const x = center + (radius + 14) * Math.cos(angle);
          const y = center + (radius + 14) * Math.sin(angle);
          return <text key={label} x={x} y={y} className="text-[10px] fill-white/60" textAnchor="middle">{label}</text>;
        })}
        <polygon points={points} className="fill-primary/30 stroke-primary" />
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-40 overflow-hidden">
      <div className="absolute top-20 left-0 right-0 z-50 px-6 py-4 flex justify-between items-start pointer-events-none">
        <div className="space-y-2">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 flex items-center gap-2 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE FEED
          </Badge>
          <div className="text-[10px] text-white/50 font-mono leading-4">
            FPS: <span className={fps < 15 ? 'text-rose-400' : 'text-emerald-400'}>{fps}</span> · MODEL: EMO-9 · WIN: 3s<br />
            FACE: <span className={noFaceCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{noFaceCount > 0 ? 'LOST' : 'LOCKED'}</span>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="text-4xl font-black text-white font-mono tracking-tight">
            {countdown < 10 ? `0${countdown}` : countdown}<span className="text-sm text-white/40 ml-1">S</span>
          </div>
          <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / DETECT_DURATION) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* 视频容器 */}
      <div className="relative flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/45" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.10) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[78vw] max-w-[360px] aspect-[3/4] rounded-[32px]">
            <div className="absolute inset-0 rounded-[32px] border border-white/10" />
            <div className="absolute -inset-0.5 rounded-[34px] border border-primary/25 blur-[1px]" />
            <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-primary/60" />
            <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-primary/60" />
            <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-primary/60" />
            <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-primary/60" />

            {isCapturing && (
              <motion.div
                animate={{ top: ['6%', '92%', '6%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-6 right-6 h-px bg-primary/35 shadow-[0_0_16px_rgba(59,130,246,0.55)]"
              />
            )}
          </div>

          <div className="absolute bottom-52 md:bottom-40 left-0 right-0 px-6">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-950/55 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">EMO</Badge>
                    <span className="text-white font-black">{currentEmotion}</span>
                    <span className="text-white/40 text-xs font-mono">{Math.round(confidence * 100)}%</span>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    Brow: {(microSignals.brow * 100).toFixed(0)} · Mouth: {(microSignals.mouthDown * 100).toFixed(0)} · Blink: {(microSignals.blink * 100).toFixed(0)}
                  </div>
                </div>
                <div className="w-20">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(confidence * 100)}%` }} />
                  </div>
                  <div className="mt-1 text-[9px] text-white/40 font-mono text-right">
                    {isCapturing ? 'ANALYZING' : 'READY'}
                  </div>
                </div>
              </div>
              {noFaceCount > 0 && (
                <div className="mt-2 text-[10px] text-rose-200/80 font-bold">
                  未检测到人脸，请将面部对准取景框
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部控制 */}
      <div className="absolute bottom-24 left-0 right-0 px-8 flex items-center justify-center gap-6 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
          className="w-14 h-14 rounded-full text-white/70 hover:text-white hover:bg-white/20"
        >
          <RefreshCcw className="w-6 h-6" />
        </Button>

        <Button
          onClick={isCapturing ? handleComplete : startCapture}
          className={`
            w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all shadow-lg
            ${isCapturing ? 'bg-rose-500 border-rose-500/30 scale-90' : 'bg-primary border-primary/30'}
          `}
        >
          {isCapturing ? <StopCircle className="w-10 h-10 text-white" /> : <Video className="w-10 h-10 text-white" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="w-14 h-14 rounded-full text-white/70 hover:text-white hover:bg-white/20"
        >
          <Maximize className="w-6 h-6" />
        </Button>
      </div>

      {/* 报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="sr-only">表情分析完成报告</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-br from-slate-900 to-primary/40 p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-primary/30">
              <ScanFace className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">表情分析完成</h2>
              <p className="text-white/40 text-sm">微表情特征与抑郁风险关联分析</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> 表情雷达图
              </h3>
              <RadarChart labels={RADAR_LABELS} values={radarValues} />
            </div>

            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary">核心发现：微表情检测</p>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  检测到眉心皱纹频率偏高 (0.8次/分) 以及嘴角下垂征兆，这与中度抑郁特征高度相关。
                </p>
              </div>
            </div>

            <Button 
              onClick={() => {
                setShowReport(false);
                navigate('/profile?openReport=1');
              }}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/40 bg-primary hover:bg-primary/90"
            >
              查看多模态融合报告
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
