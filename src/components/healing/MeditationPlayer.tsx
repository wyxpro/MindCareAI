import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MeditationPlayerProps {
  content: {
    id: string;
    title: string;
    description?: string;
    content_url?: string;
    duration?: number;
    category: string;
  };
  onClose?: () => void;
}

export default function MeditationPlayer({ content, onClose }: MeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(content.duration || 300);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [breathScale, setBreathScale] = useState(1);

  // 呼吸动画效果
  useEffect(() => {
    if (isPlaying) {
      const breathInterval = setInterval(() => {
        setBreathScale(prev => {
          if (prev >= 1.3) return 1;
          return prev + 0.01;
        });
      }, 50);
      return () => clearInterval(breathInterval);
    }
  }, [isPlaying]);

  // 音频播放控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          {/* 顶部标签 */}
          <div className="flex justify-between items-center mb-6">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              正在播放
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
                关闭
              </Button>
            )}
          </div>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {content.title}
            </h2>
            <p className="text-slate-400">
              {content.description || '跟随圆圈缓缓呼吸'}
            </p>
          </div>

          {/* 呼吸动画圆圈 */}
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48">
              {/* 外圈发光效果 */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-indigo-500/30"
                style={{
                  transform: `scale(${breathScale * 1.1})`,
                  transition: 'transform 0.05s ease-out',
                  boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
                }}
              />
              
              {/* 内圈主体 */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                style={{
                  transform: `scale(${breathScale})`,
                  transition: 'transform 0.05s ease-out',
                  boxShadow: '0 0 60px rgba(99, 102, 241, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* 呼吸图标 */}
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipBack}
              className="w-12 h-12 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 text-slate-900 shadow-lg hover:shadow-xl transition-all"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipForward}
              className="w-12 h-12 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* 隐藏的音频元素 */}
          {content.content_url && (
            <audio ref={audioRef} src={content.content_url} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
