import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Calendar, CheckCircle2, Circle, Clock, 
  Target, Sparkles, BookOpen, Music, Heart, ArrowRight, Award, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function HealingPlanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');

  const dailyTasks = [
    { id: 1, title: '晨间呼吸冥想', time: '08:00', duration: '5分钟', type: 'meditation', completed: true },
    { id: 2, title: '心情随笔记录', time: '12:30', duration: '3分钟', type: 'record', completed: true },
    { id: 3, title: '午后正念行走', time: '14:00', duration: '10分钟', type: 'activity', completed: false },
    { id: 4, title: '睡前助眠引导', time: '22:30', duration: '15分钟', type: 'meditation', completed: false },
  ];

  const milestones = [
    { title: '初步评估', date: '2026-02-01', status: 'completed' },
    { title: '建立习惯', date: '2026-02-07', status: 'in-progress' },
    { title: '情绪稳定', date: '2026-02-14', status: 'pending' },
    { title: '阶段复盘', date: '2026-03-01', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-4 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">疗愈计划</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* 总体进度 */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">当前阶段：建立习惯</p>
                <h2 className="text-2xl font-bold mt-1">21天情绪重塑计划</h2>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                第 7 天
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>总进度 33%</span>
                <span>还剩 14 天</span>
              </div>
              <Progress value={33} className="h-2 bg-white/30" />
            </div>
            
            <div className="mt-6 flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>目标：每日坚持记录</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 标签切换 */}
        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >
            今日任务
          </button>
          <button 
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'roadmap' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >
            成长路线
          </button>
        </div>

        {activeTab === 'daily' ? (
          <div className="space-y-3">
            {dailyTasks.map((task) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${task.completed ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-white dark:bg-slate-900'}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                          {task.title}
                        </h3>
                        {task.type === 'meditation' && <Music className="w-3 h-3 text-indigo-400" />}
                        {task.type === 'record' && <BookOpen className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                        <span>时长：{task.duration}</span>
                      </div>
                    </div>
                    
                    {!task.completed && (
                      <Button size="sm" className="rounded-full h-8 text-xs font-bold px-4">
                        去完成
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            <div className="pt-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400">今日疗愈建议</p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
                    根据你最近的睡眠数据，建议今晚尝试“深海白噪音”助眠引导。保持规律作息是情绪稳定的基石。
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 py-4 px-2">
            {milestones.map((ms, index) => (
              <div key={ms.title} className="relative flex gap-6">
                {/* 连线 */}
                {index !== milestones.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-800" />
                )}
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  ms.status === 'completed' ? 'bg-primary text-white shadow-glow' : 
                  ms.status === 'in-progress' ? 'bg-white border-2 border-primary text-primary' : 
                  'bg-slate-100 text-slate-400'
                }`}>
                  {ms.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold ${ms.status === 'pending' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {ms.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">{ms.date}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {ms.status === 'completed' ? '已完成该阶段目标' : 
                     ms.status === 'in-progress' ? '当前正在努力实现该目标' : 
                     '锁定中，完成上一阶段后开启'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部卡片：更多计划 */}
        <div className="pt-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 px-1">探索更多计划</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { title: '正念减压', icon: Heart, color: 'bg-rose-500' },
              { title: '自信重塑', icon: Award, color: 'bg-amber-500' },
              { title: '职场焦虑', icon: Activity, color: 'bg-indigo-500' },
            ].map((p) => (
              <div key={p.title} className="flex-shrink-0 w-32 space-y-2">
                <div className={`${p.color} h-32 rounded-2xl flex items-center justify-center shadow-lg`}>
                  <p.icon className="w-10 h-10 text-white" />
                </div>
                <p className="text-xs font-bold text-center text-slate-600 dark:text-slate-300">{p.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
