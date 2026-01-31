import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, Crown, Check, Zap, Star, 
  CreditCard, History, Receipt, ArrowRight, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = [
    {
      id: 'monthly',
      name: '月度会员',
      price: '¥28',
      originalPrice: '¥45',
      tag: '入门首选',
      features: ['多模态AI情绪分析', '全量心理评估量表', '高清报告下载', '7x24小时AI陪伴']
    },
    {
      id: 'yearly',
      name: '年度会员',
      price: '¥198',
      originalPrice: '¥540',
      tag: '超值推荐',
      popular: true,
      features: ['包含月度所有权益', '专家1对1咨询折扣', '高级冥想课程解锁', '专属身份标识']
    },
    {
      id: 'lifetime',
      name: '终身会员',
      price: '¥698',
      tag: '一劳永逸',
      features: ['终身解锁所有功能', '未来所有高级权益', '限量定制周边', '终身云端存储']
    }
  ];

  const handleSubscribe = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: '正在调起支付模块...',
        success: '支付环境安全，请在弹出的窗口中完成支付',
        error: '支付模块初始化失败'
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 pt-4 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
          <Crown className="w-32 h-32 text-white" />
        </div>
        <div className="flex items-center gap-4 relative z-10 text-white">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">会员中心</h1>
        </div>
        
        {/* 当前状态 */}
        <div className="mt-6 px-2 relative z-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Star className="w-6 h-6 text-amber-200 fill-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">普通会员</span>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-[10px]">未开通</Badge>
              </div>
              <p className="text-amber-100 text-xs mt-1">开通会员，解锁 12 项高级 AI 疗愈权益</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 -mt-8 relative z-20 space-y-6">
        {/* 套餐选择 */}
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`border-2 transition-all cursor-pointer overflow-hidden ${
                selectedPlan === plan.id 
                ? 'border-amber-500 shadow-lg scale-[1.02]' 
                : 'border-transparent shadow-sm hover:border-amber-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-amber-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedPlan === plan.id ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {plan.id === 'lifetime' ? <Zap className="w-6 h-6 text-amber-600" /> : <CreditCard className="w-6 h-6 text-amber-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{plan.name}</div>
                    <div className="text-xs text-slate-400">{plan.tag}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-600">{plan.price}</div>
                  {plan.originalPrice && (
                    <div className="text-xs text-slate-300 line-through">{plan.originalPrice}</div>
                  )}
                </div>
              </CardContent>
              {selectedPlan === plan.id && (
                <CardFooter className="px-5 pb-5 pt-0 flex flex-wrap gap-x-4 gap-y-2 border-t mt-2 bg-amber-50/30">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-2">
                      <Check className="w-3 h-3 text-amber-500" />
                      {f}
                    </div>
                  ))}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>

        {/* 支付方式 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              安全支付环境
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 p-4 pt-0">
            <div className="flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">支</div>
              <span className="text-[10px] font-medium">支付宝</span>
            </div>
            <div className="flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">微</div>
              <span className="text-[10px] font-medium">微信支付</span>
            </div>
            <div className="flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>
              <span className="text-[10px] font-medium">信用卡</span>
            </div>
          </CardContent>
        </Card>

        {/* 管理功能 */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="ghost" className="flex flex-col h-auto p-3 gap-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl">
            <History className="w-5 h-5 text-slate-500" />
            <span className="text-[10px]">历史记录</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-auto p-3 gap-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl">
            <Receipt className="w-5 h-5 text-slate-500" />
            <span className="text-[10px]">申请发票</span>
          </Button>
          <Button variant="ghost" className="flex flex-col h-auto p-3 gap-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            <span className="text-[10px]">续费管理</span>
          </Button>
        </div>

        <Button 
          className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl rounded-2xl font-bold"
          onClick={handleSubscribe}
        >
          立即开通
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
