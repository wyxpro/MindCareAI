import { Heart, Loader2, Stethoscope, User } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getProfile, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const [role, setRole] = useState<'user' | 'doctor'>('user');
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }
    if (role === 'doctor' && password.length < 6) {
      toast.error('医生端密码至少需要6个字符');
      return;
    }

    setLoading(true);
    const { error } = await signInWithUsername(username, password);
    setLoading(false);

    if (error) {
      toast.error('登录失败: ' + error.message);
    } else {
      // 根据角色进行跳转与校验
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let userRole: 'user' | 'doctor' | 'admin' | undefined = undefined;
        if (session?.user) {
          const p = await getProfile(session.user.id);
          userRole = p?.role;
        }
        if (role === 'doctor') {
          if (userRole === 'doctor' || userRole === 'admin') {
            toast.success('医生端登录成功');
            navigate('/doctor/dashboard', { replace: true });
          } else {
            toast.error('当前账号非医生/管理员角色，无法进入医生端');
            navigate('/profile', { replace: true });
          }
        } else {
          toast.success('登录成功');
          navigate(from, { replace: true });
        }
      } catch {
        toast.success('登录成功');
        navigate(from, { replace: true });
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    const { error } = await signUpWithUsername(username, password, role);
    setLoading(false);

    if (error) {
      toast.error('注册失败: ' + error.message);
    } else {
      toast.success('注册成功,正在登录...');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">灵愈AI数字医生</CardTitle>
          <CardDescription>您的心理健康守护者</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 角色选择器 */}
          <div className="mb-4">
            <Label className="mb-2 inline-block">登录角色</Label>
            <ToggleGroup type="single" value={role} onValueChange={(v) => v && setRole(v as 'user' | 'doctor')} className="w-full">
              <ToggleGroupItem value="user" className="flex-1 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                <User className="w-4 h-4 mr-1" /> 用户端
              </ToggleGroupItem>
              <ToggleGroupItem value="doctor" className="flex-1 data-[state=on]:bg-emerald-600 data-[state=on]:text-white">
                <Stethoscope className="w-4 h-4 mr-1" /> 医生端
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">用户名</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder={role === 'doctor' ? '请输入医生账号用户名' : '请输入用户名'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={role === 'doctor' ? '医生端至少6位密码' : '请输入密码'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  登录
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">用户名</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">密码</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="至少6个字符"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
