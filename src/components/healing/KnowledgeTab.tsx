import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  getHealingContents, 
  toggleFavorite, 
  getUserFavorites,
  incrementViewCount,
  incrementLikeCount,
} from '@/db/api';
import { toast } from 'sonner';
import { 
  BookOpen, Video, Headphones, Search, Bookmark, Eye, ThumbsUp, 
  TrendingUp, Clock, Sparkles, Play, FileText, Award, Zap
} from 'lucide-react';
import type { HealingContent } from '@/types';

const CONTENT_TYPES = [
  { id: 'all', label: '全部', icon: BookOpen, gradient: 'from-indigo-500 to-purple-500' },
  { id: 'article', label: '文章', icon: FileText, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'video', label: '视频', icon: Video, gradient: 'from-pink-500 to-rose-500' },
  { id: 'audio', label: '音频', icon: Headphones, gradient: 'from-green-500 to-emerald-500' },
];

const TYPE_ICONS: Record<string, any> = {
  article: FileText,
  video: Video,
  audio: Headphones,
};

const TYPE_COLORS: Record<string, string> = {
  article: 'from-blue-500 to-cyan-500',
  video: 'from-pink-500 to-rose-500',
  audio: 'from-green-500 to-emerald-500',
};

export default function KnowledgeTab() {
  const { user } = useAuth();
  const [contents, setContents] = useState<HealingContent[]>([]);
  const [filteredContents, setFilteredContents] = useState<HealingContent[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'latest'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContents();
  }, [selectedType, searchQuery, contents, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contentsData, favoritesData] = await Promise.all([
        getHealingContents(),
        user ? getUserFavorites(user.id) : Promise.resolve([]),
      ]);
      
      // 过滤出知识库内容
      const knowledgeContents = contentsData.filter(c => 
        c.content_type === 'article' || c.content_type === 'video' || c.content_type === 'audio'
      );
      
      setContents(knowledgeContents);
      setFavorites(new Set(favoritesData.map((f: any) => f.content_id)));
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const filterContents = () => {
    let filtered = [...contents];

    // 类型筛选
    if (selectedType !== 'all') {
      filtered = filtered.filter(c => c.content_type === selectedType);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.description?.toLowerCase().includes(query) ||
        c.author?.toLowerCase().includes(query)
      );
    }

    // Tab筛选
    if (activeTab === 'trending') {
      filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else if (activeTab === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredContents(filtered);
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

  const handleContentClick = async (content: HealingContent) => {
    try {
      await incrementViewCount(content.id);
      // 这里可以打开内容详情页
      toast.success('正在加载内容...');
    } catch (error) {
      console.error('打开内容失败:', error);
    }
  };

  const handleLike = async (contentId: string) => {
    try {
      await incrementLikeCount(contentId);
      await loadData();
      toast.success('点赞成功');
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    return TYPE_ICONS[type] || BookOpen;
  };

  const getTypeGradient = (type: string) => {
    return TYPE_COLORS[type] || 'from-gray-500 to-gray-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选区域 */}
      <Card className="glass border-0 shadow-xl overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <CardContent className="relative p-6 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base bg-background/50 border-border focus:border-primary/50 transition-all duration-300 rounded-2xl"
            />
          </div>

          {/* 类型筛选 */}
          <div className="flex flex-wrap gap-3">
            {CONTENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <Button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`rounded-full px-6 py-6 text-base font-medium transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-r ${type.gradient} text-white shadow-glow scale-105`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab切换 */}
      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Button
          onClick={() => setActiveTab('all')}
          className={`flex-1 rounded-full py-6 text-base font-medium transition-all duration-300 ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-glow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          推荐
        </Button>
        <Button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 rounded-full py-6 text-base font-medium transition-all duration-300 ${
            activeTab === 'trending'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-glow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          热门
        </Button>
        <Button
          onClick={() => setActiveTab('latest')}
          className={`flex-1 rounded-full py-6 text-base font-medium transition-all duration-300 ${
            activeTab === 'latest'
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-glow'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Clock className="w-5 h-5 mr-2" />
          最新
        </Button>
      </div>

      {/* 内容列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-4">加载中...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <Card className="glass border-border shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">没有找到相关内容</p>
              <p className="text-sm text-muted-foreground mt-2">试试其他关键词或筛选条件</p>
            </CardContent>
          </Card>
        ) : (
          filteredContents.map((content, index) => {
            const Icon = getTypeIcon(content.content_type || 'article');
            const gradient = getTypeGradient(content.content_type || 'article');
            const isFavorited = favorites.has(content.id);
            const isPopular = (content.view_count || 0) > 1000;

            return (
              <Card
                key={content.id}
                className="glass shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border cursor-pointer animate-fade-in-up group"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleContentClick(content)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* 图标区域 */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                              {content.title}
                            </h3>
                            
                            {isPopular && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-glow">
                                <Zap className="w-3 h-3 mr-1" fill="currentColor" />
                                热门
                              </Badge>
                            )}
                            
                            <Badge 
                              variant="outline" 
                              className={`bg-gradient-to-r ${gradient} text-white border-0`}
                            >
                              {content.content_type === 'article' && '文章'}
                              {content.content_type === 'video' && '视频'}
                              {content.content_type === 'audio' && '音频'}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                            {content.description}
                          </p>

                          {/* 元信息 */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {content.author && (
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {content.author}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(content.view_count || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {formatNumber(content.like_count || 0)}
                            </span>
                            {content.duration && content.duration > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.floor(content.duration / 60)}分钟
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 收藏按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(content.id);
                          }}
                          className={`flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                            isFavorited 
                              ? 'text-amber-500 hover:text-amber-600' 
                              : 'text-muted-foreground hover:text-amber-500'
                          }`}
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} 
                          />
                        </Button>
                      </div>

                      {/* 操作栏 */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(content.id);
                          }}
                          className="text-muted-foreground hover:text-pink-500 transition-all duration-300 hover:scale-110 group/like"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2 group-hover/like:fill-current" />
                          点赞
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-blue-500 transition-all duration-300 hover:scale-110 group/play"
                        >
                          <Play className="w-4 h-4 mr-2 group-hover/play:fill-current" />
                          {content.content_type === 'article' ? '阅读' : content.content_type === 'video' ? '观看' : '收听'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 底部提示 */}
      {!loading && filteredContents.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>持续学习,不断成长</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs">已加载 {filteredContents.length} 条内容</p>
        </div>
      )}
    </div>
  );
}
