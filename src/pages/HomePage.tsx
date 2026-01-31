import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEmotionDiaries, getAssessments } from '@/db/api';
import { 
  ArrowRight, Check, Calendar, Radio, Users, FileText, 
  Sparkles, ShieldAlert, Activity 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { EmotionDiary, Assessment } from '@/types';

export default function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emotionDiaries, setEmotionDiaries] = useState<EmotionDiary[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [consecutiveDays, setConsecutiveDays] = useState(15);
  const [currentScore, setCurrentScore] = useState(75);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [diaries, assess] = await Promise.all([
        getEmotionDiaries(user.id, 30),
        getAssessments(user.id, 5),
      ]);
      setEmotionDiaries(diaries);
      setAssessments(assess);
      
      // 计算连续打卡天数
      calculateConsecutiveDays(diaries);
      
      // 计算当前情绪评分
      if (diaries.length > 0) {
        const latestDiary = diaries[0];
        const scoreMap = { very_bad: 20, bad: 40, neutral: 60, good: 80, very_good: 100 };
        setCurrentScore(scoreMap[latestDiary.emotion_level] || 75);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConsecutiveDays = (diaries: EmotionDiary[]) => {
    if (diaries.length === 0) {
      setConsecutiveDays(0);
      return;
    }
    
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < diaries.length; i++) {
      const diaryDate = new Date(diaries[i].diary_date);
      diaryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (diaryDate.getTime() === expectedDate.getTime()) {
        count++;
      } else {
        break;
      }
    }
    
    setConsecutiveDays(count);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getUserName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || '用户';
  };

  const getScoreLabel = () => {
    if (currentScore >= 80) return '优秀';
    if (currentScore >= 60) return '良好';
    if (currentScore >= 40) return '一般';
    return '需关注';
  };

  const quickActions = [
    {
      title: '写日记',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      link: '/record',
    },
    {
      title: '心理FM',
      icon: Radio,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      link: '/healing',
    },
    {
      title: '社区交流',
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      link: '/healing',
    },
    {
      title: '基因报告',
      icon: FileText,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      link: '/assessment',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">灵愈AI</h1>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <ShieldAlert className="w-5 h-5 mr-1" />
          SOS
        </Button>
      </div>
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* 欢迎卡片 */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 animate-fade-in-down">
          <CardContent className="p-6 relative">
            {/* 装饰性背景图案 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 border-8 border-white rounded-full" />
              <div className="absolute bottom-4 right-12 w-24 h-24 border-8 border-white rounded-full" />
              <div className="absolute top-12 right-20 w-16 h-16 border-8 border-white rounded-full" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {getGreeting()}, {getUserName()}
                </h2>
                <p className="text-white/90 text-base">
                  今天是你在灵愈AI的第 <span className="font-bold">{consecutiveDays}</span> 天, 情绪{currentScore >= 60 ? '非常稳定' : '需要关注'}呀!
                </p>
              </div>
              
              <Link to="/assessment">
                <Button 
                  className="bg-white text-emerald-600 hover:bg-white/90 shadow-lg h-12 px-6 rounded-full font-medium"
                >
                  开始今日评估
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        {/* 数据展示区 */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* 情绪评分 */}
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-slate-800">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                {/* 圆形进度条 */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - currentScore / 100)}`}
                    className="text-emerald-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-slate-800 dark:text-slate-200">{currentScore}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{getScoreLabel()}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">当前情绪评分</p>
            </CardContent>
          </Card>

          {/* 连续打卡 */}
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-slate-800">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {consecutiveDays} <span className="text-xl text-slate-500 dark:text-slate-400">天</span>
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">连续打卡天数</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 快捷入口 */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 px-1">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">快捷入口</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.link}>
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white dark:bg-slate-800">
                    <CardContent className="p-6 flex flex-col items-center justify-center">
                      <div className={`w-14 h-14 rounded-2xl ${action.bgColor} flex items-center justify-center mb-3`}>
                        <Icon className={`w-7 h-7 ${action.color}`} />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
        {/* 今日健康提示 */}

        {/* 最近评估 */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">最近评估</h3>
            <Link to="/assessment">
              <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                查看全部 →
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : assessments.length > 0 ? (
            assessments.slice(0, 3).map((assessment) => (
              <Card 
                key={assessment.id} 
                className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white dark:bg-slate-800"
                onClick={() => navigate('/assessment')}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          {assessment.assessment_type === 'PHQ-9' ? '抑郁风险深度评估' : 
                           assessment.assessment_type === 'GAD-7' ? '焦虑风险评估' : 
                           '心理健康评估'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(assessment.created_at).toLocaleDateString('zh-CN', { 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {assessment.risk_level !== undefined && (
                      <Badge 
                        className={`
                          ${assessment.risk_level >= 7 ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' : ''}
                          ${assessment.risk_level >= 4 && assessment.risk_level < 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : ''}
                          ${assessment.risk_level < 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : ''}
                          border-0
                        `}
                      >
                        {assessment.risk_level >= 7 ? '高度风险' : 
                         assessment.risk_level >= 4 ? '中度风险' : 
                         '低风险'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4">暂无评估记录</p>
                <Link to="/assessment">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                    开始评估
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
