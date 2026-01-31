import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, ClipboardList, Info, ChevronRight, 
  Sparkles, Moon, Brain, Users, LineChart, 
  Heart, Star, Zap, Coffee
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmotionDiaries } from '@/db/api';
import EmotionAvatar from '@/components/home/EmotionAvatar';

export default function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentEmotion, setCurrentEmotion] = useState<'very_good' | 'good' | 'neutral' | 'bad' | 'very_bad'>('neutral');
  const [moodIndex, setMoodIndex] = useState<number | string>('--');

  useEffect(() => {
    if (user) {
      loadLatestEmotion();
    }
  }, [user]);

  const loadLatestEmotion = async () => {
    try {
      const diaries = await getEmotionDiaries(user!.id, 1);
      if (diaries && diaries.length > 0) {
        const latest = diaries[0];
        setCurrentEmotion(latest.emotion_level as any);
        
        // 计算模拟指数
        const scoreMap = { very_good: 95, good: 80, neutral: 60, bad: 40, very_bad: 20 };
        setMoodIndex(scoreMap[latest.emotion_level as keyof typeof scoreMap] || 60);
      }
    } catch (error) {
      setCurrentEmotion('neutral');
      setMoodIndex('--');
    }
  };

  const getTitle = () => {
    const titles = {
      very_good: '元气满满 ✨',
      good: '状态不错 🍀',
      neutral: '蓄势待发 ☁️',
      bad: '需要抱抱 💧',
      very_bad: '火山预警 💢'
    };
    return titles[currentEmotion] || titles.neutral;
  };

  const miniGames = [
    {
      title: '测抑郁',
      desc: '探索心灵之海',
      icon: '🌊',
      color: 'bg-blue-50',
      tag: 'NEW',
      link: '/assessment'
    },
    {
      title: '歪脖子大赛',
      desc: '30s缓解颈部不适',
      icon: '🦒',
      color: 'bg-orange-50',
      link: '/healing'
    },
    {
      title: '睡眠小巢',
      desc: '3D自然音助眠',
      icon: '🌙',
      color: 'bg-indigo-50',
      link: '/healing'
    },
    {
      title: 'AI咨询师小语',
      desc: '适合心理困扰',
      icon: '👩‍⚕️',
      color: 'bg-purple-50',
      link: '/healing'
    }
  ];

  const funAssessments = [
    {
      title: '测测你的情绪植物',
      desc: '拯救美丽的情绪状态',
      tags: ['情绪花园', '心情绿洲'],
      icon: '🌵',
      link: '/assessment'
    },
    {
      title: '测测你拥有一种“动物睡眠”？',
      desc: '原来我的睡眠动物是它',
      tags: ['高质量睡眠', '睡眠动物'],
      icon: '🐻',
      link: '/assessment'
    },
    {
      title: '测一测你的 MBTI 动物',
      desc: '原来这才是我的舒适圈',
      tags: ['动物人格', '性格探险'],
      icon: '🐼',
      link: '/assessment'
    },
    {
      title: '你的抑郁情绪有多深？',
      desc: '探索心灵之海',
      tags: ['情绪深度', '内心温度'],
      icon: '🌊',
      link: '/assessment'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* 顶部标题栏 */}
      <div className="px-6 pt-12 text-center space-y-2">
        <motion.h1 
          key={getTitle()}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2"
        >
          {getTitle()}
          <ChevronRight className="w-6 h-6 text-slate-300" />
        </motion.h1>
        <div className="flex items-center justify-center gap-1 text-slate-400 text-sm font-medium">
          <span>心情指数:</span>
          <span className="text-slate-600 dark:text-slate-200 font-bold">{moodIndex}</span>
          <Info className="w-3 h-3 cursor-help" />
        </div>
      </div>

      {/* 核心 3D 情绪 Avatar */}
      <section className="py-8 relative overflow-hidden">
        <EmotionAvatar emotion={currentEmotion} />
      </section>

      <div className="max-w-md mx-auto px-4 space-y-8">
        {/* 解压小游戏 */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            解压小游戏
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {miniGames.map((game, idx) => (
              <motion.div
                key={game.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(game.link)}
                className={`relative p-4 rounded-3xl ${game.color} dark:bg-slate-900 border border-transparent hover:border-black/5 transition-all cursor-pointer group`}
              >
                {game.tag && (
                  <Badge className="absolute -top-1 -right-1 bg-rose-500 text-white border-white scale-75 font-black px-1.5 py-0">
                    {game.tag}
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500">
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{game.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{game.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 趣味测评 */}
        <section className="space-y-4 pb-10">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            趣味测评
          </h2>
          <div className="space-y-3">
            {funAssessments.map((assessment, idx) => (
              <motion.div
                key={assessment.title}
                whileHover={{ x: 5 }}
                onClick={() => navigate(assessment.link)}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shrink-0">
                  {assessment.icon}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{assessment.title}</h3>
                  <p className="text-xs text-slate-400">{assessment.desc}</p>
                  <div className="flex gap-2">
                    {assessment.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
