import { Activity, Calendar, Edit, LogOut, Mail, Phone, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/db/api';

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birth_date || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, {
        full_name: fullName || undefined,
        gender: gender || undefined,
        birth_date: birthDate || undefined,
      });
      await refreshProfile();
      toast.success('资料已更新');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    }
  };

  const roleMap = {
    user: '普通用户',
    doctor: '医生',
    admin: '管理员',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部个人信息 */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary-foreground/20 text-2xl">
                {profile?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h1>
              <p className="text-primary-foreground/90">@{profile?.username}</p>
              <Badge variant="secondary" className="mt-2">
                {profile?.role && roleMap[profile.role]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 -mt-6 pb-6 space-y-4">
        {/* 个人资料 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                个人资料
              </div>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑资料</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">姓名</Label>
                      <Input
                        id="full-name"
                        placeholder="请输入姓名"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">性别</Label>
                      <Input
                        id="gender"
                        placeholder="男/女"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth-date">出生日期</Label>
                      <Input
                        id="birth-date"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full">
                      保存
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              <span className="text-muted-foreground w-20">用户名</span>
              <span className="font-medium">{profile?.username}</span>
            </div>
            {profile?.full_name && (
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="text-muted-foreground w-20">姓名</span>
                <span className="font-medium">{profile.full_name}</span>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="text-muted-foreground w-20">邮箱</span>
                <span className="font-medium">{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="text-muted-foreground w-20">手机</span>
                <span className="font-medium">{profile.phone}</span>
              </div>
            )}
            {profile?.birth_date && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="text-muted-foreground w-20">生日</span>
                <span className="font-medium">
                  {new Date(profile.birth_date).toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 功能菜单 */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(profile?.role === 'doctor' || profile?.role === 'admin') && (
                <Button
                  variant="ghost"
                  className="w-full justify-start h-14 rounded-none"
                  onClick={() => navigate('/doctor/dashboard')}
                >
                  <Shield className="w-5 h-5 mr-3 text-primary" />
                  <span>医生管理后台</span>
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start h-14 rounded-none"
                onClick={() => navigate('/record')}
              >
                <Activity className="w-5 h-5 mr-3 text-primary" />
                <span>我的健康档案</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 退出登录 */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          退出登录
        </Button>

        {/* 版本信息 */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>灵愈AI数字医生 v1.0.0</p>
          <p className="mt-1">© 2026 灵愈AI</p>
        </div>
      </div>
    </div>
  );
}
