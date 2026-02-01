import {Clock, Eye, 
  Heart, HelpCircle, 
  MessageCircle, Send, Share2, Smile, Sparkles, Star, ThumbsUp,TrendingUp 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  createCommunityPost,
  getCommunityPosts,
  getCommunityPostsByCategory,
  getPostCategories,
  getRecoveryStories,
  togglePostLike,
} from '@/db/api';
import type { CommunityPost } from '@/types';

const CATEGORY_ICONS: Record<string, any> = {
  heart: Heart,
  'trending-up': TrendingUp,
  'help-circle': HelpCircle,
  smile: Smile,
  star: Star,
};

const CATEGORY_COLORS: Record<string, string> = {
  pink: 'from-pink-500 to-rose-500',
  green: 'from-emerald-500 to-teal-500',
  blue: 'from-blue-500 to-cyan-500',
  yellow: 'from-amber-500 to-orange-500',
  purple: 'from-purple-500 to-fuchsia-500',
};

const AVATAR_GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-purple-400 to-indigo-500',
  'from-blue-400 to-cyan-500',
  'from-green-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-red-400 to-pink-500',
];

export default function CommunityTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [recoveryStories, setRecoveryStories] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPost, setNewPost] = useState('');
  const [selectedPostCategory, setSelectedPostCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recovery'>('all');

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData, storiesData] = await Promise.all([
        selectedCategory
          ? getCommunityPostsByCategory(selectedCategory, 20)
          : getCommunityPosts(20),
        getPostCategories(),
        getRecoveryStories(5),
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setRecoveryStories(storiesData);
      console.log('CommunityTab loaded posts:', postsData);
      console.log('CommunityTab loaded categories:', categoriesData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.trim()) {
      toast.error('请输入内容');
      return;
    }
    if (!selectedPostCategory) {
      toast.error('请选择分类');
      return;
    }
    try {
      const anonymousNickname = `用户${Math.random().toString(36).substring(2, 8)}`;
      await createCommunityPost({
        user_id: user.id,
        content: newPost,
        title: newPost.slice(0, 50),
        category_id: selectedPostCategory,
        anonymous_name: anonymousNickname,
      });
      setNewPost('');
      setSelectedPostCategory('');
      toast.success('发布成功');
      await loadData();
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    try {
      await togglePostLike(postId);
      await loadData();
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    return CATEGORY_ICONS[iconName] || MessageCircle;
  };

  const getCategoryGradient = (color: string) => {
    return CATEGORY_COLORS[color] || 'from-gray-500 to-gray-600';
  };

  const getAvatarGradient = (index: number) => {
    return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const displayPosts = activeTab === 'recovery' ? recoveryStories : posts;

  return (
    <div className="space-y-6">
      {/* 发布卡片 */}
      <Card className="glass border-0 shadow-xl overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <CardContent className="relative p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">分享你的故事</h3>
              <p className="text-sm text-muted-foreground">在这里,你不是一个人</p>
            </div>
          </div>

          {/* 分类选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">选择分类</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                const gradient = getCategoryGradient(cat.color);
                const isSelected = selectedPostCategory === cat.id;

                return (
                  <Button
                    key={cat.id}
                    onClick={() => setSelectedPostCategory(cat.id)}
                    className={`rounded-full px-4 py-2 transition-all duration-300 ${isSelected
                      ? `bg-gradient-to-r ${gradient} text-white shadow-glow scale-105`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105'
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {cat.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 输入框 */}
          <div className="space-y-2">
            <Textarea
              placeholder="分享你的感受和经验... (匿名发布,保护隐私)"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={4}
              className="bg-background/50 border-border focus:border-primary/50 transition-all duration-300 resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>✨ 你的分享可能帮助到正在经历相似困境的人</span>
              <span>{newPost.length}/500</span>
            </div>
          </div>

          {/* 发布按钮 */}
          <Button
            onClick={handleCreatePost}
            disabled={!newPost.trim() || !selectedPostCategory}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            匿名发布
          </Button>
        </CardContent>
      </Card>

      {/* Tab切换 */}
      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Button
          onClick={() => setActiveTab('all')}
          className={`flex-1 rounded-full py-6 text-base font-medium transition-all duration-300 ${activeTab === 'all'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glow'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          全部动态
        </Button>
        <Button
          onClick={() => setActiveTab('recovery')}
          className={`flex-1 rounded-full py-6 text-base font-medium transition-all duration-300 ${activeTab === 'recovery'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          <Star className="w-5 h-5 mr-2" />
          康复故事
        </Button>
      </div>

      {/* 分类筛选 */}
      {activeTab === 'all' && (
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={() => setSelectedCategory('')}
            variant={!selectedCategory ? 'default' : 'outline'}
            className={`whitespace-nowrap rounded-full transition-all duration-300 ${!selectedCategory
              ? 'bg-gradient-to-r from-primary to-info text-white shadow-glow'
              : 'hover:scale-105'
              }`}
          >
            全部
          </Button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const gradient = getCategoryGradient(cat.color);
            const isSelected = selectedCategory === cat.id;

            return (
              <Button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                variant={isSelected ? 'default' : 'outline'}
                className={`whitespace-nowrap rounded-full transition-all duration-300 ${isSelected
                  ? `bg-gradient-to-r ${gradient} text-white shadow-glow`
                  : 'hover:scale-105'
                  }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {cat.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* 帖子列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-4">加载中...</p>
          </div>
        ) : displayPosts.length === 0 ? (
          <Card className="glass border-border shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">暂无内容</p>
              <p className="text-sm text-muted-foreground mt-2">成为第一个分享的人吧</p>
            </CardContent>
          </Card>
        ) : (
          displayPosts.map((post, index) => {
            const isRecoveryStory = post.is_recovery_story;
            const avatarGradient = getAvatarGradient(index);
            const categoryData = categories.find(c => c.id === post.category_id);
            const CategoryIcon = categoryData ? getCategoryIcon(categoryData.icon) : MessageCircle;
            const categoryGradient = categoryData ? getCategoryGradient(categoryData.color) : 'from-gray-500 to-gray-600';

            return (
              <Card
                key={post.id}
                className={`glass shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-fade-in-up ${isRecoveryStory
                  ? 'border-2 border-amber-500/50 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-yellow-500/10'
                  : 'border-border'
                  }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-6">
                  {/* 头部 */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className={`w-12 h-12 border-2 border-white dark:border-slate-800 shadow-lg`}>
                      <AvatarFallback className={`bg-gradient-to-br ${avatarGradient} text-white font-semibold text-lg`}>
                        {post.anonymous_name?.charAt(2) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {post.anonymous_name || '匿名用户'}
                        </span>

                        {isRecoveryStory && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-glow">
                            <Star className="w-3 h-3 mr-1" fill="currentColor" />
                            康复故事
                          </Badge>
                        )}

                        {categoryData && (
                          <Badge
                            variant="outline"
                            className={`bg-gradient-to-r ${categoryGradient} text-white border-0`}
                          >
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {categoryData.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {Math.floor(Math.random() * 500) + 50}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* 互动栏 */}
                  <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="text-muted-foreground hover:text-pink-500 transition-all duration-300 hover:scale-110 group"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2 group-hover:fill-current" />
                      <span className="font-medium">{post.like_count || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-blue-500 transition-all duration-300 hover:scale-110 group"
                    >
                      <MessageCircle className="w-4 h-4 mr-2 group-hover:fill-current" />
                      <span className="font-medium">{post.comment_count || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-green-500 transition-all duration-300 hover:scale-110 group ml-auto"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </Button>
                  </div>

                  {/* 康复故事特殊标记 */}
                  {isRecoveryStory && (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-300 dark:border-amber-500/30">
                      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">这是一个充满希望的康复故事,愿你也能找到属于自己的光</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 底部提示 */}
      {!loading && displayPosts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
            <span>你不是一个人在战斗</span>
            <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
          </div>
          <p className="text-xs">已加载 {displayPosts.length} 条动态</p>
        </div>
      )}
    </div>
  );
}
