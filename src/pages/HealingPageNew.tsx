import { Bell, 
  Bookmark, Clock, Heart, Moon, 
  Music, Pause, PenLine, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Trash2, Volume2, VolumeX
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
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
  { id: 'all', label: '全部' },
  { id: 'relax', label: '放松' },
  { id: 'sleep', label: '睡眠' },
  { id: 'focus', label: '专注' },
];

const CONTENT_GRADIENTS = [
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-blue-500 to-blue-600',
  'from-pink-500 to-pink-600',
  'from-amber-500 to-amber-600',
];

const rawMusicFiles = [
  'Lisure .mp3',
  '叹云兮 - 鞠婧祎.mp3',
  '相思遥 (Live版) - 郁可唯_弦子.mp3',
  '落了白 - 蒋雪儿Snow.J.mp3',
] as const;

const meditationTracks = rawMusicFiles
  .map((fileName) => {
    const nameWithoutExt = fileName.replace(/\.(mp3|ogg|wav|m4a)$/i, '');
    const [title, artist] = nameWithoutExt.split(' - ');
    const url = `/srcs/music/${encodeURIComponent(fileName)}`;
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
    if (meditationTracks.length === 0) {
      setPlayError('未找到冥想音乐文件');
      return;
    }
    setPlayError(null);
  }, [activeTab]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (meditationTracks.length === 0) return;
    const current = meditationTracks[trackIndex];
    const tryLoad = async () => {
      try {
        const res = await fetch(current.url, { method: 'HEAD' });
        if (!res.ok) throw new Error('head_failed');
        audio.preload = 'auto';
        audio.src = current.url;
        audio.volume = muted ? 0 : volume;
        audio.load();
        if (wantPlayRef.current) {
          audio.play().catch(() => {});
        }
        const nextIndex = (trackIndex + 1) % meditationTracks.length;
        const preloader = new Audio();
        preloader.preload = 'auto';
        preloader.src = meditationTracks[nextIndex].url;
        preloader.load();
        preloadRef.current = preloader;
        setPlayError(null);
      } catch {
        setPlayError(`音乐文件不可用：${current.fileName}`);
        toast.error('音乐文件未找到或不可访问');
      }
    };
    tryLoad();

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
      setPlayError(`音乐加载失败：${current?.fileName || '未知文件'}`);
      toast.error('音乐加载失败，请检查文件是否存在');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
       

        {/* 导航系统 - 冥想、树洞、日记、知识 */}
        <div className="grid grid-cols-4 gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Button
            onClick={() => setActiveTab('meditation')}
            className={`rounded-2xl py-5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'meditation'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            } active:scale-95`}
          >
            <Music className="w-4 h-4 mr-1.5" />
            冥想
          </Button>
          <Button
            onClick={() => setActiveTab('community')}
            className={`rounded-2xl py-5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'community'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            } active:scale-95`}
          >
            <Heart className="w-4 h-4 mr-1.5" />
            树洞
          </Button>
          <Button
            onClick={() => setActiveTab('diary')}
            className={`rounded-2xl py-5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'diary'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            } active:scale-95`}
          >
            <PenLine className="w-4 h-4 mr-1.5" />
            日记
          </Button>
          <Button
            onClick={() => setActiveTab('knowledge')}
            className={`rounded-2xl py-5 text-sm font-medium transition-all duration-200 ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            } active:scale-95`}
          >
            <Bookmark className="w-4 h-4 mr-1.5" />
            知识
          </Button>
        </div>

        {/* 冥想Tab内容 */}
        {activeTab === 'meditation' && (
          <div className="space-y-6">
            {/* 主播放器 */}
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 shadow-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-center mb-3">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-3 py-1 text-xs">
                    {isPlaying ? '正在播放' : '已暂停'}
                  </Badge>
                </div>

                <div className="text-center mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    {selectedContent?.title || '5分钟呼吸导引'}
                  </h2>
                  <p className="text-indigo-300 text-xs">
                    {selectedContent?.description || '跟随圆圈来缓呼吸'}
                  </p>
                  {currentTrackLabel && (
                    <p className="text-white/70 text-[11px] mt-2">
                      当前音乐：{currentTrackLabel}
                    </p>
                  )}
                </div>

                {/* 呼吸动画圆形 */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-breathe" />
                    <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30 animate-breathe" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute inset-4 rounded-full border-2 border-indigo-500/40 animate-breathe" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow flex items-center justify-center animate-pulse-glow">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-indigo-300 mb-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalTime || 0)}</span>
                  </div>
                  <Slider
                    value={[progressValue]}
                    max={100}
                    step={0.1}
                    onValueChange={(v) => {
                      const audio = audioRef.current;
                      if (!audio || !totalTime) return;
                      const nextTime = (v[0] / 100) * totalTime;
                      audio.currentTime = Math.max(0, Math.min(totalTime, nextTime));
                      setCurrentTime(Math.floor(audio.currentTime));
                    }}
                    className="w-full [&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-indigo-500 [&_[data-slot=slider-range]]:to-purple-600 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
                  />
                </div>

                {/* 播放控制 */}
                <div className="flex items-center justify-center gap-3">
                  <audio ref={(el) => { audioRef.current = el; }} preload="auto" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={playPrev}
                    disabled={meditationTracks.length === 0}
                    className="w-9 h-9 text-indigo-300 hover:text-white hover:bg-slate-700/50 transition-smooth"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={togglePlay}
                    disabled={meditationTracks.length === 0}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 shadow-2xl transition-smooth"
                  >
                    {buffering ? (
                      <span className="w-6 h-6 rounded-full border-2 border-slate-900/25 border-t-slate-900 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6 text-slate-900" fill="currentColor" />
                    ) : (
                      <Play className="w-6 h-6 text-slate-900 ml-0.5" fill="currentColor" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={playNext}
                    disabled={meditationTracks.length === 0}
                    className="w-9 h-9 text-indigo-300 hover:text-white hover:bg-slate-700/50 transition-smooth"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {playError && (
                  <div className="mt-3 text-center text-[10px] text-rose-200/90">
                    {playError}
                  </div>
                )}
              </CardContent>
            </Card>

            

            {/* 冥想库 */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-foreground">冥想库</h3>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {MEDITATION_CATEGORIES.map(cat => (
                  <Button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full px-6 py-2 text-sm font-medium whitespace-nowrap transition-smooth ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                {healingContent.slice(0, 4).map((content, index) => {
                  const gradient = CONTENT_GRADIENTS[index % CONTENT_GRADIENTS.length];
                  const isActive = selectedContent?.id === content.id;
                  
                  return (
                    <Card
                      key={content.id}
                      onClick={() => {
                        setSelectedDetailContent(content);
                        setDetailDialogOpen(true);
                      }}
                      className={`cursor-pointer transition-smooth hover:shadow-lg ${
                        isActive
                          ? 'border-2 border-indigo-500 shadow-glow bg-indigo-50/50 dark:bg-indigo-500/10'
                          : 'border border-border hover:border-indigo-300'
                      }`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayContent(content);
                            }}
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                          >
                            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-foreground mb-1">{content.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {content.category} • {content.duration ? `${Math.floor(content.duration / 60)}:00` : '5:00'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Volume2 className="w-5 h-5 text-indigo-600 animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(content.id);
                            }}
                            className="hover:bg-muted"
                          >
                            <Bookmark className={`w-5 h-5 ${favorites.has(content.id) ? 'fill-current text-amber-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentToDelete(content);
                              setDeleteDialogOpen(true);
                            }}
                            className="hover:bg-muted text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 树洞Tab内容 */}
        {activeTab === 'community' && <CommunityTab />}

        {/* 日记Tab内容 */}
        {activeTab === 'diary' && <DiaryTab />}

        {/* 知识Tab内容 */}
        {activeTab === 'knowledge' && <KnowledgeTab />}

        {/* 冥想完成对话框 */}
        <Dialog open={moodDialogOpen} onOpenChange={setMoodDialogOpen}>
          <DialogContent className="glass border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text">冥想完成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-foreground">恭喜你完成了{Math.floor(currentTime / 60)}分钟的冥想练习!</p>
              <div className="space-y-2">
                <Label htmlFor="moodAfter" className="text-foreground">现在的感受如何?</Label>
                <Textarea
                  id="moodAfter"
                  value={moodAfter}
                  onChange={(e) => setMoodAfter(e.target.value)}
                  placeholder="记录你的感受..."
                  rows={3}
                  className="bg-background border-border focus:border-primary/50 transition-smooth"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMoodDialogOpen(false)}
                className="flex-1 border-border hover:bg-muted transition-smooth"
              >
                跳过
              </Button>
              <Button
                onClick={handleSaveMood}
                className="flex-1 bg-gradient-to-r from-primary to-info hover:opacity-90 text-white shadow-glow transition-smooth"
              >
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="w-[90vw] max-w-md rounded-[20px] border-none bg-background shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                确认删除
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                你确定要删除「{contentToDelete?.title}」吗？此操作不可恢复。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setContentToDelete(null);
                }}
                className="flex-1 rounded-xl border-border hover:bg-muted transition-all"
              >
                取消
              </Button>
              <Button
                onClick={handleDeleteContent}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
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
