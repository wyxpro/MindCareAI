import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Search, Filter, Star, ShieldCheck, 
  MessageCircle, Video, Calendar, MapPin, ArrowRight,
  UserCheck, Award, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ConnectDoctorPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const doctors = [
    {
      id: 1,
      name: '陈医生',
      title: '主任医师',
      specialty: '重度抑郁 / 焦虑障碍',
      hospital: '上海精神卫生中心',
      rating: 4.9,
      reviews: 128,
      experience: '15年经验',
      tags: ['专业亲和', '回复及时'],
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor1',
      status: 'online',
    },
    {
      id: 2,
      name: '李教授',
      title: '资深心理咨询师',
      specialty: '青少年心理 / 家庭关系',
      hospital: '灵愈AI在线中心',
      rating: 4.8,
      reviews: 256,
      experience: '12年经验',
      tags: ['资深导师', '逻辑清晰'],
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor2',
      status: 'busy',
    },
    {
      id: 3,
      name: '王医师',
      title: '副主任医师',
      specialty: '睡眠障碍 / 职场压力',
      hospital: '华山医院心理科',
      rating: 4.7,
      reviews: 89,
      experience: '8年经验',
      tags: ['耐心周到', '方案落地'],
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor3',
      status: 'offline',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-6 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">对接医生</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="搜索医生、科室、疾病..." 
            className="pl-10 h-11 bg-slate-100/50 border-none rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* 快速分类 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['全部医生', '专家门诊', '在线咨询', '视频问诊', '心理咨询'].map((tab, i) => (
            <Badge 
              key={tab} 
              variant={i === 0 ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border-slate-200 dark:border-slate-800 ${i === 0 ? 'bg-primary' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
            >
              {tab}
            </Badge>
          ))}
        </div>

        {/* 专家列表 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">推荐专家</h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-bold">查看全部</Button>
          </div>

          {doctors.map((doctor) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16 rounded-2xl border-2 border-slate-50">
                        <AvatarImage src={doctor.avatar} />
                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        doctor.status === 'online' ? 'bg-emerald-500' : 
                        doctor.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100">{doctor.name}</h3>
                          <span className="text-[10px] text-slate-400 font-medium">{doctor.title}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{doctor.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-primary font-bold">{doctor.specialty}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{doctor.hospital}</span>
                        <span className="mx-1">|</span>
                        <span>{doctor.experience}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    {doctor.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-5">
                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold border-slate-100 dark:border-slate-800">
                      <MessageCircle className="w-3.5 h-3.5 mr-2" />
                      图文咨询
                    </Button>
                    <Button className="flex-1 rounded-xl h-10 text-xs font-bold bg-primary hover:bg-primary/90">
                      <Video className="w-3.5 h-3.5 mr-2" />
                      预约视频
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 底部保障 */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-6 flex flex-wrap gap-y-4">
          <div className="w-1/2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">隐私严格加密</span>
          </div>
          <div className="w-1/2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">执业资格认证</span>
          </div>
          <div className="w-1/2 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">三甲名医资源</span>
          </div>
          <div className="w-1/2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">7x24h 在线响应</span>
          </div>
        </div>
      </div>
    </div>
  );
}
