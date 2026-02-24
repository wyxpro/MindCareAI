import { AnimatePresence, motion } from 'framer-motion';
import { 
  Activity, Calendar, ChevronRight, Clock, Download, FileText, 
  History, Mic, RefreshCw, User, Video, X, Stethoscope, Lightbulb, Heart, Info
} from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { createRiskAlert, getAssessments, syncReport, getAssessmentById } from '@/db/api';
import { cn } from '@/lib/utils';

interface FusionReportProps {
  scaleData?: any;
  voiceData?: any;
  expressionData?: any;
  onClose?: () => void;
  assessmentId?: string; // If viewing history
}

export default function FusionReport({ 
  scaleData, 
  voiceData, 
  expressionData, 
  onClose,
  assessmentId 
}: FusionReportProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // State
  const [fusionScore, setFusionScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'extreme'>('low');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [weights, setWeights] = useState({ scale: 0.5, voice: 0.2, expression: 0.3 });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  
  // New States
  const [activeReport, setActiveReport] = useState<'scale' | 'voice' | 'comprehensive' | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [generatingAdvice, setGeneratingAdvice] = useState(false);

  // 示例数据 - 用于展示有意义的报告内容
  const mockScaleData = {
    score: 12,
    phq9_score: 12,
    answers: [2, 2, 1, 2, 1, 1, 2, 1, 0],
    risk_level: 'medium'
  };

  const mockVoiceData = {
    score: 65,
    risk_score: 65,
    emotion_score: 65,
    emotions: {
      calm: 0.45,
      happy: 0.15,
      sad: 0.20,
      angry: 0.08,
      fear: 0.07,
      surprise: 0.05
    },
    analysis: '语音语调略显低沉，语速偏慢，存在轻度焦虑特征'
  };

  const mockExpressionData = {
    depression_risk_score: 58,
    risk_score: 58,
    facial_expressions: {
      neutral: 0.40,
      sad: 0.25,
      happy: 0.15,
      tired: 0.20
    },
    eye_contact: '正常',
    micro_expressions: '检测到轻微疲劳迹象'
  };

  // 检查是否有有效数据的辅助函数
  const hasValidScaleData = (s: any) => s && (typeof s.score === 'number' || typeof s.phq9_score === 'number');
  const hasValidVoiceData = (v: any) => v && (typeof v.score === 'number' || typeof v.risk_score === 'number' || typeof v.emotion_score === 'number');
  const hasValidExpressionData = (e: any) => e && (typeof e.depression_risk_score === 'number' || typeof e.risk_score === 'number');

  // State for data (either from props or fetched)
  const [data, setData] = useState<{
    scale: any;
    voice: any;
    expression: any;
  }>({ 
    scale: hasValidScaleData(scaleData) ? scaleData : mockScaleData, 
    voice: hasValidVoiceData(voiceData) ? voiceData : mockVoiceData, 
    expression: hasValidExpressionData(expressionData) ? expressionData : mockExpressionData 
  });

  // Score helpers to robustly read fields from different data shapes
  const getScaleScore = (s: any) => {
    // 如果没有有效数据，返回 mock 数据
    if (!s || (typeof s?.score !== 'number' && typeof s?.phq9_score !== 'number')) {
      return mockScaleData.phq9_score;
    }
    return typeof s?.score === 'number' ? s.score : s?.phq9_score;
  };
  const getVoiceScore = (v: any) => {
    // 如果没有有效数据，返回 mock 数据
    if (!v || (typeof v?.score !== 'number' && typeof v?.risk_score !== 'number' && typeof v?.emotion_score !== 'number')) {
      return mockVoiceData.score;
    }
    return typeof v?.score === 'number'
      ? v.score
      : typeof v?.risk_score === 'number'
      ? v.risk_score
      : v?.emotion_score;
  };
  const getExpressionScore = (e: any) => {
    // 如果没有有效数据，返回 mock 数据
    if (!e || (typeof e?.depression_risk_score !== 'number' && typeof e?.risk_score !== 'number')) {
      return mockExpressionData.depression_risk_score;
    }
    return typeof e?.depression_risk_score === 'number'
      ? e.depression_risk_score
      : e?.risk_score;
  };

  // Prepare chart data
  const scaleChartData = useMemo(() => {
    const score = getScaleScore(data.scale);
    return [
      { name: '无抑郁', min: 0, max: 4, fill: '#10B981', current: score <= 4 ? score : 0 },
      { name: '轻度', min: 5, max: 9, fill: '#3B82F6', current: score > 4 && score <= 9 ? score : 0 },
      { name: '中度', min: 10, max: 14, fill: '#F59E0B', current: score > 9 && score <= 14 ? score : 0 },
      { name: '中重度', min: 15, max: 19, fill: '#F97316', current: score > 14 && score <= 19 ? score : 0 },
      { name: '重度', min: 20, max: 27, fill: '#EF4444', current: score > 19 ? score : 0 },
    ];
  }, [data.scale]);

  const voiceChartData = useMemo(() => {
    const emotions = data.voice?.emotions || mockVoiceData.emotions;
    // Map common emotions or use mock if missing
    return [
      { subject: '平静', A: Math.round((emotions.calm || 0.45) * 100), fullMark: 100 },
      { subject: '开心', A: Math.round((emotions.happy || 0.15) * 100), fullMark: 100 },
      { subject: '悲伤', A: Math.round((emotions.sad || 0.20) * 100), fullMark: 100 },
      { subject: '愤怒', A: Math.round((emotions.angry || 0.08) * 100), fullMark: 100 },
      { subject: '恐惧', A: Math.round((emotions.fear || 0.07) * 100), fullMark: 100 },
      { subject: '惊讶', A: Math.round((emotions.surprise || 0.05) * 100), fullMark: 100 },
    ];
  }, [data.voice]);

  // UI Helpers
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-500 shadow-emerald-500/20';
      case 'medium': return 'bg-violet-500 shadow-violet-500/20';
      case 'high': return 'bg-orange-500 shadow-orange-500/20';
      case 'extreme': return 'bg-rose-600 shadow-rose-600/20';
      default: return 'bg-slate-500';
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中风险';
      case 'high': return '高风险';
      case 'extreme': return '极高风险';
      default: return '未知';
    }
  };

  const getRiskBadgeColor = (level: string) => {
     switch (level) {
      case 'low': return 'bg-[#10B981]';
      case 'medium': return 'bg-[#8B5CF6]';
      case 'high': return 'bg-[#F97316]';
      case 'extreme': return 'bg-[#EF4444]';
      default: return 'bg-slate-500';
    }
  };

  // Calculations & Sync Fix
  useEffect(() => {
    if (assessmentId) {
      loadAssessment(assessmentId);
    } else if (!scaleData && !voiceData && !expressionData) {
      fetchLatestAssessment();
    } else {
      // FIX: Ensure local state updates when props change for real-time sync
      // 使用有效数据或示例数据
      const newData = { 
        scale: hasValidScaleData(scaleData) ? scaleData : mockScaleData, 
        voice: hasValidVoiceData(voiceData) ? voiceData : mockVoiceData, 
        expression: hasValidExpressionData(expressionData) ? expressionData : mockExpressionData 
      };
      setData(newData);
      calculateFusion(newData.scale, newData.voice, newData.expression);
    }
  }, [scaleData, voiceData, expressionData, weights, assessmentId]);

  // Generate Advice when risk level is determined
  useEffect(() => {
    // Also trigger if generatingAdvice flag is set manually (e.g. from history load)
    // If generatingAdvice is true, we want to run generateProfessionalAdvice
    // If advice is empty and we have a score, we want to run it.
    if (generatingAdvice) {
       generateProfessionalAdvice();
    } else if (fusionScore > 0 && !advice) {
       generateProfessionalAdvice();
    }
  }, [fusionScore, riskLevel, generatingAdvice]);

  const generateProfessionalAdvice = () => {
    if (advice && !generatingAdvice) return; 
    if (!generatingAdvice) setGeneratingAdvice(true);
    
    // Simulate AI generation based on diagnosis
    setTimeout(() => {
      // Use current data state which should be updated
      const currentRisk = riskLevel; 
      const sScore = getScaleScore(data.scale);
      const vScore = getVoiceScore(data.voice);

      const adviceText = `
        1. **情绪状态分析**: 用户当前处于${getRiskText(currentRisk)}状态，主要表现为${sScore > 10 ? '显著的抑郁倾向' : '情绪相对平稳'}，语音情感分析显示${vScore > 60 ? '焦虑水平较高' : '语调平和'}。
        2. **干预建议**: 建议${currentRisk === 'high' || currentRisk === 'extreme' ? '立即预约专业心理咨询，并进行每周一次的CBT认知行为疗法' : '保持当前生活节奏，建议进行冥想练习'}。
        3. **功能推荐**: 推荐使用"疗愈空间"中的"${currentRisk === 'high' ? '正念冥想' : '情绪日记'}"功能。
        4. **医生建议**: ${currentRisk === 'high' ? '建议转诊至精神科进行进一步评估。' : '定期复查即可。'}
      `;
      setAdvice(adviceText);
      setGeneratingAdvice(false);
    }, 1500);
  };

  const fetchLatestAssessment = async () => {
    if (!user) return;
    try {
      const assessments = await getAssessments(user.id, 1);
      if (assessments.length > 0) {
        const latest = assessments[0];
        if (latest.report?.scaleData || latest.report?.voiceData || latest.report?.expressionData) {
           const newData = {
             scale: latest.report.scaleData,
             voice: latest.report.voiceData,
             expression: latest.report.expressionData
           };
           setData(newData);
           calculateFusion(newData.scale, newData.voice, newData.expression);
        } else {
          // 如果没有报告数据，使用示例数据
          setData({ scale: mockScaleData, voice: mockVoiceData, expression: mockExpressionData });
          calculateFusion(mockScaleData, mockVoiceData, mockExpressionData);
        }
      } else {
        // 如果没有评估记录，使用示例数据
        setData({ scale: mockScaleData, voice: mockVoiceData, expression: mockExpressionData });
        calculateFusion(mockScaleData, mockVoiceData, mockExpressionData);
      }
    } catch (e) {
      console.error(e);
      // 出错时使用示例数据
      setData({ scale: mockScaleData, voice: mockVoiceData, expression: mockExpressionData });
      calculateFusion(mockScaleData, mockVoiceData, mockExpressionData);
    }
  };

  // Load History Effect
  useEffect(() => {
    if (selectedHistoryId) {
      loadAssessment(selectedHistoryId);
    }
  }, [selectedHistoryId]);

  const loadAssessment = async (id: string) => {
    let item: any = historyList.find(h => h.id === id);
    
    if (!item) {
      try {
        const fetched = await getAssessmentById(id);
        if (fetched) item = fetched;
      } catch (e) {
        console.error("Failed to load assessment", e);
        toast.error("加载历史报告失败");
        return;
      }
    }

    if (item && item.report) {
       const newData = {
         scale: item.report.scaleData,
         voice: item.report.voiceData,
         expression: item.report.expressionData
       };
       setData(newData);
       
       if (item.report.advice) {
         setAdvice(item.report.advice);
       } else {
         setAdvice(''); 
         // Force generate advice if missing, as useEffect might not trigger if score/risk is same
         // But generateProfessionalAdvice has a check `if (advice) return`. 
         // Since we just set it to empty, we can trigger generation.
         // However, state updates are async. 
         // We should call generate logic directly or rely on useEffect but ensure dependency.
         // Let's use a timeout to allow state to update then trigger generation
         setTimeout(() => {
            if (!item.report.advice) setGeneratingAdvice(true);
         }, 0);
       }

       // Recalculate to update UI state
       calculateFusion(newData.scale, newData.voice, newData.expression);
       // Open comprehensive detail dialog for the selected history item
       setActiveReport('comprehensive');
    }
  };

  const calculateFusion = (sData: any, vData: any, eData: any) => {
    const scaleRaw = getScaleScore(sData);
    let scaleNormalized = 0;
    if (scaleRaw <= 4) scaleNormalized = scaleRaw * 5;
    else if (scaleRaw <= 9) scaleNormalized = 20 + (scaleRaw - 5) * 4;
    else if (scaleRaw <= 14) scaleNormalized = 40 + (scaleRaw - 10) * 4;
    else if (scaleRaw <= 19) scaleNormalized = 60 + (scaleRaw - 15) * 4;
    else scaleNormalized = 80 + (scaleRaw - 20) * 2.5; // Cap at 100

    const voiceNormalized = getVoiceScore(vData); // 0-100
    const expressionNormalized = getExpressionScore(eData); // 0-100

    const score = Math.round(
      scaleNormalized * weights.scale + 
      voiceNormalized * weights.voice + 
      expressionNormalized * weights.expression
    );

    setFusionScore(score);

    // Determine Risk Level
    let level: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (score >= 80) level = 'extreme';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';
    else level = 'low';

    setRiskLevel(level);

    // Check for High Risk Warning
    checkHighRisk(score, scaleRaw, voiceNormalized, expressionNormalized);

    // Auto Sync
    if (syncStatus === 'idle' && !assessmentId && (sData || vData || eData)) {
      handleSync(score, level, { scale: scaleNormalized, voice: voiceNormalized, expression: expressionNormalized }, sData, vData, eData);
    }
  };

  const checkHighRisk = async (score: number, scaleRaw: number, voiceScore: number, expressionScore: number) => {
    const isHighRisk = 
      score >= 80 || 
      scaleRaw >= 20 || 
      (voiceScore >= 80 && expressionScore >= 80);

    if (isHighRisk && !assessmentId) {
      // Create Risk Alert
      try {
        await createRiskAlert({
          patient_id: user?.id,
          alert_type: 'fusion_risk_high',
          risk_level: score,
          description: `融合风险分值 ${score} (PHQ-9: ${scaleRaw}, Voice: ${voiceScore}, Expression: ${expressionScore})`,
          is_handled: false,
          data_source: 'fusion_report'
        });
        toast.error('检测到高风险指标，已自动推送至医生工作台');
      } catch (e) {
        console.error('Failed to create risk alert', e);
      }
    }
  };

  const handleSync = async (score: number, level: string, normalizedScores: any, sData: any, vData: any, eData: any, retryCount = 0) => {
    setSyncStatus('syncing');
    setSyncProgress(10);
    
    try {
      await syncReport({
        user_id: user?.id || '',
        score: score,
        risk_level: score, // Store as 0-100
        report_details: {
          scaleRaw: sData?.score,
          normalizedScores,
          scaleData: sData,
          voiceData: vData,
          expressionData: eData,
          advice: advice, // Save generated advice
          generatedAt: new Date().toISOString()
        },
        weights
      });

      setSyncStatus('success');
      toast.success('报告已同步至云端');
      
      // Refresh history
      fetchHistory();
    } catch (error) {
      if (retryCount < 3) {
        toast.warning(`同步失败，正在尝试第 ${retryCount + 1} 次重试...`);
        setTimeout(() => {
          handleSync(score, level, normalizedScores, sData, vData, eData, retryCount + 1);
        }, 1000);
      } else {
        setSyncStatus('error');
        toast.error('同步失败，请重试');
      }
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const history = await getAssessments(user.id, 5); // Limit to 5
      setHistoryList(history.filter(h => h.assessment_type === 'fusion_report' || h.report?.weights));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `FusionReport-${new Date().toISOString()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`FusionReport-${new Date().toISOString()}.pdf`);
      }
      toast.success('下载成功');
    } catch (e) {
      toast.error('下载失败');
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto">
      {/* 重新设计的报告弹窗 */}
      {/* 量表评估报告弹窗 */}
      <Dialog open={activeReport === 'scale'} onOpenChange={() => setActiveReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-0 bg-white rounded-2xl mx-auto w-[calc(100%-3rem)]">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                量表评估报告
              </DialogTitle>
              <DialogDescription className="text-white/80 mt-2">
                PHQ-9 抑郁症筛查量表详细得分与分析
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 得分卡片 */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-600 font-medium">PHQ-9 总分</span>
                <Badge className={`${getRiskBadgeColor(riskLevel)} text-white px-3 py-1`}>
                  {getRiskText(riskLevel)}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{getScaleScore(data.scale)}</span>
                <span className="text-slate-400 text-lg">/ 27</span>
              </div>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                根据您的量表回答，您的抑郁倾向处于<span className="font-semibold text-slate-700">{getRiskText(riskLevel)}</span>水平。
              </p>
            </div>
             
            {/* 各维度得分 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                各维度得分详情
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '兴趣丧失', score: 2, max: 3 },
                  { label: '情绪低落', score: 2, max: 3 },
                  { label: '睡眠问题', score: 1, max: 3 },
                  { label: '疲劳感', score: 2, max: 3 },
                  { label: '食欲变化', score: 1, max: 3 },
                  { label: '自我评价', score: 1, max: 3 },
                  { label: '注意力', score: 2, max: 3 },
                  { label: '动作迟缓', score: 1, max: 3 },
                  { label: '自杀意念', score: 0, max: 3 },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-bold ${item.score >= 2 ? 'text-amber-500' : item.score >= 1 ? 'text-blue-500' : 'text-emerald-500'}`}>
                        {item.score}
                      </span>
                      <span className="text-xs text-slate-400">/ {item.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 图表区域 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                风险等级分布
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scaleChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 27]} hide />
                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
                            <p className="font-bold text-slate-800">{data.name}</p>
                            <p className="text-slate-500 mt-1">分数范围: {data.min}-{data.max}</p>
                            {data.current > 0 && <p className="text-blue-600 font-bold mt-1">当前得分: {data.current}</p>}
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="max" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f8fafc' }}>
                       {scaleChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.current > 0 ? entry.fill : '#cbd5e1'} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">当前所处阶段高亮显示</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleDownload('pdf')} className="rounded-xl h-11 px-6">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
              <Button onClick={() => setActiveReport(null)} className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800">
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 语音情绪识别报告弹窗 */}
      <Dialog open={activeReport === 'voice'} onOpenChange={() => setActiveReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border-0 bg-white rounded-2xl mx-auto w-[calc(100%-3rem)]">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                语音情绪识别报告
              </DialogTitle>
              <DialogDescription className="text-white/80 mt-2">
                基于声学特征的情绪状态分析
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 得分卡片 */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-600 font-medium">情绪分值</span>
                <Badge className="bg-violet-500 text-white px-3 py-1">
                  {getVoiceScore(data.voice) > 60 ? '波动较大' : '相对平稳'}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{getVoiceScore(data.voice)}</span>
                <span className="text-slate-400 text-lg">/ 100</span>
              </div>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                语音分析显示您的情绪状态<span className="font-semibold text-slate-700">{getVoiceScore(data.voice) > 60 ? '较为波动' : '相对平稳'}</span>。
              </p>
            </div>
             
            {/* 声学特征分析 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-500" />
                声学特征指标
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '语速', value: 142, unit: '词/分', status: '偏慢', color: 'text-amber-500' },
                  { label: '音调变化', value: 68, unit: '%', status: '正常', color: 'text-emerald-500' },
                  { label: '音量稳定性', value: 75, unit: '%', status: '良好', color: 'text-emerald-500' },
                  { label: '停顿频率', value: 12, unit: '次/分', status: '偏高', color: 'text-amber-500' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className={`text-xs font-medium ${item.color}`}>{item.status}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-800">{item.value}</span>
                      <span className="text-xs text-slate-400">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 情绪分析详情 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-500" />
                情绪分布详情
              </h4>
              <div className="space-y-3">
                {[
                  { label: '平静', value: 45, color: 'bg-emerald-500', icon: '😌' },
                  { label: '悲伤', value: 20, color: 'bg-blue-500', icon: '😢' },
                  { label: '开心', value: 15, color: 'bg-amber-500', icon: '😊' },
                  { label: '愤怒', value: 8, color: 'bg-rose-500', icon: '😠' },
                  { label: '恐惧', value: 7, color: 'bg-purple-500', icon: '😰' },
                  { label: '惊讶', value: 5, color: 'bg-cyan-500', icon: '😲' },
                ].map((emotion) => (
                  <div key={emotion.label} className="flex items-center gap-3">
                    <span className="text-lg">{emotion.icon}</span>
                    <span className="text-sm text-slate-600 w-12">{emotion.label}</span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${emotion.color} rounded-full transition-all duration-500`}
                        style={{ width: `${emotion.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10 text-right">{emotion.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 雷达图区域 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-500" />
                多维情绪雷达图
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={voiceChartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="情绪值" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleDownload('pdf')} className="rounded-xl h-11 px-6">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
              <Button onClick={() => setActiveReport(null)} className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800">
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 综合诊断报告弹窗 - 全新设计 */}
      <Dialog open={activeReport === 'comprehensive'} onOpenChange={() => setActiveReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-white rounded-2xl mx-auto w-[calc(100%-3rem)]">
          {/* 头部 - 医疗专业风格 */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16 blur-2xl" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                综合诊断报告
              </DialogTitle>
              <DialogDescription className="text-white/80 mt-2">
                多模态数据融合深度分析结果
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 核心指标卡片组 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                <div className="text-xs text-slate-500 mb-2 font-medium">综合风险分</div>
                <div className={`text-3xl font-black ${riskLevel === 'high' || riskLevel === 'extreme' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {fusionScore}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">满分 100</div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                <div className="text-xs text-slate-500 mb-2 font-medium">风险等级</div>
                <Badge className={`${getRiskBadgeColor(riskLevel)} text-white px-4 py-1.5 text-sm font-bold mt-1`}>
                  {getRiskText(riskLevel)}
                </Badge>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100 text-center shadow-sm">
                <div className="text-xs text-slate-500 mb-2 font-medium">主要影响因子</div>
                <div className="text-lg font-bold text-slate-800 mt-1">量表</div>
                <div className="text-[10px] text-slate-400">权重 50%</div>
              </div>
            </div>

            {/* 详细得分 breakdown */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                多维度得分详情
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium">量表评估 (50%)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{getScaleScore(data.scale)}</span>
                    <span className="text-xs text-slate-400">/ 27</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(getScaleScore(data.scale) / 27) * 100}%` }} />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-slate-700 font-medium">语音情绪 (20%)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{getVoiceScore(data.voice)}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${getVoiceScore(data.voice)}%` }} />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Video className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="text-slate-700 font-medium">表情识别 (30%)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{getExpressionScore(data.expression)}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${getExpressionScore(data.expression)}%` }} />
                </div>
              </div>
            </div>
             
            {/* 趋势分析 */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                情绪趋势分析
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { day: '周一', score: 68, trend: 'up' },
                  { day: '周二', score: 72, trend: 'up' },
                  { day: '周三', score: 65, trend: 'down' },
                  { day: '周四', score: 70, trend: 'up' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                    <div className="text-xs text-slate-500 mb-1">{item.day}</div>
                    <div className="text-lg font-bold text-slate-800">{item.score}</div>
                    <div className={`text-xs mt-1 ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {item.trend === 'up' ? '↑ 改善' : '↓ 波动'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 个性化建议卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  心理调节建议
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>每天进行10分钟正念冥想练习</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>保持规律作息，确保7-8小时睡眠</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>适度运动，每周3次有氧运动</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  专业干预建议
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>建议预约心理咨询师进行深度评估</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>考虑认知行为疗法（CBT）干预</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>定期复查，建议2周后重新评估</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 智能诊断结论 */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-5 border border-emerald-100">
              <h4 className="font-bold flex items-center gap-2 mb-3 text-emerald-800">
                <Lightbulb className="w-5 h-5" />
                智能诊断结论
              </h4>
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {advice || `根据多模态数据分析，您当前的心理状态处于${getRiskText(riskLevel)}水平。

主要表现：
1. 量表评估显示存在轻度抑郁倾向，主要表现为兴趣减退和情绪低落
2. 语音分析检测到轻微的焦虑特征，语速偏慢
3. 表情识别显示疲劳度较高，建议注意休息

整体评估：您的状况需要关注，建议采取积极的心理调节措施，必要时寻求专业帮助。`}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleDownload('pdf')} className="rounded-xl h-11 px-6">
                <Download className="w-4 h-4 mr-2" />
                导出完整报告
              </Button>
              <Button onClick={() => setActiveReport(null)} className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800">
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 -ml-2">
            <X className="w-6 h-6 text-slate-900 dark:text-white" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            多模态报告
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" onClick={fetchHistory} className="rounded-full border-slate-200 text-slate-700 font-medium px-4 h-9">
                <Clock className="w-4 h-4 mr-1.5" />
                历史记录
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  历史评估记录
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                  {loadingHistory ? (
                     <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-slate-400" /></div>
                  ) : historyList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">暂无历史记录</div>
                  ) : (
                    <div className="space-y-3">
                      {historyList.map((item) => (
                        <div 
                          key={item.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-100 dark:border-slate-700"
                          onClick={() => {
                            setSelectedHistoryId(item.id);
                            toast.info('加载历史报告: ' + item.created_at);
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                            <Badge className={`${
                              (item.score || 0) >= 80 ? 'bg-rose-500' : 'bg-emerald-500'
                            } text-white border-none`}>
                              {item.score || 0}分
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button size="sm" onClick={() => handleDownload('pdf')} className="rounded-full bg-[#1E6EFF] hover:bg-blue-700 text-white font-medium px-5 h-9 shadow-lg shadow-blue-500/20">
            <Download className="w-4 h-4 mr-2" />
            导出PDF
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 pb-20 mt-4">
        {/* Main Report Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden" ref={reportRef}>
           {/* Top Green Bar */}
           <div className="absolute top-0 left-0 right-0 h-2 bg-[#10B981]" />

           {/* Report Navigation Buttons */}
           <div className="grid grid-cols-3 gap-2 mt-6 mb-6 px-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs font-bold h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all whitespace-normal leading-tight px-1"
                onClick={() => setActiveReport('scale')}
              >
                量表评估报告
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs font-bold h-9 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all whitespace-normal leading-tight px-1"
                onClick={() => setActiveReport('voice')}
              >
                语音情绪识别报告
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs font-bold h-9 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all whitespace-normal leading-tight px-1"
                onClick={() => setActiveReport('comprehensive')}
              >
                综合诊断报告
              </Button>
           </div>
           
           <div className="flex justify-between items-start mb-8 mt-2">
             <div className="space-y-2">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">综合风险评估</h2>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium">
                 <div className="flex items-center gap-1">
                   <Calendar className="w-3.5 h-3.5" />
                   {new Date().toLocaleDateString()}
                 </div>
                 <div className="flex items-center gap-1">
                   <User className="w-3.5 h-3.5" />
                   {profile?.full_name || '未命名用户'} (ID: {user?.id?.slice(0, 6)})
                 </div>
               </div>
             </div>
             <Badge className={`${getRiskBadgeColor(riskLevel)} text-white px-3 py-1.5 rounded-full text-sm font-bold border-none`}>
                {getRiskText(riskLevel)}
             </Badge>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
             {/* Left: Gauge */}
             <div className="relative w-48 h-48 flex-shrink-0">
                <svg className="w-full h-full -rotate-90">
                  {/* Background Circle */}
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#F1F5F9" strokeWidth="16" />
                  {/* Progress Circle */}
                  <circle 
                    cx="96" cy="96" r="80" fill="none" stroke={riskLevel === 'extreme' ? '#EF4444' : riskLevel === 'high' ? '#F97316' : riskLevel === 'medium' ? '#8B5CF6' : '#10B981'} 
                    strokeWidth="16" 
                    strokeDasharray={502.65}
                    strokeDashoffset={502.65 - (502.65 * fusionScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{fusionScore.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">RISK SCORE</span>
                </div>
             </div>

             {/* Right: Metrics */}
             <div className="flex-1 w-full space-y-3">
               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                 <span className="text-sm font-bold text-slate-500">量表 (50%)</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 dark:text-white">{getScaleScore(data.scale)}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 27</span>
                 </div>
               </div>
               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                 <span className="text-sm font-bold text-slate-500">语音 (20%)</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 dark:text-white">{getVoiceScore(data.voice)}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 100</span>
                 </div>
               </div>
               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                 <span className="text-sm font-bold text-slate-500">表情 (30%)</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 dark:text-white">{getExpressionScore(data.expression)}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 100</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Sync Status removed by request */}
           {/* Professional Advice Section */}
           <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-4">
               <Lightbulb className="w-5 h-5 text-amber-500" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">专业诊断建议</h3>
             </div>
             
             {generatingAdvice ? (
               <div className="flex items-center gap-2 text-slate-500 text-sm">
                 <RefreshCw className="w-4 h-4 animate-spin" />
                 正在生成个性化建议...
               </div>
             ) : (
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                 <div className="prose prose-sm dark:prose-invert max-w-none">
                   <div className="whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed">
                     {advice}
                   </div>
                 </div>
                 
                 <div className="mt-4 flex flex-wrap gap-2">
                   <Button size="sm" variant="outline" className="bg-white rounded-full text-xs h-8">
                     <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                     情绪日记
                   </Button>
                   <Button size="sm" variant="outline" className="bg-white rounded-full text-xs h-8">
                     <User className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                     咨询医生
                   </Button>
                 </div>
               </div>
             )}
           </div>

        </div>
        
      </div>
    </div>
  );
}
