/**
 * 视频关键帧提取工具
 * 用于表情分析场景，只需上传关键帧而非完整视频
 */

export interface FrameExtractionOptions {
  maxFrames?: number;        // 最多提取帧数，默认 3
  interval?: number;         // 提取间隔(秒)，默认 2
  quality?: number;          // JPEG 质量 0-1，默认 0.7
  maxWidth?: number;         // 最大宽度，默认 720
}

export interface ExtractedFrame {
  blob: Blob;
  base64: string;
  timestamp: number;
}

/**
 * 从视频文件中提取关键帧
 */
export async function extractKeyFrames(
  videoFile: File,
  options: FrameExtractionOptions = {}
): Promise<ExtractedFrame[]> {
  const {
    maxFrames = 3,
    interval = 2,
    quality = 0.7,
    maxWidth = 720
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frames: ExtractedFrame[] = [];
      const timestamps: number[] = [];

      // 计算要提取的时间点（均匀分布）
      if (duration <= interval * maxFrames) {
        // 视频太短，提取 maxFrames 帧
        for (let i = 0; i < maxFrames; i++) {
          timestamps.push((duration / (maxFrames + 1)) * (i + 1));
        }
      } else {
        // 按间隔提取
        for (let t = interval; t < duration && timestamps.length < maxFrames; t += interval) {
          timestamps.push(t);
        }
      }

      let completedFrames = 0;

      const extractFrame = async (timestamp: number): Promise<ExtractedFrame> => {
        return new Promise((res, rej) => {
          video.currentTime = timestamp;

          video.onseeked = () => {
            try {
              // 创建 canvas 并绘制帧
              const canvas = document.createElement('canvas');

              // 计算目标尺寸（保持宽高比）
              let width = video.videoWidth;
              let height = video.videoHeight;

              if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = Math.round(height * ratio);
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                rej(new Error('无法获取 Canvas 上下文'));
                return;
              }

              ctx.drawImage(video, 0, 0, width, height);

              // 转换为 Blob 和 Base64
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    rej(new Error('无法生成 Blob'));
                    return;
                  }

                  const base64 = canvas.toDataURL('image/jpeg', quality);

                  res({
                    blob,
                    base64,
                    timestamp
                  });
                },
                'image/jpeg',
                quality
              );
            } catch (e) {
              rej(e);
            }
          };

          video.onerror = () => rej(new Error(`无法提取 ${timestamp}s 处的帧`));
        });
      };

      // 依次提取所有帧
      Promise.all(timestamps.map(extractFrame))
        .then((extractedFrames) => {
          resolve(extractedFrames);
        })
        .catch(reject);
    };

    video.onerror = () => reject(new Error('无法加载视频'));
    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * 提取单帧（用于快速预览）
 */
export async function extractFirstFrame(
  videoFile: File,
  quality = 0.7,
  maxWidth = 720
): Promise<string> {
  const frames = await extractKeyFrames(videoFile, {
    maxFrames: 1,
    quality,
    maxWidth
  });
  return frames[0]?.base64 || '';
}

/**
 * 批量提取帧并压缩为 ZIP（可选）
 */
export async function extractFramesAsZip(
  videoFile: File,
  options: FrameExtractionOptions = {}
): Promise<Blob> {
  const frames = await extractKeyFrames(videoFile, options);

  // 如果需要 JSZip，可以在这里添加
  // 目前返回单个 Blob
  return frames[0]?.blob || new Blob();
}
