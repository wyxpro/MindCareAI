import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, TrendingUp, History, Download, Printer, Share2,
  ChevronDown, ChevronUp, ChevronRight, AlertCircle, CheckCircle2,
  BarChart3, Brain, Mic, Video, ClipboardList, Calendar, Search, Filter, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { multimodalFusion } from '@/db/api';

interface FusionReportProps {
  scaleData: any;
  voiceData: any;
  expressionData: any;
  onClose: () => void;
}

export default function FusionReport({ scaleData, voiceData, expressionData, onClose }: FusionReportProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [fusionScore, setFusionScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [loading, setLoading] = useState(true);
  const [fusionResult, setFusionResult] = useState<{
    integrated_report: string;
    risk_score: number;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    const generateFusionReport = async () => {
      setLoading(true);
      try {
        // 构建融合分析输入
        const textInput = voiceData?.recognizedText ||
                         scaleData?.aiResponse ||
                         '用户完成了多模态评估';

        // 构建文本描述，包含所有三个维度的信息
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
          imageUrl: expressionData?.uploadedImageUrl,  // 使用上传后的图片 URL
          enableAI: true,
        });

        if (response) {
          setFusionResult({
            integrated_report: response.integrated_report || '融合分析完成',
            risk_score: response.risk_score || 0,
            recommendation: response.recommendation || '建议保持良好的生活习惯',
          });

          // 设置风险分数
          const score = response.risk_score || 0;
          setFusionScore(score);

          // 设置风险等级
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

        // 检查是否是 429 错误（速率限制）
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('429')) {
          toast.error('请求过于频繁，请稍后再试，使用模拟数据', { duration: 4000 });
        } else {
          toast.error('融合分析失败，使用模拟数据');
        }

        // 使用模拟数据作为降级方案
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

  // 根据真实数据构建子报告内容
  const sections = [
    {
      id: 'scale',
      title: '量表评估结果 (50%)',
      icon: ClipboardList,
      color: 'text-primary',
      content: scaleData?.aiResponse
        ? `AI 分析：${scaleData.aiResponse}`
        : `PHQ-9 评估总分 ${scaleData?.score || 0} 分。${scaleData?.score >= 20 ? '提示有较高抑郁风险，建议寻求专业帮助。' : '心理状态相对稳定。'}`,
    },
    {
      id: 'voice',
      title: '语音情绪分析 (20%)',
      icon: Mic,
      color: 'text-indigo-500',
      content: voiceData?.emotionAnalysis
        ? `AI 分析：${voiceData.emotionAnalysis}`
        : `录音时长 ${voiceData?.duration || 0} 秒。语音识别内容：${voiceData?.recognizedText || '未识别到内容'}`,
    },
    {
      id: 'expression',
      title: '表情特征识别 (30%)',
      icon: Video,
      color: 'text-purple-500',
      content: expressionData?.emotionAnalysis
        ? `AI 分析：${expressionData.emotionAnalysis}`
        : `检测到主要情绪：${expressionData?.detectedEmotion || '中性'}，置信度：${Math.round((expressionData?.confidence || 0) * 100)}%`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4">
      <div className="max-w-md mx-auto space-y-8">
        {/* 顶部汇总卡片 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl shadow-slate-200 dark:shadow-none overflow-hidden"
        >
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">融合评估报告</h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                2026-02-01 14:32
              </div>
            </div>
            <Badge className={`${
              riskLevel === 'high' ? 'bg-rose-500 shadow-rose-500/20' : 
              riskLevel === 'medium' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
            } text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg`}>
              {riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'}
            </Badge>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90">
                <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                <motion.circle 
                  cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray={301.59}
                  initial={{ strokeDashoffset: 301.59 }}
                  animate={{ strokeDashoffset: 301.59 - (301.59 * fusionScore) / 100 }}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{fusionScore}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">AI 综合诊断</p>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在生成融合分析报告...
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {fusionResult?.integrated_report || '分析中...'}
                  </p>
                )}
              </div>
              {!loading && fusionResult?.recommendation && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400">健康建议</p>
                  <p className="text-sm text-primary leading-relaxed">
                    {fusionResult.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <Button className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" disabled={loading}>
              <Download className="w-4 h-4 mr-2" /> 导出完整 PDF
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-slate-100 dark:border-slate-800" disabled={loading}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* 子报告折叠面板 */}
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <Card 
              key={section.id} 
              className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900"
            >
              <button 
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{section.title}</span>
                </div>
                {expandedSection === section.id ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
              </button>
              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {section.content}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-primary font-bold">查看详细图表</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>

        {/* 历史记录 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> 历史评估记录
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-sm"><Search className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-sm"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-primary font-black">
                    {75 - i * 10}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">综合评估报告</p>
                    <p className="text-[10px] text-slate-400 font-bold">2026-01-{20-i} 10:15</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] border-slate-100 dark:border-slate-800">中风险</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <Button 
          onClick={onClose}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary"
        >
          返回首页
        </Button>
      </div>

      {/* 高风险警告提示 */}
      {riskLevel === 'high' && (
        <div className="fixed bottom-32 left-4 right-4 bg-rose-500 p-4 rounded-2xl shadow-2xl flex gap-3 animate-bounce">
          <AlertCircle className="w-6 h-6 text-white shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">高风险警示</p>
            <p className="text-[10px] text-white/80">系统检测到潜在风险，请注意保持通讯畅通，心理医生可能会主动联系您。</p>
          </div>
        </div>
      )}
    </div>
  );
}
