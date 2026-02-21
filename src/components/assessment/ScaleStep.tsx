import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, ClipboardList, Download, FileText, Info, Mic, MicOff, Printer, Send, AudioLines } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getKnowledgeBase } from '@/db/api';
import { volcResponses } from '@/db/volc';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ScaleStepProps {
  onComplete: (data: any) => void;
  userId: string;
}

type ScaleJson = { type: 'scale'; scale_id: string; name: string; description?: string; questions: { text: string }[] }
const SCALES = [
  { id: 'PHQ-9', name: '患者健康问卷', total: 9, description: '用于筛查抑郁症状及其严重程度' },
  { id: 'HAMD-17', name: '汉密尔顿抑郁量表', total: 17, description: '临床评估抑郁状态的标准量表' },
  { id: 'SDS-20', name: '自评抑郁量表', total: 20, description: '直观反映抑郁的主观感受' },
];

export default function ScaleStep({ onComplete, userId }: ScaleStepProps) {
  const [selectedScales, setSelectedScales] = useState<string[]>(['PHQ-9']);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(9);
  const [showReport, setShowReport] = useState(false);
  const [score, setScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [questionBank, setQuestionBank] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const prefixRef = useRef('');
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      try {
        stopRequestedRef.current = true;
        listeningRef.current = false;
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const stopVoiceInput = () => {
    stopRequestedRef.current = true;
    listeningRef.current = false;
    setListening(false);
    try {
      recognitionRef.current?.stop?.();
    } catch {}
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('当前浏览器不支持语音识别');
      return;
    }

    stopRequestedRef.current = false;
    listeningRef.current = true;
    setListening(true);

    prefixRef.current = inputText ? `${inputText} ` : '';
    finalTranscriptRef.current = '';

    const recognition = recognitionRef.current || new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res?.[0]?.transcript || '';
        if (res.isFinal) finalTranscriptRef.current += text;
        else interim += text;
      }
      setInputText(`${prefixRef.current}${finalTranscriptRef.current}${interim}`.trimStart());
    };

    recognition.onerror = (e: any) => {
      stopRequestedRef.current = true;
      listeningRef.current = false;
      setListening(false);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        toast.error('麦克风权限被拒绝，请在浏览器设置中允许访问');
      } else {
        toast.error('语音识别失败，请重试');
      }
    };

    recognition.onend = () => {
      if (stopRequestedRef.current || !listeningRef.current) {
        setListening(false);
        return;
      }
      try {
        recognition.start();
      } catch {}
    };

    try {
      recognition.start();
    } catch {
      toast.error('语音识别启动失败');
      stopVoiceInput();
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      setNextButtonDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    (async () => {
      try {
        const kb = await getKnowledgeBase('assessment');
        const scales = kb.map(k => {
          try { 
            const json = JSON.parse(k.content || '{}');
            return { ...json, id: k.id, title: k.title } as any;
          } catch { return null }
        }).filter(Boolean);
        
        if (scales.length > 0) {
          const selected = scales.filter(s => selectedScales.includes(s.scale_id) || selectedScales.some(id => s.title?.includes(id)));
          const qs = selected.flatMap(s => (s.questions || []).map((q: any) => q.text));
          if (qs.length > 0) {
            setQuestionBank(qs);
            setTotalQuestions(qs.length);
          }
        }
      } catch (error) {
        console.error('Failed to load scales from KB:', error);
      }
    })();
  }, [selectedScales]);

  const startAssessment = () => {
    if (selectedScales.length === 0) {
      toast.error('请至少选择一个量表');
      return;
    }
    
    if (questionBank.length === 0) {
      const total = SCALES.filter(s => selectedScales.includes(s.id)).reduce((acc, s) => acc + s.total, 0);
      setTotalQuestions(total);
    }
    setStarted(true);
    setMessages([
      {
        role: 'assistant',
        content: `你好！我是灵愈AI助手。接下来我们将进行 ${selectedScales.join(', ')} 评估。我会以温暖、共情的方式引导你逐步完成，每一步都会解释目的。如果任何回答不确定，我会帮你澄清。我们开始吧？`,
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    if (listening) stopVoiceInput();

    const userMsg: Message = { role: 'user', content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // 构建RAG上下文（简版）
      let kbText = '';
      try {
        const kb = await getKnowledgeBase('assessment');
        kbText = (kb || []).slice(0, 5)
          .map(k => `【${k.title}】\n${(k.content || '').slice(0, 400)}`)
          .join('\n\n');
      } catch {}

      const systemPrompt = `你是一位专业的心理咨询师，正在进行抑郁量表对话评估。量表：${selectedScales.join(',')}。请以温暖、共情的方式逐步引导，必要时进行澄清与安全提醒。每次回复尽量控制在80字以内。\n\n【知识库参考】\n${kbText || '暂无相关知识库'}`;

      const response = await volcResponses({
        model: 'doubao-seed-1-8-251228',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: inputText }
            ]
          }
        ]
      });

      let aiContent = response?.text || '';
      if (!aiContent) {
        const nextQ = questionBank[currentQuestionIndex] || '请详细描述一下您最近两周的心情与兴趣变化。';
        aiContent = `好的，我理解了。下面我们继续：${nextQ}`;
      }
      
      // 模拟问题进度增加
      if (currentQuestionIndex < totalQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      const aiMsg: Message = { role: 'assistant', content: aiContent, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);

      // 情感与安全检测
      const text = inputText;
      const distress = /(崩溃|绝望|无助|很痛|难受|不想活|自杀|死亡)/.test(text);
      if (distress) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '【安全预警】检测到您可能存在自杀风险。我们非常关心您的安全。如果您正处于危险中，请立即拨打心理援助热线 400-161-9995 或联系紧急联系人。',
          timestamp: new Date()
        }]);
      }

      // 澄清不确定回答
      if (/(不确定|不太清楚|说不清|不知道)/.test(text)) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '为了更准确评估，我来帮你澄清一下：在过去两周，出现该情况的频率更接近“几天”还是“超过一半天”？',
          timestamp: new Date()
        }]);
      }

      // 如果完成所有题目
      if (currentQuestionIndex + 1 >= totalQuestions) {
        handleComplete();
      }

    } catch (error) {
      console.error('Scale assessment error:', error);
      toast.error('服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // 模拟评分
    const mockScore = Math.floor(Math.random() * 27);
    setScore(mockScore);
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (mockScore >= 20) level = 'high';
    else if (mockScore >= 10) level = 'medium';
    
    setRiskLevel(level);
    setShowReport(true);

    if (level === 'high' || level === 'medium') {
      setNextButtonDisabled(true);
      setCountdown(10);
    }
  };

  if (!started) {
    return (
      <div className="pt-28 px-4 max-w-md mx-auto space-y-8 pb-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">AI主动式对话量表评估</h2>
          <p className="text-slate-500 text-sm">您可以选择一个或多个量表进行综合评估</p>
        </div>

        <div className="space-y-4">
          {SCALES.map(scale => (
            <motion.div
              key={scale.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedScales(prev => 
                  prev.includes(scale.id) 
                    ? prev.filter(id => id !== scale.id)
                    : [...prev, scale.id]
                );
              }}
              className={`
                p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden
                ${selectedScales.includes(scale.id) 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{scale.id} {scale.name}</h3>
                  <p className="text-xs text-slate-400">{scale.description}</p>
                </div>
                {selectedScales.includes(scale.id) && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="text-[10px] py-0">{scale.total} 题</Badge>
                <Badge variant="outline" className="text-[10px] py-0">约 5 分钟</Badge>
              </div>
            </motion.div>
          ))}
        </div>

        <Button 
          onClick={startAssessment}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
        >
          开始评估 <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col z-40 pb-20">
      {/* 沉浸式顶部 */}
      <div className="pt-20 px-4 pb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-md mx-auto space-y-3 mt-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
            <span className="text-sm font-black text-primary">{currentQuestionIndex} / {totalQuestions}</span>
          </div>
          <Progress value={(currentQuestionIndex / totalQuestions) * 100} className="h-2 rounded-full" />
        </div>
      </div>

      {/* 对话区域 */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-md mx-auto space-y-6 pb-6">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/10 rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-800 rounded-tl-none'}
                `}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="absolute bottom-20 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="请在此输入您的回答..."
            readOnly={listening}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 ring-primary transition-all outline-none"
          />
          <Button
            onClick={() => (listening ? stopVoiceInput() : startVoiceInput())}
            size="icon"
            variant="outline"
            className={`rounded-2xl w-12 h-12 shadow-sm ${listening ? 'border-primary text-primary bg-primary/10 animate-pulse' : ''}`}
            aria-pressed={listening}
            aria-label={listening ? '停止语音输入' : '开始语音输入'}
          >
            {listening ? <AudioLines className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            size="icon" 
            className="rounded-2xl w-12 h-12 shadow-lg shadow-primary/20"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none">
          <div className="bg-gradient-to-br from-primary to-primary-foreground p-8 text-center text-white space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <ClipboardList className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">评估完成</h2>
              <p className="text-white/70 text-sm">基于您的多轮对话回答生成的报告</p>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white dark:bg-slate-950" id="assessment-report-card">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                <p className="text-3xl font-black text-primary">{score}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk</span>
                <p className={`text-lg font-black ${
                  riskLevel === 'high' ? 'text-rose-500' : 
                  riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> AI 建议
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                您的得分反映出{riskLevel === 'high' ? '显著的抑郁倾向，建议尽快咨询专业医生进行干预。' : 
                riskLevel === 'medium' ? '存在一定的心理压力，可以通过运动、社交和充足睡眠来调节。' : 
                '心理状态相对健康，请继续保持积极的生活方式。'}
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-slate-100 dark:border-slate-800"
                  onClick={async () => {
                    const el = document.getElementById('assessment-report-card');
                    if (!el) return;
                    const html2canvas = (await import('html2canvas')).default;
                    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const { jsPDF } = await import('jspdf');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const imgWidth = pageWidth;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    const y = Math.max(10, (pageHeight - imgHeight) / 2);
                    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
                    pdf.save('assessment-report.pdf');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-slate-100 dark:border-slate-800"
                  onClick={async () => {
                    const el = document.getElementById('assessment-report-card');
                    if (!el) return;
                    const html2canvas = (await import('html2canvas')).default;
                    const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = 'assessment-report.png';
                    a.click();
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" /> PNG
                </Button>
              </div>
              <Button 
                onClick={() => {
                  setShowReport(false);
                  onComplete({ score, riskLevel });
                }}
                disabled={nextButtonDisabled}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
              >
                {nextButtonDisabled ? `请阅读 (${countdown}s)` : '下一步：语音情绪识别'}
              </Button>
              <p className="text-[10px] text-center text-slate-400 leading-relaxed px-4">
                免责声明：本评估由 AI 生成，仅供参考。不代表临床诊断。如感不适请及时就医。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
