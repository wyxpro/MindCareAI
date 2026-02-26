import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Heart, MessageCircle, 
  Wind, Moon, ChevronRight,
  Users, Flower2, Music, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmotionDiaries } from '@/db/api';

// 动画配置已内联到组件中

export default function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [moodScore, setMoodScore] = useState(86);
  const [moodStatus, setMoodStatus] = useState('心情很棒');
  const [greeting, setGreeting] = useState('');
  const [currentQuote, setCurrentQuote] = useState(0);

  // 轮播图片数量
  const carouselImages = 3;

  const quotes = [
    { text: '每一次呼吸，都是新的开始', author: '灵愈AI' },
    { text: '善待自己的情绪，它们值得被倾听', author: '灵愈AI' },
    { text: '内心的平静，是最好的礼物', author: '灵愈AI' },
    { text: '你比你想象中更强大', author: '灵愈AI' },
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了');
    else if (hour < 9) setGreeting('早上好');
    else if (hour < 12) setGreeting('上午好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');

    // 自动轮播图片
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % carouselImages);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
        const emotionScores = {
          'very_good': 95,
          'good': 85,
          'neutral': 75,
          'bad': 40,
          'very_bad': 20
        };
        setMoodScore(emotionScores[latest.emotion_level as keyof typeof emotionScores] || 75);
      }
    } catch (error) {
      setMoodScore(75);
    }
  };



  // 主要功能 - 大卡片设计
  const mainFeatures = [
    {
      title: '开始评估',
      subtitle: 'AI心理测评',
      desc: '了解你的内心世界',
      icon: Sparkles,
      gradient: 'from-rose-300 via-pink-400 to-purple-400',
      shadow: 'shadow-rose-200',
      link: '/assessment',
      size: 'large'
    },
    {
      title: '记录心情',
      subtitle: '情绪日记',
      desc: '记录每一天的感受',
      icon: Heart,
      gradient: 'from-orange-300 via-amber-300 to-yellow-300',
      shadow: 'shadow-orange-200',
      link: '/record',
      size: 'small'
    },
    {
      title: '放松疗愈',
      subtitle: '冥想空间',
      desc: '找到内心的宁静',
      icon: Flower2,
      gradient: 'from-teal-300 via-emerald-300 to-green-300',
      shadow: 'shadow-teal-200',
      link: '/healing',
      size: 'small'
    }
  ];

  // 快捷功能 - 圆形图标
  const quickActions = [
    { title: 'AI对话', icon: MessageCircle, color: 'bg-violet-100 text-violet-600', link: '/healing' },
    { title: '睡眠', icon: Moon, color: 'bg-indigo-100 text-indigo-600', link: '/healing' },
    { title: '呼吸', icon: Wind, color: 'bg-sky-100 text-sky-600', link: '/healing' },
    { title: '音乐', icon: Music, color: 'bg-rose-100 text-rose-600', link: '/healing' },
    { title: '更多', icon: Palette, color: 'bg-amber-100 text-amber-600', link: '/healing' },
  ];

  // 精选内容
  const featuredContent = [
    {
      title: '3分钟缓解焦虑',
      type: '冥想',
      duration: '3分钟',
      image: '🌸',
      bgColor: 'bg-gradient-to-br from-pink-100 to-rose-100',
      tag: '热门'
    },
    {
      title: '深度睡眠引导',
      type: '助眠',
      duration: '15分钟',
      image: '🌙',
      bgColor: 'bg-gradient-to-br from-indigo-100 to-purple-100',
      tag: '推荐'
    },
    {
      title: '正念晨间练习',
      type: '正念',
      duration: '10分钟',
      image: '☀️',
      bgColor: 'bg-gradient-to-br from-amber-100 to-orange-100',
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 pb-24">
      {/* 顶部区域 - 柔和渐变背景 */}
      <div className="relative overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/80 via-purple-50/50 to-transparent dark:from-slate-900 dark:via-slate-900/50" />
        
        {/* 装饰圆形 */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 right-0 w-72 h-72 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl" 
        />

        <div className="relative z-10 px-5 pt-8 pb-6">
          <div className="max-w-md mx-auto">
            {/* 顶部导航 */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">{greeting}</p>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {profile?.full_name || '朋友'} ✨
                </h1>
              </div>
            </motion.div>


          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="px-5 max-w-md mx-auto space-y-6">
        {/* 每日心语 - 图片轮播 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl shadow-xl -mt-4"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="relative w-full h-48 overflow-hidden"
            >
              <img
                src={`/srcs/img/${currentQuote + 1}.png`}
                alt={`轮播图 ${currentQuote + 1}`}
                className="w-full h-full object-cover"
              />
              {/* 阴影遮罩层，使指示器更清晰 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* 指示器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentQuote(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentQuote ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* 主要功能 - 瀑布流卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">探索功能</h3>
            <span className="text-xs text-slate-400"></span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 大卡片 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(mainFeatures[0].link)}
              className={`col-span-2 relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${mainFeatures[0].gradient} ${mainFeatures[0].shadow} shadow-lg cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-white/30 text-white border-none text-[10px]">
                    {mainFeatures[0].subtitle}
                  </Badge>
                </div>
                <h4 className="text-xl font-bold text-white mb-1">{mainFeatures[0].title}</h4>
                <p className="text-white/80 text-sm">{mainFeatures[0].desc}</p>
              </div>
            </motion.div>

            {/* 两个小卡片 */}
            {mainFeatures.slice(1).map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(feature.link)}
                  className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${feature.gradient} ${feature.shadow} shadow-lg cursor-pointer`}
                >
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full" />
                  <div className="relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center mb-3">
                      <FeatureIcon className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-0.5">{feature.title}</h4>
                    <p className="text-white/70 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 快捷功能 - 圆形图标 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.link)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-lg`}>
                  {action.icon === MessageCircle && <MessageCircle className="w-6 h-6" />}
                  {action.icon === Moon && <Moon className="w-6 h-6" />}
                  {action.icon === Wind && <Wind className="w-6 h-6" />}
                  {action.icon === Music && <Music className="w-6 h-6" />}
                  {action.icon === Palette && <Palette className="w-6 h-6" />}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {action.title}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 精选内容 - 横向滚动卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">精选内容</h3>
            <motion.button 
              whileHover={{ x: 3 }}
              onClick={() => navigate('/healing')}
              className="text-sm text-violet-600 font-medium flex items-center gap-1"
            >
              全部 <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {featuredContent.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate('/healing')}
                className="flex-shrink-0 w-40 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 cursor-pointer"
              >
                <div className={`h-24 ${item.bgColor} flex items-center justify-center text-4xl relative`}>
                  {item.tag && (
                    <Badge className="absolute top-2 left-2 bg-white/80 text-slate-700 border-none text-[9px]">
                      {item.tag}
                    </Badge>
                  )}
                  {item.image}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-slate-400 mb-1">{item.type} · {item.duration}</p>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {item.title}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 社区卡片 - 底部 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pb-6"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/healing')}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 p-5 shadow-xl shadow-rose-200 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-white" />
                  <span className="text-white font-bold">温暖社区</span>
                </div>
                <p className="text-white/80 text-sm">
                  与 2,000+ 伙伴分享心情
                </p>
              </div>
              <div className="flex -space-x-2">
                {['🧘', '🌸', '🌿'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-lg border-2 border-white/50">
                    {emoji}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border-2 border-white/50">
                  +99
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
