import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import CommunityTab from '@/components/healing/CommunityTab';
import KnowledgeTab from '@/components/healing/KnowledgeTab';
import { 
  getHealingContents, 
  createMeditationSession,
  getMeditationStats,
  toggleFavorite,
} from '@/db/api';
import { toast } from 'sonner';
import { 
  Music, Bell, Volume2, SkipBack, SkipForward, Pause, Play, Clock, Heart, Moon, 
  Bookmark
} from 'lucide-react';
import type { HealingContent } from '@/types';

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

export default function HealingPageNew() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('meditation');
  const [activeCategory, setActiveCategory] = useState('all');
  const [healingContent, setHealingContent] = useState<HealingContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<HealingContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime] = useState(300);
  const [meditationStats, setMeditationStats] = useState({ totalMinutes: 128, totalSessions: 12 });
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [moodAfter, setMoodAfter] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
      setMeditationStats(stats);
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
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      // 开始播放
      setIsPlaying(true);
      startTimeRef.current = Date.now() - currentTime * 1000;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setCurrentTime(elapsed);
        if (elapsed >= totalTime) {
          handleMeditationComplete();
        }
      }, 1000);
    } else {
      // 暂停
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleMeditationComplete = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
       

        {/* Tab切换 */}
        <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={() => setActiveTab('meditation')}
            className={`flex-1 rounded-full py-6 text-base font-medium transition-smooth ${
              activeTab === 'meditation'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow hover:opacity-90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            冥想
          </Button>
          <Button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 rounded-full py-6 text-base font-medium transition-smooth ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow hover:opacity-90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            知识
          </Button>
          <Button
            onClick={() => setActiveTab('community')}
            className={`flex-1 rounded-full py-6 text-base font-medium transition-smooth ${
              activeTab === 'community'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow hover:opacity-90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            树洞
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
                    <span>{formatTime(totalTime)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / totalTime) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 播放控制 */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-indigo-300 hover:text-white hover:bg-slate-700/50 transition-smooth"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 shadow-2xl transition-smooth"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-slate-900" fill="currentColor" />
                    ) : (
                      <Play className="w-6 h-6 text-slate-900 ml-0.5" fill="currentColor" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-indigo-300 hover:text-white hover:bg-slate-700/50 transition-smooth"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
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
                      onClick={() => handlePlayContent(content)}
                      className={`cursor-pointer transition-smooth hover:shadow-lg ${
                        isActive
                          ? 'border-2 border-indigo-500 shadow-glow bg-indigo-50/50 dark:bg-indigo-500/10'
                          : 'border border-border hover:border-indigo-300'
                      }`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 知识Tab内容 */}
        {activeTab === 'knowledge' && <KnowledgeTab />}

        {/* 树洞Tab内容 */}
        {activeTab === 'community' && <CommunityTab />}

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
      </div>
    </div>
  );
}
