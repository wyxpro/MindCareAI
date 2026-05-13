import { motion } from 'framer-motion';
import { Play, Gamepad2, Smartphone, Hand, MoveUp, MoveDown, MoveLeft, MoveRight, Flame, Zap, Rainbow } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GameTab() {
  const handleStartGame = () => {
    window.open('https://poki.com/zh/g/temple-run-2-holi-festival#fullscreen', '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative -mx-4 mt-1 h-[calc(100vh-160px)] bg-gradient-to-br from-[#1a2f18] via-[#2d5016] to-[#4a7c2c] overflow-hidden rounded-t-[32px] rounded-b-[40px] flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.3)] border-t border-yellow-500/30">
      {/* 神庙逃亡2风格背景 - 指定背景图 */}
      <div className="absolute inset-0 bg-[url('https://wx1.sinaimg.cn/mw690/a72e4501ly1i93jc9jovkj20u01ur1ky.jpg')] bg-cover bg-center opacity-90 pointer-events-none" />
      
      {/* 渐变叠加层 - 调暗增强文字可读性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000]/30 via-[#000]/10 to-[#000]/40 pointer-events-none" />
      
      {/* 动态彩色光斑 - 节日氛围 */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-gradient-to-r from-red-500/30 to-orange-500/30 blur-3xl pointer-events-none"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-52 h-52 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none"
        animate={{
          x: [0, -40, 0],
          y: [0, 20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-36 h-36 rounded-full bg-gradient-to-r from-yellow-500/20 to-green-500/20 blur-3xl pointer-events-none"
        animate={{
          x: [0, 25, 0],
          y: [0, 30, 0],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* 动态粒子效果 */}
      <div className="absolute inset-0 opacity-[0.6] pointer-events-none" style={{ 
        backgroundImage: `radial-gradient(circle at 2px 2px, #fbbf24 1px, transparent 0), 
                          radial-gradient(circle at 15px 15px, #f87171 0.5px, transparent 0),
                          radial-gradient(circle at 8px 25px, #60a5fa 0.5px, transparent 0)`, 
        backgroundSize: '40px 40px, 60px 60px, 50px 50px' 
      }} />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center pt-6 px-5 space-y-4 flex-1 overflow-y-auto no-scrollbar"
      >
        {/* Game Icon with Subtle Glow */}
        <motion.div variants={itemVariants} className="relative group">
          <div className="absolute inset-0 bg-orange-400/10 blur-[30px] rounded-full scale-110 group-hover:bg-orange-400/20 transition-all duration-700" />
          <div className="relative w-24 h-24 rounded-[28px] overflow-hidden border-[3px] border-white shadow-lg shadow-orange-200/50">
            <img 
              src="https://image.9game.cn/s/9game/g/2021/1/28/207154297.png" 
              alt="Temple Run 2" 
              className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
            />
          </div>
        </motion.div>

        {/* Title & Specs */}
        <motion.div variants={itemVariants} className="text-center space-y-1.5">
          <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">神庙逃亡 2</h1>
          <p className="text-yellow-300 text-[10px] font-bold tracking-widest uppercase drop-shadow-md">Holi Festival · 跑酷闯关</p>
          
          <div className="flex items-center justify-center gap-2 pt-1 border-slate-700">
            <div className="flex items-center gap-1 px-3 py-1 bg-white/90 border border-orange-200 rounded-full text-orange-700 text-[10px] font-black shadow-md">
              <Flame className="w-3 h-3 text-orange-500" /> 动作
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-white/90 border border-blue-200 rounded-full text-blue-700 text-[10px] font-black shadow-md">
              <Zap className="w-3 h-3 text-blue-500" /> 跑酷
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-white/90 border border-purple-200 rounded-full text-purple-700 text-[10px] font-black shadow-md">
              <Rainbow className="w-3 h-3 text-purple-500" /> 节日
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div variants={itemVariants} className="w-full max-w-[280px]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 rounded-[22px] blur-lg opacity-30 group-hover:opacity-50 transition duration-1000" />
            <Button 
              onClick={handleStartGame}
              className="relative w-full h-14 rounded-[20px] bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 hover:scale-[1.02] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white ring-2 ring-white/10">
                <Play className="w-4.5 h-4.5 fill-white" />
              </div>
              <span className="text-lg font-black text-white tracking-wider">开始游戏</span>
            </Button>
          </div>
          <p className="text-center text-[9px] text-yellow-200 mt-3 font-bold uppercase tracking-[0.15em] opacity-90 drop-shadow-sm">将在浏览器中全屏运行</p>
        </motion.div>

        {/* Info Cards */}
        <div className="w-full max-w-md space-y-4 pb-8">
          {/* Brief */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[28px]" />
            
            <div className="relative p-5 space-y-2">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center ring-1 ring-orange-500/20">
                  <Gamepad2 className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-white font-black text-[12px] uppercase tracking-widest drop-shadow-md">游戏简介</h3>
              </div>
              <p className="text-white/80 text-[11px] leading-relaxed font-medium">
                经典无尽跑酷游戏。在 <span className="text-orange-400 font-bold">Holi Festival</span> 版本中，奔驰在五彩世界，躲避障碍跳跃，享受飞驰快感！
              </p>
            </div>
          </motion.div>

          {/* Controls - Two Rows Layout */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[28px]" />

            <div className="relative p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-white font-black text-[12px] uppercase tracking-widest drop-shadow-md">操作说明</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 ring-1 ring-orange-500/20">
                    <MoveUp className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-white/90">上滑 — 跳跃</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20">
                    <MoveDown className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-white/90">下滑 — 下蹲</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 ring-1 ring-purple-500/20">
                    <MoveLeft className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-white/90">左滑 — 左转</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 ring-1 ring-emerald-500/20">
                    <MoveRight className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-white/90">右滑 — 右转</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 rounded-xl border border-white/5">
                  <Hand className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest drop-shadow-sm">手势或方向键控制</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
