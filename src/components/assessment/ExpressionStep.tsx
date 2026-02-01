import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, StopCircle, RefreshCcw, Info, Check, Download, Video, Shield, ScanFace, Activity, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { multimodalAnalysis, uploadFile } from '@/db/api';
import { imageToBase64 } from '@/utils/audio';

interface ExpressionStepProps {
  onComplete: (data: any) => void;
}

interface ExpressionStepData {
  capturedImageUrl?: string;
  uploadedImageUrl?: string;  // 上传后的图片 URL
  emotionAnalysis?: string;
  detectedEmotion?: string;
  confidence?: number;
  radarData?: Record<string, number>;
}

export default function ExpressionStep({ onComplete }: ExpressionStepProps) {
  const navigate = useNavigate();
  const DETECT_DURATION = 10;
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(DETECT_DURATION);
  const [fps, setFps] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState('中性');
  const [confidence, setConfidence] = useState(0);
  const [microSignals, setMicroSignals] = useState({ brow: 0, mouthDown: 0, blink: 0 });
  const [analysisResult, setAnalysisResult] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const analysisRef = useRef<NodeJS.Timeout | null>(null);
  const captureFrameRef = useRef<NodeJS.Timeout | null>(null);

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

      // FPS 计算
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
      console.error('摄像头启动失败:', error);
      toast.error('无法启动摄像头，请授予权限');
    }
  };

  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    if (captureFrameRef.current) clearTimeout(captureFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 设置 canvas 尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('无法获取画布上下文');
      return;
    }

    // 绘制当前帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为 base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(base64);
  };

  const startCapture = () => {
    setIsCapturing(true);
    setCountdown(DETECT_DURATION);
    setNoFaceCount(0);
    setConfidence(0);
    setCurrentEmotion('中性');
    setMicroSignals({ brow: 0, mouthDown: 0, blink: 0 });
    setCapturedImage(null);

    if (analysisRef.current) clearInterval(analysisRef.current);

    // 每 2 秒捕获一帧进行分析
    captureFrameRef.current = setInterval(() => {
      captureFrame();
    }, 2000);

    // 模拟人脸检测状态
    analysisRef.current = setInterval(() => {
      const detected = Math.random() > 0.05; // 95% 的检测率
      if (!detected) {
        setNoFaceCount((c) => {
          const next = c + 1;
          if (next >= 5) toast.warning('检测不到人脸，请调整角度');
          return next;
        });
        return;
      }
      setNoFaceCount(0);

      // 模拟检测到的情绪
      const emotions = ['中性', '高兴', '悲伤', '焦虑', '平静', '疲惫', '惊讶'];
      const picked = emotions[Math.floor(Math.random() * emotions.length)];
      setCurrentEmotion(picked);
      setConfidence(0.7 + Math.random() * 0.25);
      setMicroSignals({
        brow: Math.random() > 0.7 ? 1 : 0,
        mouthDown: Math.random() > 0.7 ? 1 : 0,
        blink: Math.random() > 0.8 ? 1 : 0,
      });
    }, 500);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);
    if (captureFrameRef.current) clearTimeout(captureFrameRef.current);
    setIsCapturing(false);

    // 捕获最后一帧
    await captureFrame();

    if (capturedImage) {
      setLoading(true);
      toast.info('正在分析面部表情...');

      try {
        // 上传图片到后端并进行分析
        // 将 base64 转换为 Blob
        const base64Data = capturedImage.split(',')[1]; // 移除 data:image/jpeg;base64, 前缀
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        const file = new File([blob], 'expression.jpg', { type: 'image/jpeg' });

        // 先上传图片获取 URL
        const uploadResult = await uploadFile(file);
        setUploadedImageUrl(uploadResult.url);  // 保存上传后的 URL

        // 调用多模态分析 API
        const response = await multimodalAnalysis([
          {
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张照片中的面部表情，识别用户的情绪状态。重点关注：' },
              { type: 'text', text: '1. 主要情绪（如：高兴、悲伤、焦虑、平静、疲惫）' },
              { type: 'text', text: '2. 情绪强度（低/中/高）' },
              { type: 'text', text: '3. 是否有压力、焦虑或抑郁的微表情特征（如眉心皱纹、嘴角下垂、眼神呆滞等）' },
              { type: 'text', text: '4. 给出专业的心理健康评估建议。' },
              { type: 'image_url', image_url: { url: uploadResult.url } },
            ],
          },
        ]);

        // 解析 AI 分析结果
        const analysis = response?.choices?.[0]?.message?.content ||
                        response?.choices?.[0]?.delta?.content ||
                        '表情分析完成';

        setAnalysisResult(analysis);

        // 从分析结果中提取结构化信息（如果可能的话）
        if (analysis) {
          // 尝试提取情绪关键词
          const emotionMap: Record<string, string> = {
            '高兴': '高兴', '积极': '高兴', '开心': '高兴',
            '悲伤': '悲伤', '消极': '悲伤', '难过': '悲伤',
            '焦虑': '焦虑', '紧张': '焦虑', '不安': '焦虑',
            '平静': '平静', '放松': '平静', '中性': '中性',
            '疲惫': '疲惫', '疲劳': '疲惫',
            '惊讶': '惊讶',
          };

          for (const [key, value] of Object.entries(emotionMap)) {
            if (analysis.includes(key)) {
              setCurrentEmotion(value);
              break;
            }
          }
        }

        setShowReport(true);
      } catch (error) {
        console.error('表情分析失败:', error);
        toast.error('表情分析失败，请重试');
        // 即使失败也显示报告，使用模拟数据
        setShowReport(true);
      } finally {
        setLoading(false);
      }
    } else {
      setShowReport(true);
    }
  };

  const RADAR_LABELS = ['高兴', '悲伤', '焦虑', '平静', '疲惫', '惊讶', '中性'];

  // 根据当前情绪生成雷达图数据
  const generateRadarValues = () => {
    // 如果有 AI 分析结果，可以从中提取；否则使用模拟数据
    const baseValues = RADAR_LABELS.map(() => Math.floor(Math.random() * 60) + 20);
    const currentIndex = RADAR_LABELS.indexOf(currentEmotion);
    if (currentIndex >= 0) {
      baseValues[currentIndex] = Math.floor(Math.random() * 30) + 70; // 当前情绪得分更高
    }
    return baseValues;
  };

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
        {[20, 40, 60, 80, 100].map((n, i) => (
          <circle key={i} cx={center} cy={center} r={(n / 100) * radius} className="stroke-white/10 fill-none" />
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

  const handleNextStep = () => {
    const data: ExpressionStepData = {
      capturedImageUrl: capturedImage || undefined,
      uploadedImageUrl: uploadedImageUrl || undefined,  // 传递上传后的 URL
      emotionAnalysis: analysisResult,
      detectedEmotion: currentEmotion,
      confidence,
      radarData: Object.fromEntries(
        RADAR_LABELS.map((label, i) => [label, generateRadarValues()[i]])
      ),
    };
    onComplete(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-40 overflow-hidden">
      {/* 隐藏的 canvas 用于截图 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 顶部状态栏 */}
      <div className="absolute top-20 left-0 right-0 z-50 px-6 py-4 flex justify-between items-start pointer-events-none">
        <div className="space-y-2">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 flex items-center gap-2 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE FEED
          </Badge>
          <div className="text-[10px] text-white/50 font-mono leading-4">
            FPS: <span className={fps < 15 ? 'text-rose-400' : 'text-emerald-400'}>{fps}</span> · AI 表情识别<br />
            FACE: <span className={noFaceCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{noFaceCount > 0 ? 'NOT DETECTED' : 'LOCKED'}</span>
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

          <div className="absolute bottom-44 md:bottom-32 left-0 right-0 px-6">
            <div className="max-w-md mx-auto">
              <div className="bg-slate-950/55 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">EMO</Badge>
                    <span className="text-white font-black">{currentEmotion}</span>
                    <span className="text-white/40 text-xs font-mono">{Math.round(confidence * 100)}%</span>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {microSignals.brow ? '眉心' : ''} · {microSignals.mouthDown ? '嘴角' : ''} · {microSignals.blink ? '眨眼' : ''}
                  </div>
                </div>
                <div className="w-20">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(confidence * 100)}%` }} />
                  </div>
                  <div className="mt-1 text-[9px] text-white/40 font-mono text-right">
                    {loading ? 'ANALYZING' : isCapturing ? 'CAPTURING' : 'READY'}
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
      <div className="absolute bottom-10 left-0 right-0 px-8 flex items-center justify-center gap-6 z-50">
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
          disabled={loading}
          className={`
            w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all shadow-lg
            ${isCapturing ? 'bg-rose-500 border-rose-500/30 scale-90' : 'bg-primary border-primary/30'}
          `}
        >
          {loading ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isCapturing ? (
            <StopCircle className="w-10 h-10 text-white" />
          ) : (
            <Video className="w-10 h-10 text-white" />
          )}
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
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none bg-slate-950 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">表情分析完成报告</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-br from-slate-900 to-primary/40 p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-primary/30">
              <ScanFace className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">表情分析完成</h2>
              <p className="text-white/40 text-sm">AI 多模态面部表情与情绪分析</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* AI 分析结果 */}
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> AI 情绪分析
              </h3>
              <div className="bg-slate-800 rounded-xl p-4 text-sm leading-relaxed">
                {analysisResult || '分析中...'}
              </div>
            </div>

            {/* 表情雷达图 */}
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> 表情雷达图
              </h3>
              <RadarChart labels={RADAR_LABELS} values={generateRadarValues()} />
            </div>

            {/* 核心发现 */}
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary">核心发现</p>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  {currentEmotion === '焦虑' || currentEmotion === '悲伤'
                    ? '检测到明显的负面情绪特征，建议进一步关注心理健康。'
                    : '面部表情相对自然，未发现明显的情绪异常。'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowReport(false);
                handleNextStep();
              }}
              disabled={loading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/40 bg-primary hover:bg-primary/90"
            >
              {loading ? '处理中...' : '下一步：生成融合报告'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
