import { 
  Bookmark, Heart, Moon,
  Music, Pause, PenLine, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Trash2, Volume2,
  Sparkles, Cloud, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import CommunityTab from '@/components/healing/CommunityTab';
import ContentDetailDialog from '@/components/healing/ContentDetailDialog';
import DiaryTab from '@/components/healing/DiaryTab';
import KnowledgeTab from '@/components/healing/KnowledgeTab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createMeditationSession,
  deleteHealingContent,
  getHealingContents, 
  getMeditationStats,
  toggleFavorite,
} from '@/db/api';
import type { HealingContent } from '@/types';

type LoopMode = 'one' | 'all' | 'shuffle';

const MEDITATION_CATEGORIES = [
  { id: 'all', label: '全部', icon: Sparkles, color: 'from-violet-400 to-purple-500' },
  { id: 'relax', label: '放松', icon: Cloud, color: 'from-sky-400 to-blue-500' },
  { id: 'sleep', label: '睡眠', icon: Moon, color: 'from-indigo-400 to-violet-500' },
  { id: 'focus', label: '专注', icon: Zap, color: 'from-amber-400 to-orange-500' },
];

const CONTENT_GRADIENTS = [
  'from-emerald-400 via-teal-400 to-cyan-400',
  'from-violet-400 via-purple-400 to-pink-400',
  'from-blue-400 via-indigo-400 to-violet-400',
  'from-rose-400 via-pink-400 to-fuchsia-400',
  'from-amber-400 via-orange-400 to-rose-400',
];

// 动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

// scaleVariants 用于组件动画

const rawMusicFiles = [
  'Lisure .mp3',
  '叹云兮 - 鞠婧祎.mp3',
  '相思遥 (Live版) - 郁可唯_弦子.mp3',
  '落了白 - 蒋雪儿Snow.J.mp3',
] as const;

// 根据环境判断基础URL
const getBaseUrl = () => {
  // 如果是本地开发环境
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/srcs/music';
  }
  // 上线版本使用完整URL
  return 'https://k.playe.top/srcs/music';
};

const meditationTracks = rawMusicFiles
  .map((fileName) => {
    const nameWithoutExt = fileName.replace(/\.(mp3|ogg|wav|m4a)$/i, '');
    const [title, artist] = nameWithoutExt.split(' - ');
    const url = `${getBaseUrl()}/${encodeURIComponent(fileName)}`;
    return {
      id: fileName,
      url,
      title: (title || nameWithoutExt).trim(),
      artist: (artist || '').trim(),
      fileName,
    };
  })
  .sort((a, b) => a.fileName.localeCompare(b.fileName, 'zh-Hans-CN'));

export default function HealingPageNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('meditation');
  const [activeCategory, setActiveCategory] = useState('all');
  const [healingContent, setHealingContent] = useState<HealingContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<HealingContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>('all');
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [meditationStats, setMeditationStats] = useState({ totalMinutes: 128, totalSessions: 12, averageRating: 0 });
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [moodAfter, setMoodAfter] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDetailContent, setSelectedDetailContent] = useState<HealingContent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<HealingContent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const loopModeRef = useRef<LoopMode>('all');
  const trackIndexRef = useRef(0);
  const wantPlayRef = useRef(false);
  const playLockRef = useRef(false);
  const lastActionAtRef = useRef(0);

  useEffect(() => {
    loadData();
  }, [activeCategory]);

  // 处理从其他页面传入的 tab 状态
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // 清除 state 避免刷新后仍生效
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (healingContent.length > 0 && !selectedContent) {
      setSelectedContent(healingContent[0]);
    }
  }, [healingContent]);

  useEffect(() => {
    if (user) {
      loadMeditationStats();
    }
  }, [user]);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  useEffect(() => {
    if (activeTab !== 'meditation') return;
    // 不显示错误提示
    setPlayError(null);
  }, [activeTab]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (meditationTracks.length === 0) return;
    const current = meditationTracks[trackIndex];
    
    // 直接加载音频，不预先检查文件是否存在
    const loadAudio = () => {
      audio.preload = 'auto';
      audio.src = current.url;
      audio.volume = muted ? 0 : volume;
      audio.load();
      
      // 音频可以播放时自动播放
      const handleCanPlay = () => {
        if (wantPlayRef.current) {
          audio.play().catch(() => {});
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };
      audio.addEventListener('canplay', handleCanPlay);
      
      // 预加载下一首
      const nextIndex = (trackIndex + 1) % meditationTracks.length;
      const preloader = new Audio();
      preloader.preload = 'auto';
      preloader.src = meditationTracks[nextIndex].url;
      preloader.load();
      preloadRef.current = preloader;
    };
    
    loadAudio();

    return () => {
      preloadRef.current = null;
    };
  }, [trackIndex, muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setTotalTime(Math.floor(duration));
    };
    const onTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime || 0));
    };
    const onPlay = () => {
      wantPlayRef.current = true;
      setIsPlaying(true);
    };
    const onPause = () => {
      wantPlayRef.current = false;
      setIsPlaying(false);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onEnded = () => {
      setBuffering(false);
      if (meditationTracks.length === 0) return;
      wantPlayRef.current = true;
      const mode = loopModeRef.current;
      const current = trackIndexRef.current;
      if (mode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      if (mode === 'shuffle') {
        const next = meditationTracks.length <= 1 ? current : (() => {
          let candidate = current;
          while (candidate === current) {
            candidate = Math.floor(Math.random() * meditationTracks.length);
          }
          return candidate;
        })();
        setTrackIndex(next);
        return;
      }
      const next = (current + 1) % meditationTracks.length;
      setTrackIndex(next);
    };
    const onError = () => {
      const current = meditationTracks[trackIndexRef.current];
      setBuffering(false);
      setIsPlaying(false);
      // 静默处理错误，不显示提示
      console.log(`音乐加载失败：${current?.fileName || '未知文件'}`);
      // 自动切换到下一首
      if (meditationTracks.length > 1) {
        setTrackIndex((prev) => (prev + 1) % meditationTracks.length);
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'meditation') {
        const contentData = await getHealingContents(activeCategory === 'all' ? undefined : activeCategory);
        setHealingContent(contentData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeditationStats = async () => {
    if (!user) return;
    try {
      const stats = await getMeditationStats(user.id);
      setMeditationStats({
        totalMinutes: (stats as any).totalMinutes ?? 0,
        totalSessions: (stats as any).totalSessions ?? 0,
        averageRating: (stats as any).averageRating ?? 0,
      });
    } catch (error) {
      setMeditationStats({
        totalMinutes: 0,
        totalSessions: 0,
        averageRating: 0,
      });
    }
  };

  const handlePlayContent = (content: HealingContent) => {
    setSelectedContent(content);
    setCurrentTime(0);
    const audio = audioRef.current;
    if (audio) {
      wantPlayRef.current = false;
      playLockRef.current = true;
      audio.pause();
      audio.currentTime = 0;
      // 解锁在下一次事件循环，避免立即触发 play 导致 AbortError
      setTimeout(() => { playLockRef.current = false; }, 50);
    }
  };

  const togglePlay = async () => {
    if (meditationTracks.length === 0) {
      toast.error('未找到冥想音乐文件');
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    const now = Date.now();
    if (playLockRef.current || now - lastActionAtRef.current < 200) {
      return;
    }
    lastActionAtRef.current = now;
    setPlayError(null);
    try {
      if (audio.paused) {
        wantPlayRef.current = true;
        try {
          await audio.play();
        } catch (err: any) {
          if (String(err?.name) === 'AbortError') {
            // 被外部 pause 打断，忽略
            return;
          }
          throw err;
        }
      } else {
        wantPlayRef.current = false;
        audio.pause();
      }
    } catch (error) {
      console.error('播放失败:', error);
      setPlayError('播放被浏览器阻止或音频不可用');
      toast.error('播放失败，请再次点击播放');
    }
  };

  const playPrev = () => {
    if (meditationTracks.length === 0) return;
    setPlayError(null);
    setTrackIndex((prev) => (prev - 1 + meditationTracks.length) % meditationTracks.length);
  };

  const playNext = () => {
    if (meditationTracks.length === 0) return;
    setPlayError(null);
    if (loopModeRef.current === 'shuffle' && meditationTracks.length > 1) {
      const current = trackIndexRef.current;
      let candidate = current;
      while (candidate === current) {
        candidate = Math.floor(Math.random() * meditationTracks.length);
      }
      setTrackIndex(candidate);
      return;
    }
    setTrackIndex((prev) => (prev + 1) % meditationTracks.length);
  };

  const cycleLoopMode = () => {
    setLoopMode((prev) => (prev === 'all' ? 'one' : prev === 'one' ? 'shuffle' : 'all'));
  };

  const loopIcon = useMemo(() => {
    if (loopMode === 'one') return Repeat1;
    if (loopMode === 'shuffle') return Shuffle;
    return Repeat;
  }, [loopMode]);

  const progressValue = useMemo(() => {
    if (!totalTime) return 0;
    return Math.min(100, Math.max(0, (currentTime / totalTime) * 100));
  }, [currentTime, totalTime]);

  const currentTrackLabel = useMemo(() => {
    const track = meditationTracks[trackIndex];
    if (!track) return '';
    return track.artist ? `${track.title} · ${track.artist}` : track.title;
  }, [trackIndex]);

  const handleMeditationComplete = () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setMoodDialogOpen(true);
  };

  const handleSaveMood = async () => {
    if (!user || !selectedContent) return;
    try {
      await createMeditationSession({
        user_id: user.id,
        content_id: selectedContent.id,
        duration: currentTime,
        completed: true,
        mood_after: moodAfter,
      });
      toast.success('冥想记录已保存');
      setMoodDialogOpen(false);
      setMoodAfter('');
      setCurrentTime(0);
      await loadMeditationStats();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  const handleToggleFavorite = async (contentId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    try {
      const isFav = await toggleFavorite(user.id, contentId);
      setFavorites(prev => {
        const newSet = new Set(prev);
        isFav ? newSet.add(contentId) : newSet.delete(contentId);
        return newSet;
      });
      toast.success(isFav ? '已添加到收藏' : '已取消收藏');
    } catch (error) {
      console.error('收藏失败:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    try {
      await deleteHealingContent(contentToDelete.id);
      setHealingContent(prev => prev.filter(c => c.id !== contentToDelete.id));
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
       
        {/* 导航系统 - 冥想、树洞、日记、知识 */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-2"
        >
          {[
            { id: 'meditation', label: '冥想', icon: Music, colors: 'from-indigo-500 via-purple-500 to-pink-500' },
            { id: 'community', label: '树洞', icon: Heart, colors: 'from-blue-500 via-cyan-500 to-teal-500' },
            { id: 'diary', label: '日记', icon: PenLine, colors: 'from-rose-500 via-pink-500 to-fuchsia-500' },
            { id: 'knowledge', label: '知识', icon: Bookmark, colors: 'from-emerald-500 via-teal-500 to-cyan-500' },
          ].map((tab) => (
            <motion.div key={tab.id} variants={itemVariants}>
              <Button
                onClick={() => setActiveTab(tab.id)}
                className={`relative overflow-hidden rounded-2xl py-5 text-sm font-medium transition-all duration-300 w-full ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-muted-foreground hover:text-foreground backdrop-blur-sm'
                } active:scale-95`}
                style={{
                  boxShadow: activeTab === tab.id ? `0 8px 30px -10px rgba(99, 102, 241, 0.5)` : undefined
                }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.colors}`}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* 冥想Tab内容 */}
        <AnimatePresence mode="wait">
          {activeTab === 'meditation' && (
            <motion.div
              key="meditation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* 主播放器 - 全新设计 */}
              <Card className="relative overflow-hidden border-0 shadow-2xl shadow-indigo-900/30">
                {/* 动态背景渐变 - 深邃星空蓝紫 */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/50 via-transparent to-transparent" />
                
                {/* 星星装饰 */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse" />
                  <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute top-32 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                  <div className="absolute bottom-20 right-10 w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
                  <div className="absolute bottom-32 left-20 w-1 h-1 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute top-1/2 right-1/3 w-0.5 h-0.5 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                </div>
                
                {/* 装饰光晕 - 星云效果 */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                
                <CardContent className="relative p-6 md:p-8">
                  {/* 状态标签 */}
                  <motion.div 
                    className="flex justify-center mb-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className={`px-4 py-1.5 text-xs font-medium border-0 ${
                      isPlaying 
                        ? 'bg-indigo-500/30 text-indigo-100 backdrop-blur-md shadow-lg shadow-indigo-500/20' 
                        : 'bg-indigo-500/20 text-indigo-200/80 backdrop-blur-sm'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        {isPlaying && (
                          <span className="flex gap-0.5">
                            <span className="w-1 h-3 bg-indigo-300 rounded-full animate-[bounce_1s_infinite]" />
                            <span className="w-1 h-3 bg-purple-300 rounded-full animate-[bounce_1s_infinite_0.1s]" />
                            <span className="w-1 h-3 bg-pink-300 rounded-full animate-[bounce_1s_infinite_0.2s]" />
                          </span>
                        )}
                        {isPlaying ? '正在播放' : '已暂停'}
                      </span>
                    </Badge>
                  </motion.div>

                  {/* 标题区域 */}
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {selectedContent?.title || '5分钟呼吸导引'}
                    </h2>
                    <p className="text-indigo-200/80 text-sm">
                      {selectedContent?.description || '跟随圆圈来缓呼吸'}
                    </p>
                    {currentTrackLabel && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-purple-300/70 text-xs mt-2 font-medium"
                      >
                        ♪ {currentTrackLabel}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* 呼吸动画圆形 - 星空版 */}
                  <motion.div 
                    className="flex justify-center mb-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <div className="relative w-32 h-32">
                      {/* 外层波纹 - 星空紫 */}
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                        animate={isPlaying ? {
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.2, 0.5],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div 
                        className="absolute inset-2 rounded-full border-2 border-purple-400/40"
                        animate={isPlaying ? {
                          scale: [1, 1.15, 1],
                          opacity: [0.6, 0.3, 0.6],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      />
                      <motion.div 
                        className="absolute inset-4 rounded-full border-2 border-pink-400/30"
                        animate={isPlaying ? {
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 0.4, 0.7],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                      />
                      {/* 中心圆 - 深空效果 */}
                      <motion.div 
                        className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 backdrop-blur-md shadow-2xl flex items-center justify-center border border-indigo-400/50"
                        animate={isPlaying ? {
                          boxShadow: [
                            '0 0 30px rgba(99, 102, 241, 0.5)',
                            '0 0 60px rgba(99, 102, 241, 0.7)',
                            '0 0 30px rgba(99, 102, 241, 0.5)',
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Music className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* 进度条 - 星空版 */}
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-between text-xs text-indigo-200/60 mb-2 font-medium">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(totalTime || 0)}</span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full"
                        style={{ width: `${progressValue}%` }}
                        layoutId="progress"
                      />
                      {/* 进度条星光效果 */}
                      <div 
                        className="absolute inset-y-0 w-4 bg-indigo-400/60 blur-sm rounded-full"
                        style={{ left: `calc(${progressValue}% - 8px)` }}
                      />
                    </div>
                  </motion.div>

                  {/* 播放控制 - 星空版 */}
                  <motion.div 
                    className="flex items-center justify-center gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <audio ref={(el) => { audioRef.current = el; }} preload="auto" />
                    
                    {/* 上一首 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={playPrev}
                      disabled={meditationTracks.length === 0}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 border border-white/20"
                    >
                      <SkipBack className="w-5 h-5" />
                    </motion.button>
                    
                    {/* 播放/暂停 - 主按钮 */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlay}
                      disabled={meditationTracks.length === 0}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all disabled:opacity-50 border border-indigo-400/50"
                    >
                      {buffering ? (
                        <span className="w-6 h-6 rounded-full border-3 border-indigo-300 border-t-white animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-7 h-7 text-white" fill="currentColor" />
                      ) : (
                        <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                      )}
                    </motion.button>
                    
                    {/* 下一首 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={playNext}
                      disabled={meditationTracks.length === 0}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 border border-white/20"
                    >
                      <SkipForward className="w-5 h-5" />
                    </motion.button>
                  </motion.div>


                </CardContent>
              </Card>

            

            {/* 冥想库 - 重新设计 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              {/* 标题区域 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">冥想库</h3>
                    <p className="text-xs text-muted-foreground">探索内心的宁静</p>
                  </div>
                </div>
              </div>

              {/* 分类标签 - 新设计 */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {MEDITATION_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        activeCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                          : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground shadow-sm border border-border/50'
                      }`}
                    >
                      <CatIcon className="w-4 h-4" />
                      {cat.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* 内容列表 - 新设计 */}
              <div className="space-y-3">
                {healingContent.slice(0, 4).map((content, index) => {
                  const gradient = CONTENT_GRADIENTS[index % CONTENT_GRADIENTS.length];
                  const isActive = selectedContent?.id === content.id;
                  
                  return (
                    <motion.div
                      key={content.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <Card
                        onClick={() => {
                          setSelectedDetailContent(content);
                          setDetailDialogOpen(true);
                        }}
                        className={`cursor-pointer transition-all duration-300 overflow-hidden ${
                          isActive
                            ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                            : 'hover:shadow-md border-border/50'
                        }`}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* 播放按钮 */}
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayContent(content);
                              }}
                              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg cursor-pointer relative overflow-hidden`}
                            >
                              <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                              <Play className="w-6 h-6 text-white ml-0.5 relative z-10" fill="white" />
                            </motion.div>
                            
                            {/* 内容信息 */}
                            <div>
                              <h4 className="font-semibold text-foreground mb-0.5">{content.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="px-2 py-0.5 rounded-full bg-muted">{content.category}</span>
                                <span>•</span>
                                <span>{content.duration ? `${Math.floor(content.duration / 60)}:00` : '5:00'}</span>
                              </div>
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-1"
                              >
                                <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                              </motion.div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(content.id);
                              }}
                              className="w-9 h-9 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                              <Bookmark className={`w-4 h-4 ${favorites.has(content.id) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContentToDelete(content);
                                setDeleteDialogOpen(true);
                              }}
                              className="w-9 h-9 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-rose-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* 树洞Tab内容 */}
        <AnimatePresence mode="wait">
          {activeTab === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CommunityTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 日记Tab内容 */}
        <AnimatePresence mode="wait">
          {activeTab === 'diary' && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DiaryTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 知识Tab内容 */}
        <AnimatePresence mode="wait">
          {activeTab === 'knowledge' && (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <KnowledgeTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 冥想完成对话框 */}
        <Dialog open={moodDialogOpen} onOpenChange={setMoodDialogOpen}>
          <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <DialogHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                冥想完成
              </DialogTitle>
              <p className="text-muted-foreground mt-2">恭喜你完成了 {Math.floor(currentTime / 60)} 分钟的冥想练习</p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="moodAfter" className="text-foreground font-medium">现在的感受如何？</Label>
                <Textarea
                  id="moodAfter"
                  value={moodAfter}
                  onChange={(e) => setMoodAfter(e.target.value)}
                  placeholder="记录下此刻的心情..."
                  rows={3}
                  className="bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMoodDialogOpen(false)}
                className="flex-1 rounded-xl border-slate-200 hover:bg-slate-100 transition-all"
              >
                跳过
              </Button>
              <Button
                onClick={handleSaveMood}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/25 transition-all"
              >
                保存记录
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md rounded-3xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
            <DialogHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"
              >
                <Trash2 className="w-7 h-7 text-rose-500" />
              </motion.div>
              <DialogTitle className="text-xl font-bold text-foreground">
                确认删除
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                你确定要删除「{contentToDelete?.title}」吗？<br />此操作不可恢复。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setContentToDelete(null);
                }}
                className="flex-1 rounded-xl border-slate-200 hover:bg-slate-100 transition-all"
              >
                取消
              </Button>
              <Button
                onClick={handleDeleteContent}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white shadow-lg shadow-rose-500/25 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 冥想内容详情弹窗 */}
        <ContentDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          content={selectedDetailContent}
          type="healing"
          onUpdate={loadData}
        />
      </div>
    </div>
  );
}
