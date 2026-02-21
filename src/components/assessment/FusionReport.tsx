import { AnimatePresence, motion } from 'framer-motion';
import { 
  Activity, Calendar, ChevronRight, Clock, Download, FileText, 
  History, Mic, RefreshCw, User, Video, X 
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { createRiskAlert, getAssessments, syncReport } from '@/db/api';
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

  // State for data (either from props or fetched)
  const [data, setData] = useState<{
    scale: any;
    voice: any;
    expression: any;
  }>({ scale: scaleData, voice: voiceData, expression: expressionData });

  // Calculations
  useEffect(() => {
    if (assessmentId) {
      loadAssessment(assessmentId);
    } else if (!scaleData && !voiceData && !expressionData) {
      fetchLatestAssessment();
    } else {
      calculateFusion(scaleData, voiceData, expressionData);
    }
  }, [scaleData, voiceData, expressionData, weights, assessmentId]);

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
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAssessment = async (id: string) => {
    // Implementation to load historical assessment
    // For now, we assume data is passed or we fetch it
    // If fetching, we would use getAssessmentById(id)
  };

  const calculateFusion = (sData: any, vData: any, eData: any) => {
    const scaleRaw = sData?.score || 0;
    let scaleNormalized = 0;
    if (scaleRaw <= 4) scaleNormalized = scaleRaw * 5;
    else if (scaleRaw <= 9) scaleNormalized = 20 + (scaleRaw - 5) * 4;
    else if (scaleRaw <= 14) scaleNormalized = 40 + (scaleRaw - 10) * 4;
    else if (scaleRaw <= 19) scaleNormalized = 60 + (scaleRaw - 15) * 4;
    else scaleNormalized = 80 + (scaleRaw - 20) * 2.5; // Cap at 100

    const voiceNormalized = vData?.score || 0; // Assume 0-100
    const expressionNormalized = eData?.depression_risk_score || 0; // Assume 0-100

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
      // Simulate progress
      const interval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

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
          generatedAt: new Date().toISOString()
        },
        weights
      });

      clearInterval(interval);
      setSyncProgress(100);
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
      const history = await getAssessments(user.id, 50); // Get recent 50
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

  // UI Helpers
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-500 shadow-emerald-500/20';
      case 'medium': return 'bg-amber-500 shadow-amber-500/20';
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
      case 'medium': return 'bg-[#F59E0B]';
      case 'high': return 'bg-[#F97316]';
      case 'extreme': return 'bg-[#EF4444]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 -ml-2">
            <X className="w-6 h-6 text-slate-900 dark:text-white" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
            多模态融合<br/>评估报告
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
                    cx="96" cy="96" r="80" fill="none" stroke={riskLevel === 'extreme' ? '#EF4444' : riskLevel === 'high' ? '#F97316' : riskLevel === 'medium' ? '#F59E0B' : '#10B981'} 
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
                   <span className="text-xl font-black text-slate-900 dark:text-white">{data.scale?.score || 0}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 27</span>
                 </div>
               </div>
               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                 <span className="text-sm font-bold text-slate-500">语音 (20%)</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 dark:text-white">{data.voice?.score || 0}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 100</span>
                 </div>
               </div>
               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
                 <span className="text-sm font-bold text-slate-500">表情 (30%)</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-slate-900 dark:text-white">{data.expression?.depression_risk_score || 0}</span>
                   <span className="text-xs text-slate-400 font-bold">/ 100</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Sync Status */}
           <div className="mt-8 flex justify-end">
             <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
               <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
               <span className="text-xs font-bold text-slate-500">
                 {syncStatus === 'syncing' ? '正在同步...' : 
                  syncStatus === 'success' ? '已同步至 报告中心' : '准备就绪'}
               </span>
             </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
           <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 text-slate-800 justify-center gap-2 shadow-sm text-lg font-bold">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
               <FileText className="w-4 h-4" />
             </div>
             量表报告
           </Button>
           <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-800 justify-center gap-2 shadow-sm text-lg font-bold">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
               <Mic className="w-4 h-4" />
             </div>
             语音报告
           </Button>
           <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-800 justify-center gap-2 shadow-sm text-lg font-bold">
             <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
               <Video className="w-4 h-4" />
             </div>
             表情报告
           </Button>
        </div>
        
      </div>
    </div>
  );
}
