/**
 * 视频压缩工具
 * 在客户端压缩视频后再上传，减少上传时间和带宽消耗
 */

export interface VideoCompressionOptions {
  maxWidth?: number;           // 最大宽度，默认 720
  maxHeight?: number;          // 最大高度，默认 1280
  bitrate?: number;            // 目标比特率 (kbps)，默认 1000
  fps?: number;                // 目标帧率，默认 24
  format?: 'video/webm' | 'video/mp4';  // 输出格式
}

/**
 * 压缩视频文件
 * @param file 原始视频文件
 * @param options 压缩选项
 * @param onProgress 进度回调 (0-100)
 * @returns 压缩后的 Blob
 */
export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const {
    maxWidth = 720,
    maxHeight = 1280,
    bitrate = 1000,
    fps = 24,
    format = 'video/webm'
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // 创建 Canvas 用于调整尺寸
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取 Canvas 上下文'));
        return;
      }

      // 计算目标尺寸（保持宽高比）
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 设置 MediaRecorder
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: format,
        videoBitsPerSecond: bitrate * 1000
      });

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: format });
        onProgress?.(100);
        resolve(compressedBlob);
      };

      mediaRecorder.onerror = (e) => {
        reject(new Error('视频压缩失败'));
      };

      // 开始录制
      mediaRecorder.start();

      // 播放并捕获每一帧
      video.currentTime = 0;
      video.playbackRate = 2.0; // 加速处理

      const duration = video.duration;
      const interval = 1000 / fps;
      let currentTime = 0;

      const captureFrame = () => {
        ctx?.drawImage(video, 0, 0, targetWidth, targetHeight);
        const progress = (currentTime / duration) * 100;
        onProgress?.(progress);

        currentTime += interval / 1000 * video.playbackRate;

        if (currentTime < duration) {
          video.currentTime = currentTime;
          video.addEventListener('seeked', () => {
            requestAnimationFrame(captureFrame);
          }, { once: true });
        } else {
          mediaRecorder.stop();
        }
      };

      video.play().then(captureFrame).catch(reject);
    };

    video.onerror = () => reject(new Error('无法加载视频'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * 获取视频文件信息
 */
export async function getVideoInfo(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size
      });
    };

    video.onerror = () => reject(new Error('无法加载视频'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * 估算压缩后的大小
 */
export function estimateCompressedSize(
  originalSize: number,
  originalDuration: number,
  targetBitrate: number
): number {
  // 估算公式：bitrate(kbps) * duration(s) / 8 = size(KB)
  const estimatedBytes = (targetBitrate * originalDuration) / 8 * 1024;
  return Math.round(estimatedBytes);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
