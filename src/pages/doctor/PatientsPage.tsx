import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getAllProfiles, getEmotionDiaries, getAssessments } from '@/db/api';
import { Search, Eye, TrendingUp, Activity } from 'lucide-react';
import type { Profile } from '@/types';

export default function PatientsPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const profiles = await getAllProfiles();
      const patientList = profiles.filter(p => p.role === 'user');
      setPatients(patientList);
    } catch (error) {
      console.error('加载患者失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patient: Profile) => {
    setSelectedPatient(patient);
    setDetailsDialogOpen(true);
    try {
      const [diaries, assessments] = await Promise.all([
        getEmotionDiaries(patient.id, 30),
        getAssessments(patient.id, 10),
      ]);
      setPatientDetails({ diaries, assessments });
    } catch (error) {
      console.error('加载患者详情失败:', error);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">患者管理</h1>
          <p className="text-muted-foreground mt-1">查看和管理患者信息</p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索患者姓名或用户名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 患者列表 */}
      <Card>
        <CardHeader>
          <CardTitle>患者列表 ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 bg-muted" />
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarImage src={patient.avatar_url} />
                      <AvatarFallback>
                        {patient.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {patient.full_name || patient.username}
                        </span>
                        <Badge variant="outline">@{patient.username}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {patient.gender && <span>{patient.gender} · </span>}
                        注册于 {new Date(patient.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPatientDetails(patient)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看详情
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>未找到患者</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 患者详情对话框 */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>患者详情</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedPatient.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {selectedPatient.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedPatient.full_name || selectedPatient.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{selectedPatient.username}</p>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">情绪日记</p>
                        <p className="text-2xl font-bold">
                          {patientDetails?.diaries?.length || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">评估记录</p>
                        <p className="text-2xl font-bold">
                          {patientDetails?.assessments?.length || 0}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近评估 */}
              {patientDetails?.assessments && patientDetails.assessments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">最近评估</h4>
                  <div className="space-y-2">
                    {patientDetails.assessments.slice(0, 3).map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={assessment.risk_level > 5 ? 'destructive' : 'default'}>
                            风险等级 {assessment.risk_level || 'N/A'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(assessment.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        {assessment.report && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assessment.report.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
