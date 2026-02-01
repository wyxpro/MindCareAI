import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Image as ImageIcon, X, Loader2, Camera, Upload, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { convertWebmToWav } from '@/utils/audio';
import { speechRecognition, uploadFile } from '@/db/api';

interface QuickNoteProps {
  onSave: (data: {
    content: string;
    imageUrls: string[];
    voiceUrl?: string;
  }) => Promise<void>;
  initialContent?: string;
  initialImages?: string[];
}

export default function QuickNote({ onSave, initialContent = '', initialImages = [] }: QuickNoteProps) {
  const [content, setContent] = useState(initialContent);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭选项菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowCameraOptions(false);
      }
    };

    if (showCameraOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCameraOptions]);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('开始录音...');
    } catch (error) {
      console.error('录音失败:', error);
      toast.error('无法访问麦克风');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 处理音频
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // 转换为WAV格式
      const wavBlob = await convertWebmToWav(audioBlob);
      // 调用语音识别 (使用 api.ts)
      const recognizedText = await speechRecognition(wavBlob, 'wav', 'zh');

      if (recognizedText?.text) {
        setContent(prev => prev ? `${prev}\n${recognizedText.text}` : recognizedText.text);
        toast.success('语音识别成功');
      } else {
        toast.error('无法识别语音内容');
      }
    } catch (error) {
      console.error('处理音频失败:', error);
      toast.error('处理音频失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 选择图片
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const uploadedUrls: string[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 验证文件大小 (最大5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`图片 ${file.name} 超过5MB限制`);
          errorCount++;
          continue;
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是有效的图片文件`);
          errorCount++;
          continue;
        }

        // 上传到 NestJS 后端 (使用 api.ts)
        const uploadResult = await uploadFile(file);

        if (uploadResult?.url) {
          uploadedUrls.push(uploadResult.url);
          successCount++;
        } else {
          toast.error(`上传 ${file.name} 失败`);
          errorCount++;
        }
      }

      if (uploadedUrls.length > 0) {
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        if (errorCount === 0) {
          toast.success(`成功上传 ${successCount} 张图片`);
        } else {
          toast.success(`成功上传 ${successCount} 张图片，${errorCount} 张失败`);
        }
      } else if (errorCount > 0) {
        toast.error('所有图片上传失败');
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      toast.error('处理图片失败');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除图片
  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    toast.success('图片已删除');
  };

  // 打开相册选择
  const openGallery = () => {
    setShowCameraOptions(false);
    fileInputRef.current?.click();
  };

  // 打开相机拍照
  const openCamera = () => {
    setShowCameraOptions(false);
    cameraInputRef.current?.click();
  };

  // 保存记录
  const handleSave = async () => {
    if (!content.trim() && imageUrls.length === 0) {
      toast.error('请输入内容或上传图片');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        imageUrls,
      });

      // 清空表单
      setContent('');
      setImageUrls([]);
      toast.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-white dark:bg-slate-800">
      <CardContent className="p-4 space-y-4">
        {/* 文本输入区 */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下点什么..."
          className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base"
        />

        {/* 图片预览 */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {/* 语音输入 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`transition-all duration-200 ${isRecording
                ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20'
                : 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
                }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
              <span className="ml-1 text-sm">
                {isRecording ? '停止录音' : '语音输入'}
              </span>
            </Button>

            {/* 图片上传 */}
            <div className="relative" ref={optionsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCameraOptions(!showCameraOptions)}
                disabled={isProcessing}
                className="hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="ml-1 text-sm">添加图片</span>
              </Button>

              {/* 图片选择选项 */}
              {showCameraOptions && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px] animate-in fade-in-0 zoom-in-95 duration-150">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openGallery}
                    className="w-full justify-start rounded-t-lg rounded-b-none hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    从相册选择
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openCamera}
                    className="w-full justify-start rounded-b-lg rounded-t-none hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    拍照
                  </Button>
                </div>
              )}
            </div>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* 状态提示 */}
            {isProcessing && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {isRecording ? '录音中...' : '处理中...'}
              </Badge>
            )}
          </div>

          {/* 保存按钮 */}
          <Button
            onClick={handleSave}
            disabled={isSaving || isProcessing || (!content.trim() && imageUrls.length === 0)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存记录'
            )}
          </Button>
        </div>

        {/* 输入提示 */}
        {!content && imageUrls.length === 0 && !isRecording && (
          <div className="text-center py-2">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              💡 支持文字输入、语音识别和图片上传
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
