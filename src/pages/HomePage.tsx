import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { 
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEmotionDiaries } from '@/db/api';
import EmotionAvatar from '@/components/home/EmotionAvatar';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentEmotion, setCurrentEmotion] = useState<'very_good' | 'good' | 'neutral' | 'bad' | 'very_bad'>('neutral');

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
      }
    } catch (error) {
      setCurrentEmotion('neutral');
    }
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
      {/* 核心 3D 情绪 Avatar 和心情指数 */}
      <section className="pt-16 pb-8 relative overflow-hidden">
        <div className="flex items-center justify-center gap-6 max-w-sm mx-auto px-4">
          {/* 3D Avatar */}
          <div className="flex-shrink-0">
            <EmotionAvatar emotion={currentEmotion} />
          </div>
          
          {/* 心情指数信息 */}
          <div className="flex flex-col items-start space-y-3">
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              状态不错
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">心情指数:</span>
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100">86</span>
              <Info className="w-4 h-4 cursor-help text-slate-400 hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 space-y-8">
        {/* 解压小游戏 */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            解压小游戏
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {miniGames.map((game) => (
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
            {funAssessments.map((assessment) => (
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
