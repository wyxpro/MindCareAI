/**
 * 带压缩功能的视频上传组件
 */

import { AlertCircle, CheckCircle, Film, Loader2, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/db/api';
import {
  compressVideo,
  estimateCompressedSize,
  formatFileSize, 
  getVideoInfo
} from '@/utils/video-compressor';

interface VideoUploadCompressedProps {
  onUploadComplete?: (url: string, file: File) => void;
  accept?: string;
  maxSize?: number; // MB
}

export function VideoUploadCompressed({
  onUploadComplete,
  accept = 'video/*',
  maxSize = 100
}: VideoUploadCompressedProps) {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件大小
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`文件大小超过 ${maxSize}MB 限制`);
      return;
    }

    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setCompressedSize(0);
    setUploadedUrl(null);

    // 自动开始压缩
    await compressAndUpload(selectedFile);
  };

  const compressAndUpload = async (videoFile: File) => {
    try {
      // 获取视频信息
      toast.info('正在分析视频...', { duration: 2000 });
      const info = await getVideoInfo(videoFile);

      // 估算压缩后大小
      const estimatedSize = estimateCompressedSize(
        videoFile.size,
        info.duration,
        1000 // 1000kbps
      );

      toast.loading(`准备压缩视频...`, { id: 'compress' });

      // 压缩视频
      setCompressing(true);
      setProgress(0);

      const startTime = Date.now();
      const compressedBlob = await compressVideo(
        videoFile,
        {
          maxWidth: 720,
          maxHeight: 1280,
          bitrate: 1000,
          fps: 24,
          format: 'video/webm'
        },
        (progress) => {
          setProgress(progress);
          toast.loading(`压缩中... ${Math.round(progress)}%`, { id: 'compress' });
        }
      );

      const compressTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setCompressedSize(compressedBlob.size);
      setCompressing(false);

      toast.success(`压缩完成！耗时 ${compressTime}秒`, { id: 'compress' });

      // 显示压缩效果
      const compressionRatio = ((1 - compressedBlob.size / videoFile.size) * 100).toFixed(1);
      toast.success(
        `压缩率: ${compressionRatio}% | ${formatFileSize(videoFile.size)} → ${formatFileSize(compressedBlob.size)}`,
        { duration: 5000 }
      );

      // 上传压缩后的视频
      await uploadCompressedVideo(compressedBlob);

    } catch (error) {
      console.error('视频处理失败:', error);
      toast.error('视频处理失败，请重试');
      setCompressing(false);
    }
  };

  const uploadCompressedVideo = async (blob: Blob) => {
    try {
      setUploading(true);
      toast.loading('上传中...', { id: 'upload' });

      // 将 Blob 转换为 File
      const compressedFile = new File([blob], 'compressed-video.webm', { type: 'video/webm' });

      // 上传
      const result = await uploadFile(compressedFile);
      setUploadedUrl(result.url);
      setUploading(false);

      toast.success('上传成功！', { id: 'upload' });
      onUploadComplete?.(result.url, compressedFile);

    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请重试');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setUploadedUrl(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    if (uploadedUrl) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (uploading) return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (compressing) return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />;
    if (file) return <Film className="w-5 h-5 text-gray-500" />;
    return <Upload className="w-5 h-5 text-gray-400" />;
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
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-gray-600">点击上传视频</span>
            <span className="text-xs text-gray-400">最大 {maxSize}MB，上传前自动压缩</span>
          </div>
        </Button>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          {/* 文件信息 */}
          <div className="flex items-start gap-3">
            <div className="mt-1">{getStatusIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>原始: {formatFileSize(originalSize)}</span>
                {compressedSize > 0 && (
                  <>
                    <span>→</span>
                    <span className="text-green-600">
                      压缩后: {formatFileSize(compressedSize)}
                    </span>
                    <span className="text-orange-600">
                      ({((1 - compressedSize / originalSize) * 100).toFixed(1)}% ↓)
                    </span>
                  </>
                )}
              </div>
            </div>
            {!compressing && !uploading && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 进度条 */}
          {(compressing || uploading) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {compressing ? '压缩中...' : '上传中...'} {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* 上传成功 */}
          {uploadedUrl && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>上传成功！视频已准备好分析</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoUploadCompressed;
