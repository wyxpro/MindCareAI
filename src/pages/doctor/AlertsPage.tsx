import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRiskAlerts, handleRiskAlert } from '@/db/api';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { RiskAlert } from '@/types';

export default function AlertsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unhandledAlerts, setUnhandledAlerts] = useState<RiskAlert[]>([]);
  const [handledAlerts, setHandledAlerts] = useState<RiskAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [unhandled, handled] = await Promise.all([
        getRiskAlerts(false),
        getRiskAlerts(true),
      ]);
      setUnhandledAlerts(unhandled);
      setHandledAlerts(handled);
    } catch (error) {
      console.error('加载预警失败:', error);
      toast.error('加载预警失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setNotes('');
    setDialogOpen(true);
  };

  const handleMarkAsHandled = async () => {
    if (!user || !selectedAlert) return;

    try {
      await handleRiskAlert(selectedAlert.id, user.id, notes || undefined);
      toast.success('预警已处理');
      setDialogOpen(false);
      await loadAlerts();
    } catch (error) {
      console.error('处理失败:', error);
      toast.error('处理失败');
    }
  };

  const getRiskLevelColor = (level: number) => {
    if (level >= 8) return 'destructive';
    if (level >= 5) return 'default';
    return 'secondary';
  };

  const AlertCard = ({ alert, showActions = true }: { alert: RiskAlert; showActions?: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getRiskLevelColor(alert.risk_level)}>
                风险等级 {alert.risk_level}/10
              </Badge>
              <Badge variant="outline">{alert.alert_type}</Badge>
            </div>
            <CardTitle className="text-base">
              {(alert as any).profiles?.full_name || (alert as any).profiles?.username || '患者'}
            </CardTitle>
          </div>
          {alert.is_handled && (
            <Badge variant="outline" className="text-success">
              <CheckCircle className="w-3 h-3 mr-1" />
              已处理
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">预警描述</p>
          <p className="text-sm text-muted-foreground">{alert.description}</p>
        </div>

        {alert.data_source && (
          <div>
            <p className="text-sm font-medium mb-1">数据来源</p>
            <p className="text-sm text-muted-foreground">{alert.data_source}</p>
          </div>
        )}

        {alert.is_handled && alert.notes && (
          <div>
            <p className="text-sm font-medium mb-1">处理备注</p>
            <p className="text-sm text-muted-foreground">{alert.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(alert.created_at).toLocaleString('zh-CN')}
          </span>
          {alert.is_handled && alert.handled_at && (
            <span>
              处理于 {new Date(alert.handled_at).toLocaleString('zh-CN')}
            </span>
          )}
        </div>

        {showActions && !alert.is_handled && (
          <Button
            className="w-full"
            onClick={() => handleOpenDialog(alert)}
          >
            标记为已处理
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">预警消息</h1>
        <p className="text-muted-foreground mt-1">监控和处理高风险预警</p>
      </div>

      <Tabs defaultValue="unhandled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unhandled" className="relative">
            待处理
            {unhandledAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unhandledAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="handled">已处理</TabsTrigger>
        </TabsList>

        <TabsContent value="unhandled" className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 bg-muted" />
              ))}
            </>
          ) : unhandledAlerts.length > 0 ? (
            unhandledAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无待处理预警</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="handled" className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 bg-muted" />
              ))}
            </>
          ) : handledAlerts.length > 0 ? (
            handledAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} showActions={false} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无已处理预警</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 处理预警对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理预警</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAlert && (
              <>
                <div className="p-4 bg-accent/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskLevelColor(selectedAlert.risk_level)}>
                      风险等级 {selectedAlert.risk_level}/10
                    </Badge>
                    <Badge variant="outline">{selectedAlert.alert_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">处理备注(可选)</label>
                  <Textarea
                    placeholder="记录处理措施和建议..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleMarkAsHandled} className="w-full">
                  确认已处理
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
