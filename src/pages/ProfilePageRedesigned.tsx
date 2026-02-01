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
  Edit, LogOut, FileText,
  Settings, ChevronRight, User, Calendar, TrendingUp, Award,
  ShieldCheck, Crown, Shield
} from 'lucide-react';
import { HealthReportDialog } from '@/components/profile/HealthReportDialog';

export default function ProfilePageRedesigned() {
  const { user, profile, signOut, refreshProfile, signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [doctorUsername, setDoctorUsername] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
        getAssessments(100),
        getEmotionDiaries(100),
      ]);
      setAssessmentCount(assessments.length);
      setDiaryCount(diaries.length);

      // 计算连续打卡天数
      if (diaries.length > 0) {
        const sortedDiaries = diaries.sort((a: any, b: any) =>
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
        const scoreMap: Record<string, number> = { very_bad: 20, bad: 40, neutral: 60, good: 80, very_good: 100 };
        const avgScore = recentDiaries.reduce((sum: number, d: any) => sum + (scoreMap[d.emotion_level] || 60), 0) / recentDiaries.length;
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
      await updateProfile({
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
        { icon: TrendingUp, label: '健康趋势', value: '查看', color: 'text-emerald-600', bgColor: 'bg-emerald-50', onClick: () => { } },
        { icon: Award, label: '成就徽章', value: '3个', color: 'text-amber-600', bgColor: 'bg-amber-50', onClick: () => { } },
      ],
    },
    {
      title: '账号管理',
      items: [
        { icon: User, label: '个人信息管理', value: '完善身体数据', color: 'text-blue-600', bgColor: 'bg-blue-50', onClick: () => navigate('/profile/personal') },
        { icon: Crown, label: '会员订阅管理', value: '开通享特权', color: 'text-amber-600', bgColor: 'bg-amber-50', onClick: () => navigate('/profile/subscription') },
        { icon: ShieldCheck, label: '隐私安全设置', value: '账号安全加固', color: 'text-emerald-600', bgColor: 'bg-emerald-50', onClick: () => navigate('/profile/privacy') },
        { icon: Shield, label: '关于我们', color: 'text-slate-600', bgColor: 'bg-slate-50', onClick: () => { } },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* 个人信息卡片 */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 overflow-hidden animate-fade-in-down">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20 border-4 border-white/30 shadow-lg">
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                  {profile?.username?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">
                  {profile?.full_name || '未设置姓名'}
                </h2>
                <p className="text-blue-100 text-sm truncate">
                  {user?.username || '未设置用户名'}
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

        {/* 健康评估报告卡片 (长条形) */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card
            className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden group rounded-3xl py-3"
            onClick={() => setReportOpen(true)}
          >
            <CardContent className="p-0 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8 transition-transform duration-700 group-hover:scale-150" />

              <div className="p-3 flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-0.5 tracking-wide">健康评估报告</h3>
                  <p className="text-blue-100/80 text-sm leading-relaxed">
                    查看多模态分析、AI评分及专家康复建议
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform border border-white/10">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作 (已移除，功能在菜单中保留) */}


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
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${index !== section.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
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
              <Label>用户名</Label>
              <Input
                value={user?.username || ''}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500">用户名不可修改</p>
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
                setDoctorLoading(false);
                setDoctorDialogOpen(false);

                // profile 应该已经被 refreshProfile 更新
                if (profile?.role === 'doctor' || profile?.role === 'admin') {
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
