import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKnowledgeBase, createKnowledge, updateKnowledge, deleteKnowledge } from '@/db/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, Search } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">知识库管理</h1>
          <p className="text-muted-foreground mt-1">管理抑郁评测量表和治疗知识</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-1" />
              添加知识
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? '编辑知识' : '添加知识'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="知识标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  placeholder="详细内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签(用逗号分隔)</Label>
                <Input
                  id="tags"
                  placeholder="例如: PHQ-9, 量表, 筛查"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索知识..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 知识列表 */}
      <div className="grid gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </>
        ) : filteredKnowledge.length > 0 ? (
          filteredKnowledge.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant="outline">{categories.find(c => c.value === item.category)?.label}</Badge>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {item.content}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  创建于 {new Date(item.created_at).toLocaleDateString('zh-CN')}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无知识内容</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
