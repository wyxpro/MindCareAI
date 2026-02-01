/**
 * 分片上传工具
 * 将大文件分成多个小块上传，支持断点续传
 */

export interface ChunkedUploadOptions {
  chunkSize?: number;      // 每片大小 (字节)，默认 5MB
  maxRetries?: number;     // 最大重试次数，默认 3
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

interface UploadChunkResponse {
  chunkIndex: number;
  success: boolean;
  etag?: string;
}

/**
 * 分片上传文件
 */
export async function uploadFileInChunks(
  file: File,
  uploadUrl: string,
  options: ChunkedUploadOptions = {}
): Promise<string> {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB
    maxRetries = 3,
    onProgress,
    onChunkComplete
  } = options;

  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunkResponses: UploadChunkResponse[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Chunk ${i} upload failed`);
        }

        const result = await response.json();
        chunkResponses.push({
          chunkIndex: i,
          success: true,
          etag: result.etag
        });

        success = true;
        onChunkComplete?.(i, totalChunks);

      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Failed to upload chunk ${i} after ${maxRetries} retries`);
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // 更新进度
    const progress = ((i + 1) / totalChunks) * 100;
    onProgress?.(progress);
  }

  // 通知服务器合并分片
  const mergeResponse = await fetch(`${uploadUrl}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      totalChunks,
      chunks: chunkResponses
    })
  });

  if (!mergeResponse.ok) {
    throw new Error('Failed to merge chunks');
  }

  return mergeResponse.json().fileUrl;
}

/**
 * 带断点续传的分片上传
 */
export class ResumableUpload {
  private uploadedChunks = new Set<number>();
  private file: File;
  private uploadId: string;
  private chunkSize: number;

  constructor(file: File, uploadId: string, chunkSize = 5 * 1024 * 1024) {
    this.file = file;
    this.uploadId = uploadId;
    this.chunkSize = chunkSize;
  }

  /**
   * 从服务器获取已上传的分片信息
   */
  async getUploadedChunks(): Promise<number[]> {
    try {
      const response = await fetch(`/api/upload/status/${this.uploadId}`);
      const data = await response.json();
      this.uploadedChunks = new Set(data.uploadedChunks || []);
      return Array.from(this.uploadedChunks);
    } catch {
      return [];
    }
  }

  /**
   * 继续上传（只上传未完成的分片）
   */
  async resumeUpload(
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.getUploadedChunks();

    const totalChunks = Math.ceil(this.file.size / this.chunkSize);
    const remainingChunks = [];

    for (let i = 0; i < totalChunks; i++) {
      if (!this.uploadedChunks.has(i)) {
        remainingChunks.push(i);
      }
    }

    if (remainingChunks.length === 0) {
      // 所有分片都已上传，直接合并
      return this.completeUpload(uploadUrl);
    }

    // 上传剩余分片
    for (let i = 0; i < remainingChunks.length; i++) {
      const chunkIndex = remainingChunks[i];
      await this.uploadChunk(uploadUrl, chunkIndex);

      const progress = ((i + 1) / remainingChunks.length) * 100;
      onProgress?.(progress);
    }

    return this.completeUpload(uploadUrl);
  }

  private async uploadChunk(uploadUrl: string, chunkIndex: number): Promise<void> {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('uploadId', this.uploadId);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Chunk ${chunkIndex} upload failed`);
    }

    this.uploadedChunks.add(chunkIndex);
  }

  private async completeUpload(uploadUrl: string): Promise<string> {
    const response = await fetch(`${uploadUrl}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: this.uploadId })
    });

    if (!response.ok) {
      throw new Error('Failed to complete upload');
    }

    return response.json().fileUrl;
  }
}
