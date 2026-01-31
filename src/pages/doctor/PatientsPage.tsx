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
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">患者管理</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">查看和管理患者信息</p>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2 px-1">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="搜索姓名或用户名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 md:h-10 rounded-xl"
          />
        </div>
      </div>

      {/* 患者列表 */}
      <Card className="border-0 md:border shadow-sm">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">患者列表 ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 bg-muted rounded-xl" />
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 md:w-10 md:h-10">
                      <AvatarImage src={patient.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {patient.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {patient.full_name || patient.username}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-medium bg-muted">@{patient.username}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {patient.gender && <span>{patient.gender}</span>}
                        {patient.gender && <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
                        <span>注册于 {new Date(patient.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 sm:h-9 rounded-lg"
                    onClick={() => loadPatientDetails(patient)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
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
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">患者详情</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-white shadow-sm">
                  <AvatarImage src={selectedPatient.avatar_url} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {selectedPatient.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    {selectedPatient.full_name || selectedPatient.username}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">@{selectedPatient.username}</p>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Card className="border-0 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">情绪日记</p>
                        <p className="text-xl md:text-2xl font-black text-blue-600">
                          {patientDetails?.diaries?.length || 0}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-purple-50/50 dark:bg-purple-950/20">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">评估记录</p>
                        <p className="text-xl md:text-2xl font-black text-purple-600">
                          {patientDetails?.assessments?.length || 0}
                        </p>
                      </div>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近评估 */}
              {patientDetails?.assessments && patientDetails.assessments.length > 0 ? (
                <div>
                  <h4 className="font-bold text-lg mb-4 px-1">最近评估</h4>
                  <div className="space-y-3">
                    {patientDetails.assessments.slice(0, 3).map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="p-4 border border-border rounded-xl bg-card hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge 
                            variant={assessment.risk_level > 5 ? 'destructive' : 'default'}
                            className="px-2 py-0.5 text-[10px]"
                          >
                            风险等级 {assessment.risk_level || 'N/A'}
                          </Badge>
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            {new Date(assessment.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        {assessment.report && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {assessment.report.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  暂无评估记录
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
