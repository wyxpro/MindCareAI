import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createEmotionDiary, getEmotionDiaries, chatCompletion } from '@/db/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Smile, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { EmotionDiary, EmotionLevel } from '@/types';

const EMOTIONS = [
  { level: 'very_good' as EmotionLevel, label: '极好', emoji: '😄', color: 'bg-gradient-to-br from-success/20 to-success/10 text-success border-success/30 hover:border-success/50 hover:shadow-success-glow' },
  { level: 'good' as EmotionLevel, label: '不错', emoji: '😊', color: 'bg-gradient-to-br from-info/20 to-info/10 text-info border-info/30 hover:border-info/50 hover:shadow-glow' },
  { level: 'neutral' as EmotionLevel, label: '一般', emoji: '😐', color: 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border-border hover:border-muted-foreground/30' },
  { level: 'bad' as EmotionLevel, label: '难过', emoji: '😔', color: 'bg-gradient-to-br from-warning/20 to-warning/10 text-warning border-warning/30 hover:border-warning/50' },
  { level: 'very_bad' as EmotionLevel, label: '糟糕', emoji: '😢', color: 'bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive border-destructive/30 hover:border-destructive/50' },
];

const TRIGGERS = ['睡眠不足', '工作压力', '家庭琐事', '运动', '社交活动', '天气阴郁', '身体不适', '学习困难', '人际关系', '经济压力', '饮食不规律', '其他'];

const getEmotionColor = (level: EmotionLevel) => {
  const colors = { 
    very_good: 'bg-success/10 border-success/30', 
    good: 'bg-info/10 border-info/30', 
    neutral: 'bg-muted border-border', 
    bad: 'bg-warning/10 border-warning/30', 
    very_bad: 'bg-destructive/10 border-destructive/30' 
  };
  return colors[level] || 'bg-background';
};

const getEmotionEmoji = (level: EmotionLevel) => EMOTIONS.find(e => e.level === level)?.emoji || '😐';

export default function RecordPageNew() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaries, setDiaries] = useState<EmotionDiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotionLevel, setEmotionLevel] = useState<EmotionLevel>('neutral');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');

  useEffect(() => { if (user) loadDiaries(); }, [user, currentMonth]);

  const loadDiaries = async () => {
    if (!user) return;
    try {
      const data = await getEmotionDiaries(user.id, 100);
      setDiaries(data);
    } catch (error) {
      console.error('加载日记失败:', error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const getDiaryForDate = (date: Date) => diaries.find(d => isSameDay(new Date(d.diary_date), date));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const diary = getDiaryForDate(date);
    if (diary) {
      setEmotionLevel(diary.emotion_level);
      setSelectedTriggers(diary.tags || []);
      setContent(diary.content || '');
      setAiAnalysis(typeof diary.ai_analysis === 'string' ? diary.ai_analysis : '');
    } else {
      setEmotionLevel('neutral');
      setSelectedTriggers([]);
      setContent('');
      setAiAnalysis('');
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]);
  };

  const handleSave = async () => {
    if (!user) { toast.error('请先登录'); return; }
    if (!content.trim()) { toast.error('请写下你的心情'); return; }
    setLoading(true);
    try {
      setAnalyzing(true);
      const analysisResponse = await chatCompletion([
        { role: 'system', content: '你是一位专业的心理咨询师,请根据用户的情绪日记进行简短的分析和建议,控制在80字以内。' },
        { role: 'user', content: `情绪等级:${emotionLevel}\n触发因素:${selectedTriggers.join('、')}\n日记内容:${content}` },
      ]);
      const analysis = analysisResponse?.choices?.[0]?.delta?.content || '暂无分析';
      setAiAnalysis(analysis);
      setAnalyzing(false);
      await createEmotionDiary({ user_id: user.id, diary_date: format(selectedDate, 'yyyy-MM-dd'), emotion_level: emotionLevel, content, tags: selectedTriggers, ai_analysis: analysis });
      toast.success('记录已保存');
      await loadDiaries();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败,请重试');
      setAnalyzing(false);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklySummary = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekDiaries = diaries.filter(d => { const diaryDate = new Date(d.diary_date); return diaryDate >= weekAgo && diaryDate <= today; });
    if (weekDiaries.length === 0) return null;
    const emotionToNumber = (level: EmotionLevel): number => ({ very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 }[level] || 3);
    const avgEmotion = (weekDiaries.reduce((sum, d) => sum + emotionToNumber(d.emotion_level), 0) / weekDiaries.length).toFixed(1);
    const improvement = emotionToNumber(weekDiaries[0]?.emotion_level) > emotionToNumber(weekDiaries[weekDiaries.length - 1]?.emotion_level);
    return { avgEmotion, improvement, count: weekDiaries.length };
  };

  const weeklySummary = getWeeklySummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-primary">📅</span>
                  {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight className="w-5 h-5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, index) => <div key={`empty-${index}`} className="aspect-square" />)}
                {daysInMonth.map(date => {
                  const diary = getDiaryForDate(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());
                  return (
                    <button key={date.toISOString()} onClick={() => handleDateClick(date)} className={`aspect-square rounded-2xl p-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${diary ? getEmotionColor(diary.emotion_level) : 'bg-background hover:bg-muted'} ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''} ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''} hover:scale-105 hover:shadow-md`}>
                      <span className={`text-sm font-semibold ${diary ? 'text-foreground' : 'text-muted-foreground'}`}>{format(date, 'd')}</span>
                      {diary && <span className="text-lg">{getEmotionEmoji(diary.emotion_level)}</span>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {weeklySummary && (
            <></>
          )}
        </div>
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="w-5 h-5 text-primary" />
                记录此时心情
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{format(selectedDate, 'M月d日 EEEE', { locale: zhCN })}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">今天感觉如何?</h4>
                <div className="grid grid-cols-5 gap-2">
                  {EMOTIONS.map(emotion => (
                    <button key={emotion.level} onClick={() => setEmotionLevel(emotion.level)} className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${emotionLevel === emotion.level ? emotion.color + ' scale-110 shadow-md' : 'bg-muted hover:bg-muted/80'}`}>
                      <span className="text-2xl">{emotion.emoji}</span>
                      <span className="text-xs font-medium">{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">触发因素 (可选)</h4>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map(trigger => <Badge key={trigger} variant={selectedTriggers.includes(trigger) ? 'default' : 'outline'} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => toggleTrigger(trigger)}>{trigger}</Badge>)}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">随手记</h4>
                <Textarea placeholder="写下点什么..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="resize-none" />
              </div>
              {aiAnalysis && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="text-primary">🤖</span>
                    AI分析
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis}</p>
                </div>
              )}
              <Button onClick={handleSave} disabled={loading || !content.trim()} className="w-full h-12 text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg">
                {analyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />AI分析中...</> : loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />保存中...</> : '保存记录'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
