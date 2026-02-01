/**
 * 基于关键帧的视频上传组件
 * 适用于表情分析等场景，只上传关键帧而非完整视频
 */

import { CheckCircle, Film, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/db/api';
import { extractFirstFrame, extractKeyFrames } from '@/utils/video-frame-extractor';

interface VideoFrameUploadProps {
  onUploadComplete?: (urls: string[]) => void;
  maxFrames?: number;
  accept?: string;
}

export function VideoFrameUpload({
  onUploadComplete,
  maxFrames = 3,
  accept = 'video/*'
}: VideoFrameUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewFrame, setPreviewFrame] = useState<string>('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadedUrls([]);

    // 自动开始处理
    await processVideo(selectedFile);
  };

  const processVideo = async (videoFile: File) => {
    try {
      // 步骤 1: 提取预览帧
      toast.loading('正在提取视频帧...', { id: 'extract' });
      setExtracting(true);

      const previewBase64 = await extractFirstFrame(videoFile, 0.7, 480);
      setPreviewFrame(previewBase64);
      toast.success('视频预览已生成', { id: 'extract' });

      // 步骤 2: 提取关键帧
      toast.loading('正在分析视频，提取关键帧...', { id: 'extract' });
      const frames = await extractKeyFrames(videoFile, {
        maxFrames,
        interval: 2,
        quality: 0.7,
        maxWidth: 720
      });

      toast.success(`成功提取 ${frames.length} 个关键帧`, { id: 'extract' });
      setExtracting(false);

      // 步骤 3: 上传关键帧
      await uploadFrames(frames);

    } catch (error) {
      console.error('视频处理失败:', error);
      toast.error('视频处理失败，请重试');
      setExtracting(false);
    }
  };

  const uploadFrames = async (frames: Array<{ blob: Blob; base64: string }>) => {
    try {
      setUploading(true);
      const urls: string[] = [];

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const frameProgress = ((i + 1) / frames.length) * 100;
        setProgress(frameProgress);

        toast.loading(`上传关键帧 ${i + 1}/${frames.length}...`, { id: 'upload' });

        // 将 base64 转换为 File
        const base64Data = frame.base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const file = new File([blob], `frame-${i}.jpg`, { type: 'image/jpeg' });

        const result = await uploadFile(file);
        urls.push(result.url);
      }

      setUploadedUrls(urls);
      setUploading(false);
      toast.success(`成功上传 ${urls.length} 个关键帧！`, { id: 'upload' });

      onUploadComplete?.(urls);

    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请重试');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewFrame('');
    setUploadedUrls([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!file ? (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full h-32 border-dashed"
        >
          <div className="flex flex-col items-center gap-2">
            <Film className="w-8 h-8 text-gray-400" />
            <span className="text-gray-600">上传视频</span>
            <span className="text-xs text-gray-400">
              自动提取关键帧用于分析
            </span>
          </div>
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          {/* 文件信息 */}
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {uploadedUrls.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : uploading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : extracting ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : (
                <Film className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {extracting && '正在提取关键帧...'}
                {uploading && `正在上传 ${uploadedUrls.length}/${maxFrames} 帧...`}
                {uploadedUrls.length > 0 && `✓ 已上传 ${uploadedUrls.length} 个关键帧`}
              </p>
            </div>
            {!extracting && !uploading && (
              <Button size="sm" variant="ghost" onClick={handleRemove}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 预览帧 */}
          {previewFrame && (
            <div className="relative">
              <img
                src={previewFrame}
                alt="预览"
                className="w-full h-48 object-cover rounded-lg"
              />
              {extracting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-sm">分析视频中...</div>
                </div>
              )}
            </div>
          )}

          {/* 进度条 */}
          {(extracting || uploading) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* 上传成功 */}
          {uploadedUrls.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>
                成功！已上传 {uploadedUrls.length} 个关键帧用于表情分析
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoFrameUpload;
