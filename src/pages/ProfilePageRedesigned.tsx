import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile, getAssessments, getEmotionDiaries } from '@/db/api';
import { toast } from 'sonner';
import { 
  Edit, LogOut, Activity, FileText, Heart, Bell, Shield, 
  Settings, ChevronRight, User, Calendar, TrendingUp, Award,
  Moon, Smartphone, HelpCircle, MessageSquare, Lock, Globe
} from 'lucide-react';

export default function ProfilePageRedesigned() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 健康数据
  const [emotionScore, setEmotionScore] = useState(75);
  const [consecutiveDays, setConsecutiveDays] = useState(15);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [diaryCount, setDiaryCount] = useState(0);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
    loadHealthData();
  }, [profile, user]);

  const loadHealthData = async () => {
    if (!user) return;
    try {
      const [assessments, diaries] = await Promise.all([
        getAssessments(user.id, 100),
        getEmotionDiaries(user.id, 100),
      ]);
      setAssessmentCount(assessments.length);
      setDiaryCount(diaries.length);
      
      // 计算连续打卡天数
      if (diaries.length > 0) {
        const sortedDiaries = diaries.sort((a, b) => 
          new Date(b.diary_date).getTime() - new Date(a.diary_date).getTime()
        );
        let count = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sortedDiaries.length; i++) {
          const diaryDate = new Date(sortedDiaries[i].diary_date);
          diaryDate.setHours(0, 0, 0, 0);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - count);
          
          if (diaryDate.getTime() === expectedDate.getTime()) {
            count++;
          } else {
            break;
          }
        }
        setConsecutiveDays(count);
      }
      
      // 计算情绪评分
      if (diaries.length > 0) {
        const recentDiaries = diaries.slice(0, 7);
        const scoreMap = { very_bad: 20, bad: 40, neutral: 60, good: 80, very_good: 100 };
        const avgScore = recentDiaries.reduce((sum, d) => sum + (scoreMap[d.emotion_level] || 60), 0) / recentDiaries.length;
        setEmotionScore(Math.round(avgScore));
      }
    } catch (error) {
      console.error('加载健康数据失败:', error);
    }
  };

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗?')) return;
    try {
      await signOut();
      navigate('/login');
      toast.success('已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName,
        phone: phone,
      });
      await refreshProfile();
      setEditDialogOpen(false);
      toast.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 菜单项配置
  const menuSections = [
    {
      title: '健康管理',
      items: [
        { icon: Calendar, label: '我的日记', value: `${diaryCount}条`, color: 'text-blue-600', bgColor: 'bg-blue-50', onClick: () => navigate('/record') },
        { icon: FileText, label: '评估记录', value: `${assessmentCount}次`, color: 'text-purple-600', bgColor: 'bg-purple-50', onClick: () => navigate('/assessment') },
        { icon: TrendingUp, label: '健康趋势', value: '查看', color: 'text-emerald-600', bgColor: 'bg-emerald-50', onClick: () => {} },
        { icon: Award, label: '成就徽章', value: '3个', color: 'text-amber-600', bgColor: 'bg-amber-50', onClick: () => {} },
      ],
    },
    {
      title: '应用设置',
      items: [
        { icon: Bell, label: '消息通知', value: '', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        { icon: Moon, label: '深色模式', value: '', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        { icon: Lock, label: '隐私设置', value: '', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        { icon: Globe, label: '语言设置', value: '简体中文', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
      ],
    },
    {
      title: '帮助与反馈',
      items: [
        { icon: HelpCircle, label: '帮助中心', value: '', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        { icon: MessageSquare, label: '意见反馈', value: '', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        { icon: Shield, label: '关于我们', value: 'v1.0.0', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* 个人信息卡片 */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 overflow-hidden animate-fade-in-down">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20 border-4 border-white/30 shadow-lg">
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">
                  {profile?.full_name || '未设置姓名'}
                </h2>
                <p className="text-blue-100 text-sm truncate">
                  {user?.email || '未设置邮箱'}
                </p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  普通用户
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="text-white hover:bg-white/20 transition-smooth"
              >
                <Edit className="w-5 h-5" />
              </Button>
            </div>

            {/* 健康数据概览 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">{emotionScore}</div>
                <div className="text-xs text-blue-100">情绪评分</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">{consecutiveDays}</div>
                <div className="text-xs text-blue-100">连续打卡</div>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">{assessmentCount}</div>
                <div className="text-xs text-blue-100">评估次数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card 
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => navigate('/record')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">写日记</h3>
              <p className="text-xs text-purple-100">记录今天的心情</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600"
            onClick={() => navigate('/assessment')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">做评估</h3>
              <p className="text-xs text-emerald-100">了解心理状态</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-amber-500 to-amber-600"
            onClick={() => navigate('/healing')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">疗愈中心</h3>
              <p className="text-xs text-amber-100">放松身心</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-rose-500 to-rose-600"
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">健康报告</h3>
              <p className="text-xs text-rose-100">查看数据分析</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能菜单 */}
        {menuSections.map((section, sectionIndex) => (
          <div 
            key={section.title} 
            className="space-y-2 animate-fade-in-up" 
            style={{ animationDelay: `${0.2 + sectionIndex * 0.1}s` }}
          >
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-1">
              {section.title}
            </h3>
            <Card className="border-0 shadow-md bg-white dark:bg-slate-800">
              <CardContent className="p-0">
                {section.items.map((item, index) => (
                  <div
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.bgColor} dark:bg-slate-700 flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color} dark:text-slate-300`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {item.label}
                      </div>
                      {item.value && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.value}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* 退出登录 */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 transition-smooth animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          退出登录
        </Button>

        {/* 版本信息 */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pb-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          灵愈AI数字医生 v1.0.0
          <br />
          © 2026 灵愈AI团队
        </div>
      </div>

      {/* 编辑资料对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              编辑个人资料
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">姓名</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
              />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500">邮箱不可修改</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1"
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
