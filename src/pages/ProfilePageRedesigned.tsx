import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HealthReportDialog } from '@/components/profile/HealthReportDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile, getAssessments, getEmotionDiaries } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { 
  Edit, LogOut, Activity, FileText, Heart, Bell, Shield, 
  Settings, ChevronRight, User, Calendar, TrendingUp, Award,
  Moon, Smartphone, HelpCircle, MessageSquare, Lock, Globe,
  ArrowRight, ShieldCheck, Crown, Fingerprint, Copy
} from 'lucide-react';

export default function ProfilePageRedesigned() {
  const { user, profile, signOut, refreshProfile, signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [doctorUsername, setDoctorUsername] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openReport') === '1') {
      setReportOpen(true);
    }
  }, [location.search]);
  
  // 健康数据
  const [emotionScore, setEmotionScore] = useState(75);
  const [consecutiveDays, setConsecutiveDays] = useState(15);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [diaryCount, setDiaryCount] = useState(0);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('ID已复制到剪贴板', { duration: 1000 });
    }
  };

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
      title: '账号管理',
      items: [
        { icon: User, label: '个人信息', value: '完善身体数据', color: 'text-blue-600', bgColor: 'bg-blue-50', onClick: () => navigate('/profile/personal') },
        { icon: Crown, label: '会员订阅', value: '开通享特权', color: 'text-amber-600', bgColor: 'bg-amber-50', onClick: () => navigate('/profile/subscription') },
        { icon: ShieldCheck, label: '隐私安全', value: '账号安全加固', color: 'text-emerald-600', bgColor: 'bg-emerald-50', onClick: () => navigate('/profile/privacy') },
        { icon: Shield, label: '关于我们', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => {} },
        {
          icon: Settings,
          label: profile?.role === 'doctor' || profile?.role === 'admin' ? '医生后台' : '医生后台登录',
          value: '',
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          onClick: () => {
            if (profile?.role === 'doctor' || profile?.role === 'admin') {
              navigate('/doctor/dashboard');
            } else {
              setDoctorDialogOpen(true);
            }
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 pb-24">
      {/* 蓝色顶部 Header */}
      <div className="bg-primary px-6 pt-12 pb-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="max-w-md mx-auto relative z-10 flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-white/50 bg-white shadow-md">
            <AvatarFallback className="bg-slate-100 text-primary text-xl font-black">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate">
                {profile?.full_name || '灵愈用户'}
              </h2>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[10px] px-2 py-0">
                已认证
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-0.5 flex items-center gap-1.5 cursor-pointer hover:bg-white/30 transition-colors" onClick={handleCopyId}>
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">ID</span>
                <span className="text-[10px] font-mono text-white/90">
                  {user?.id ? `${user.id.slice(0, 4)}****${user.id.slice(-4)}` : '未登录'}
                </span>
                <span className="text-[10px] text-white/60 ml-1">复制</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditDialogOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12 relative z-20 space-y-4">
        {/* 查看健康报告卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 shadow-xl relative overflow-hidden group cursor-pointer bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800"
          onClick={() => setReportOpen(true)}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-lg">查看健康报告</span>
              </div>
              <p className="text-slate-300/70 text-xs mt-1">多模态评估结果与康复建议</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full text-[10px] font-black h-7 px-3" onClick={() => setReportOpen(true)}>
              打开
            </Button>
          </div>
        </motion.div>

        

        {/* 菜单列表（仅显示功能项，无分组标题） */}
        {menuSections.map((section) => (
          <Card key={section.title} className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-0">
              {section.items.map((item, index) => (
                <div
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    index !== section.items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl ${item.bgColor} dark:bg-slate-800 flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color} dark:text-slate-300`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {item.label}
                    </div>
                    {item.value && (
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {item.value}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* 退出登录 */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full h-14 rounded-[32px] text-rose-500 font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-all"
        >
          <LogOut className="w-5 h-5 mr-2" />
          退出当前账号
        </Button>

        {/* 版本信息 */}
        <div className="text-center space-y-1 py-4">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">
            MindCare AI v1.0.0
          </p>
          <p className="text-[9px] text-slate-200 dark:text-slate-800">
            © 2026 灵愈AI数字化医疗团队
          </p>
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

      {/* 医生后台登录对话框 */}
      <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              医生后台登录
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doctor-username">用户名</Label>
              <Input
                id="doctor-username"
                value={doctorUsername}
                onChange={(e) => setDoctorUsername(e.target.value)}
                placeholder="请输入医生账号用户名"
                disabled={doctorLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-password">密码</Label>
              <Input
                id="doctor-password"
                type="password"
                value={doctorPassword}
                onChange={(e) => setDoctorPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={doctorLoading}
              />
            </div>
            <p className="text-xs text-slate-500">
              登录成功后将进入医生后台。如非医生账号，将提示失败。
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDoctorDialogOpen(false)}
              className="flex-1"
              disabled={doctorLoading}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!doctorUsername || !doctorPassword) {
                  toast.error('请输入用户名和密码');
                  return;
                }
                setDoctorLoading(true);
                const { error } = await signInWithUsername(doctorUsername, doctorPassword);
                if (error) {
                  toast.error('登录失败: ' + error.message);
                  setDoctorLoading(false);
                  return;
                }
                await refreshProfile();
                const { data: { session } } = await supabase.auth.getSession();
                const latestProfile = session?.user ? await getProfile(session.user.id) : null;
                setDoctorLoading(false);
                setDoctorDialogOpen(false);
                if (latestProfile?.role === 'doctor' || latestProfile?.role === 'admin') {
                  toast.success('登录成功，正在进入医生后台');
                  navigate('/doctor/dashboard');
                } else {
                  toast.error('当前账户非医生/管理员角色，无法进入医生后台');
                }
              }}
              disabled={doctorLoading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {doctorLoading ? '登录中...' : '登录'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <HealthReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
