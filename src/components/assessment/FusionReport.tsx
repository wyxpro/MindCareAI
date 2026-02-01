import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar,
  ChevronRight,
  ClipboardList,
  Download,
  History,
  Info,
  LineChart,
  Loader2,
  Mic,
  RefreshCcw,
  Share2,
  Smile,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { multimodalFusion } from '@/db/api';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';

interface FusionReportProps {
  scaleData: any;
  voiceData: any;
  expressionData: any;
  onClose: () => void;
}

export default function FusionReport({ scaleData, voiceData, expressionData, onClose }: FusionReportProps) {
  const [fusionScore, setFusionScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [loading, setLoading] = useState(true);
  const [fusionResult, setFusionResult] = useState<{
    integrated_report: string;
    risk_score: number;
    recommendation: string;
  } | null>(null);

  // Tab 状态
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const generateFusionReport = async () => {
      setLoading(true);
      try {
        // 构建融合分析输入
        const fusionText = `## 多模态心理健康评估数据汇总

### 1. 量表评估（文本对话）
${scaleData?.aiResponse || `量表评分: ${scaleData?.score || 0}分`}

### 2. 语音情绪分析
语音识别内容: ${voiceData?.recognizedText || '无'}
语音情绪分析: ${voiceData?.emotionAnalysis || '无'}
录音时长: ${voiceData?.duration || 0}秒

### 3. 面部表情分析
检测到的情绪: ${expressionData?.detectedEmotion || '中性'}
置信度: ${Math.round((expressionData?.confidence || 0) * 100)}%
表情情绪分析: ${expressionData?.emotionAnalysis || '无'}`;

        // 调用多模态融合 API
        const response = await multimodalFusion({
          textInput: fusionText,
          imageUrl: expressionData?.uploadedImageUrl,
          enableAI: true,
        });

        if (response) {
          const score = response.risk_score || 0;
          setFusionResult({
            integrated_report: response.integrated_report || '融合分析完成',
            risk_score: score,
            recommendation: response.recommendation || '建议保持良好的生活习惯',
          });

          setFusionScore(score);
          if (score >= 70) {
            setRiskLevel('high');
            toast.error('检测到较高风险，建议咨询专业心理医生', { duration: 5000 });
          } else if (score >= 40) {
            setRiskLevel('medium');
          } else {
            setRiskLevel('low');
          }
        }
      } catch (error) {
        console.error('多模态融合分析失败:', error);

        // 错误处理与降级
        const fallbackScore = scaleData?.score || 20;
        setFusionScore(fallbackScore);
        setRiskLevel(fallbackScore >= 40 ? 'medium' : 'low');
        setFusionResult({
          integrated_report: '由于服务暂时不可用，当前使用模拟数据。多模态融合分析结合了量表、语音和表情三个维度的评估结果。',
          risk_score: fallbackScore,
          recommendation: '建议稍后重试，或联系专业心理医生进行详细评估。',
        });
      } finally {
        setLoading(false);
      }
    };

    generateFusionReport();
  }, [scaleData, voiceData, expressionData]);

  // 雷达图组件复用
  function RadarChart({ values }: { values: number[] }) {
    const labels = ['高兴', '悲伤', '焦虑', '平静', '疲惫', '惊讶', '中性'];
    const size = 160;
    const center = size / 2;
    const radius = 60;
    const points = values.map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const r = (v / 100) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    return (
      <svg width={size} height={size} className="mx-auto">
        {[20, 40, 60, 80, 100].map((n, i) => (
          <circle key={i} cx={center} cy={center} r={(n / 100) * radius} className="stroke-slate-200 dark:stroke-slate-700 fill-none" />
        ))}
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
          const x = center + (radius + 12) * Math.cos(angle);
          const y = center + (radius + 12) * Math.sin(angle);
          return <text key={label} x={x} y={y} className="text-[10px] fill-slate-400" textAnchor="middle" dominantBaseline="middle">{label}</text>;
        })}
        <polygon points={points} className="fill-purple-500/30 stroke-purple-500 stroke-2" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 overflow-x-hidden">
      <div className="max-w-md mx-auto space-y-6">
        {/* 顶部状态：融合分数 & 风险 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden"
        >
          {/* 动态背景 */}
          <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3 ${riskLevel === 'high' ? 'bg-rose-500' : riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  多模态融合报告
                </h1>
                <p className="text-xs text-slate-400 font-bold mt-1">AI INTEGRATED ASSESSMENT</p>
              </div>
              <Badge className={`${riskLevel === 'high' ? 'bg-rose-500' : riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                } text-white px-3 py-1 text-xs font-black shadow-lg`}>
                {riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'}
              </Badge>
            </div>

            <div className="flex gap-6 items-center">
              {/* 仪表盘 */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                  <motion.circle
                    cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={351.86}
                    initial={{ strokeDashoffset: 351.86 }}
                    animate={{ strokeDashoffset: 351.86 - (351.86 * fusionScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`${riskLevel === 'high' ? 'text-rose-500' : riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800 dark:text-white">{fusionScore}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Score</span>
                </div>
              </div>

              {/* 核心结论 */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> AI 综合分析
                </div>
                {loading ? (
                  <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                    <MarkdownRenderer content={fusionResult?.integrated_report || '分析中...'} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 详细数据 Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm h-14">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-xs">
              总览
            </TabsTrigger>
            <TabsTrigger value="scale" className="rounded-xl data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 font-bold text-xs">
              量表
            </TabsTrigger>
            <TabsTrigger value="voice" className="rounded-xl data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-600 font-bold text-xs">
              语音
            </TabsTrigger>
            <TabsTrigger value="expression" className="rounded-xl data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 font-bold text-xs">
              表情
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              {/* 总览 Tab */}
              <TabsContent key="overview" value="overview" className="space-y-4 m-0 focus-visible:ring-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {/* 量表卡片 */}
                  <Card className="col-span-2 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-900 border-none shadow-sm overflow-hidden"
                    onClick={() => setActiveTab('scale')}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                          <ClipboardList className="w-4 h-4" /> 心理量表
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                          {scaleData?.score || 0}<span className="text-xs text-slate-400 font-normal ml-1">分</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        {scaleData?.score >= 20 ? '高风险' : scaleData?.score >= 10 ? '中风险' : '低风险'}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* 语音卡片 */}
                  <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 border-none shadow-sm overflow-hidden"
                    onClick={() => setActiveTab('voice')}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                        <Mic className="w-3 h-3" /> 语音情绪
                      </div>
                      <div className="h-8 flex items-end gap-1 px-1">
                        {[40, 70, 50, 80, 60, 30].map((h, i) => (
                          <div key={i} className="flex-1 bg-indigo-200 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {voiceData?.emotionAnalysis?.slice(0, 10) || '分析完成'}...
                      </p>
                    </CardContent>
                  </Card>

                  {/* 表情卡片 */}
                  <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-slate-900 dark:to-slate-900 border-none shadow-sm overflow-hidden"
                    onClick={() => setActiveTab('expression')}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-purple-600 font-bold text-xs">
                        <Smile className="w-3 h-3" /> 表情识别
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-slate-800 dark:text-white">
                          {expressionData?.detectedEmotion || '中性'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {Math.round((expressionData?.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <Progress value={(expressionData?.confidence || 0) * 100} className="h-1.5 bg-purple-100" />
                    </CardContent>
                  </Card>

                  {/* 建议卡片 */}
                  <Card className="col-span-2 bg-slate-800 dark:bg-slate-800 text-white border-none shadow-sm">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Activity className="w-4 h-4 text-emerald-400" /> 行动建议
                      </div>
                      <div className="text-xs leading-relaxed text-slate-300">
                        <MarkdownRenderer content={fusionResult?.recommendation || '加载中...'} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* 量表详情 Tab */}
              <TabsContent key="scale" value="scale" className="m-0 focus-visible:ring-0">
                <Card className="border-none shadow-none bg-transparent space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl space-y-3 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-500" /> 详细评估
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <MarkdownRenderer content={scaleData?.aiResponse || '暂无详细分析'} />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* 语音详情 Tab */}
              <TabsContent key="voice" value="voice" className="m-0 focus-visible:ring-0">
                <Card className="border-none shadow-none bg-transparent space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Mic className="w-5 h-5 text-indigo-500" /> 语音分析详情
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl text-center">
                        <span className="text-xs text-indigo-400 font-bold block mb-1">时长</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{voiceData?.duration || 0}s</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">识别内容</label>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{voiceData?.recognizedText || '未识别到有效语音内容'}"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">情绪分析</label>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <MarkdownRenderer content={voiceData?.emotionAnalysis || '无'} />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* 表情详情 Tab */}
              <TabsContent key="expression" value="expression" className="m-0 focus-visible:ring-0">
                <Card className="border-none shadow-none bg-transparent space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl space-y-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Smile className="w-5 h-5 text-purple-500" /> 表情数据分析
                    </h3>

                    {/* 雷达图 */}
                    <div className="py-2">
                      <RadarChart values={expressionData?.radarData ? Object.values(expressionData.radarData) : [50, 50, 50, 50, 50, 50, 50]} />
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                      <MarkdownRenderer content={expressionData?.emotionAnalysis || '未检测到明显情绪特征'} />
                    </div>

                    {expressionData?.uploadedImageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <img src={expressionData.uploadedImageUrl} alt="Captured" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>

        {/* 底部按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            返回首页
          </Button>
          <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Share2 className="w-5 h-5 text-slate-400" />
          </Button>
        </div>
      </div >
    </div >
  );
}
