import { BookOpen, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { createKnowledge, deleteKnowledge, getKnowledgeBase, updateKnowledge } from '@/db/api';
import type { KnowledgeBase } from '@/types';

export default function KnowledgePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [knowledge, setKnowledge] = useState<KnowledgeBase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);

  // 表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('assessment');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const data = await getKnowledgeBase();
      setKnowledge(data);
    } catch (error) {
      console.error('加载知识库失败:', error);
      toast.error('加载知识库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: KnowledgeBase) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setContent(item.content);
      setCategory(item.category);
      setTags(item.tags?.join(', ') || '');
    } else {
      setEditingItem(null);
      setTitle('');
      setContent('');
      setCategory('assessment');
      setTags('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      const knowledgeData = {
        title,
        content,
        category,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        created_by: user.id,
      };

      if (editingItem) {
        await updateKnowledge(editingItem.id, knowledgeData);
        toast.success('知识已更新');
      } else {
        await createKnowledge(knowledgeData);
        toast.success('知识已添加');
      }

      setDialogOpen(false);
      await loadKnowledge();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条知识吗?')) return;

    try {
      await deleteKnowledge(id);
      toast.success('已删除');
      await loadKnowledge();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'assessment', label: '评估量表' },
    { value: 'therapy', label: '治疗方法' },
    { value: 'research', label: '研究资料' },
  ];

  const filteredKnowledge = knowledge.filter(k => {
    const matchCategory = selectedCategory === 'all' || k.category === selectedCategory;
    const matchSearch = k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       k.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">知识库管理</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">管理抑郁评测量表和治疗知识</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-11 sm:h-10 rounded-xl shadow-lg shadow-primary/10" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              添加知识
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">{editingItem ? '编辑知识' : '添加知识'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold">标题</Label>
                <Input
                  id="title"
                  placeholder="请输入知识标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-bold">分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">评估量表</SelectItem>
                    <SelectItem value="therapy">治疗方法</SelectItem>
                    <SelectItem value="research">研究资料</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-bold">内容</Label>
                <Textarea
                  id="content"
                  placeholder="请输入详细内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="rounded-xl min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-bold">标签 (用逗号分隔)</Label>
                <Input
                  id="tags"
                  placeholder="例如: PHQ-9, 量表, 筛查"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button onClick={handleSave} className="w-full h-12 rounded-xl text-base font-bold">
                保存知识
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col gap-4 px-1">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="搜索知识..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="rounded-full px-4 whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 知识列表 */}
      <div className="grid gap-4 px-1">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-muted rounded-2xl" />
            ))}
          </>
        ) : filteredKnowledge.length > 0 ? (
          filteredKnowledge.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden bg-card">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] bg-muted">{categories.find(c => c.value === item.category)?.label}</Badge>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1.5 border-primary/20 text-primary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-4 pt-4 border-t border-muted/50">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  创建于 {new Date(item.created_at).toLocaleDateString('zh-CN')}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-medium">暂无知识内容</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
