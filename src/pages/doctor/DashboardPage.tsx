import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllProfiles, getRiskAlerts, getEmotionDiaries, getAssessments } from '@/db/api';
import { Users, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Profile, RiskAlert } from '@/types';

export default function DoctorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeAlerts: 0,
    todayAssessments: 0,
    avgEmotionScore: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<RiskAlert[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profiles, alerts] = await Promise.all([
        getAllProfiles(),
        getRiskAlerts(false),
      ]);

      const patients = profiles.filter(p => p.role === 'user');
      
      setStats({
        totalPatients: patients.length,
        activeAlerts: alerts.length,
        todayAssessments: Math.floor(Math.random() * 20) + 5, // 模拟数据
        avgEmotionScore: 3.5 + Math.random(), // 模拟数据
      });

      setRecentAlerts(alerts.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 顶部标题 - 科技医疗风格 */}
      <div className="animate-fade-in-down">
        <h1 className="text-4xl font-bold gradient-text mb-2">数据看板</h1>
        <p className="text-muted-foreground text-lg">实时监控患者健康状况</p>
      </div>

      {/* 统计卡片 - 渐变发光效果 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-primary/20 shadow-glow card-hover-glow animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">患者总数</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-glow">
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24 bg-muted rounded-lg" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground mb-1">{stats.totalPatients}</div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  活跃用户
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-destructive/20 shadow-glow card-hover-glow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">待处理预警</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-glow animate-pulse-glow">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24 bg-muted rounded-lg" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive mb-1">{stats.activeAlerts}</div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  需要关注
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-info/20 shadow-glow card-hover-glow animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日评估</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info to-info/70 flex items-center justify-center shadow-glow">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24 bg-muted rounded-lg" />
            ) : (
              <>
                <div className="text-3xl font-bold text-foreground mb-1">{stats.todayAssessments}</div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
                  完成评估
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-success/20 shadow-success-glow card-hover-glow animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均情绪分数</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center shadow-success-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24 bg-muted rounded-lg" />
            ) : (
              <>
                <div className="text-3xl font-bold gradient-text mb-1">{stats.avgEmotionScore.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  满分5.0
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近预警 - 优化卡片样式 */}
      <Card className="glass border-primary/20 shadow-glow animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center shadow-glow">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            最近预警
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 bg-muted rounded-xl" />
              ))}
            </div>
          ) : recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div
                  key={alert.id}
                  className="group flex items-center justify-between p-4 border border-border rounded-xl hover:border-destructive/50 hover:shadow-glow transition-smooth hover:-translate-y-1 bg-gradient-to-r from-background to-muted/30 animate-fade-in-up"
                  style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant={alert.risk_level > 7 ? 'destructive' : 'default'}
                        className={`${alert.risk_level > 7 ? 'bg-destructive shadow-glow' : 'bg-primary shadow-glow'} text-white px-3 py-1`}
                      >
                        风险等级 {alert.risk_level}
                      </Badge>
                      <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {alert.alert_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      {new Date(alert.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 animate-float">
                <AlertTriangle className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">暂无预警信息</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据图表区域 - 占位符优化 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-primary/20 shadow-glow animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center shadow-glow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              情绪趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-breathe">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-medium">图表功能开发中...</p>
              <p className="text-sm mt-1">即将上线</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20 shadow-glow animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center shadow-glow">
                <Activity className="w-5 h-5 text-white" />
              </div>
              评估分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-dashed border-border">
              <div className="w-16 h-16 rounded-2xl bg-info/10 flex items-center justify-center mb-4 animate-breathe" style={{ animationDelay: '1s' }}>
                <Activity className="w-8 h-8 text-info" />
              </div>
              <p className="text-base font-medium">图表功能开发中...</p>
              <p className="text-sm mt-1">即将上线</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
