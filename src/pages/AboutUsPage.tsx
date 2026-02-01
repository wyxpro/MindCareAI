import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Heart, Shield, Sparkles, 
  Users, Globe, Github, Mail, ExternalLink,
  Zap, Brain, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AboutUsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-12">
      {/* Header */}
      <div className="px-4 py-4 sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">关于我们</h1>
      </div>

      <div className="max-w-md mx-auto px-6 pt-0 space-y-12">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-primary to-indigo-600 text-white">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="px-6 py-10 text-center space-y-4 relative z-10">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-[28px] mx-auto bg-white/15 backdrop-blur flex items-center justify-center"
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black tracking-tight">MindCare AI</h2>
            <p className="text-white/80 text-xs font-medium uppercase tracking-[0.25em]">灵愈AI · 数字化心理医疗</p>
            <p className="text-sm text-white/90 leading-relaxed max-w-[300px] mx-auto">
              用多模态AI与人文关怀，打造专业、私密、温暖的心理健康服务。
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Badge className="bg-white/20 border-white/30 text-white">隐私加密</Badge>
              <Badge className="bg-white/20 border-white/30 text-white">医学规范</Badge>
              <Badge className="bg-white/20 border-white/30 text-white">全天候响应</Badge>
            </div>
          </div>
        </div>

        {/* Vision Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-slate-50 dark:bg-slate-900 rounded-3xl">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold">隐私至上</h3>
              <p className="text-[10px] text-slate-400 leading-normal">端到端加密，严格守护您的每一份心声。</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-slate-50 dark:bg-slate-900 rounded-3xl">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-sm font-bold">温暖陪伴</h3>
              <p className="text-[10px] text-slate-400 leading-normal">24/7 在线回应，陪你走出情绪低谷。</p>
            </CardContent>
          </Card>
        </div>

        {/* 我们做什么 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">我们做什么</h3>
          </div>
          <Card className="border-0 rounded-3xl bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                通过语音、文本、微表情等多模态数据，构建科学的心理评估与个性化干预方案。
              </p>
              <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> 多模态识别</div>
                <div className="flex items-center gap-2"><Users className="w-3 h-3 text-primary" /> 专家复核</div>
                <div className="flex items-center gap-2"><Heart className="w-3 h-3 text-primary" /> 个性化疗愈</div>
                <div className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> 医学级隐私</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center py-6 border-y border-slate-100 dark:border-slate-800">
          <div className="text-center space-y-1">
            <p className="text-xl font-black text-primary">50k+</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">服务用户</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black text-primary">98%</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">识别精度</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black text-primary">24/7</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">全天候响应</p>
          </div>
        </div>

        {/* Team / Social */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">联系我们</h3>
          <div className="flex justify-center gap-6">
            <button className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Globe className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <Mail className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <p className="text-[10px] text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest">
            Made with ❤️ for Mental Health
          </p>
          <p className="text-[9px] text-slate-200 dark:text-slate-800 mt-2">
            MindCare AI v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
