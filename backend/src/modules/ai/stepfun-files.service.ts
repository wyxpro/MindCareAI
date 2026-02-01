/**
 * StepFun Files API 服务
 * 将视频/图片上传到 StepFun 存储，提升访问速度
 * 参考: https://platform.stepfun.com/docs/guide/video_chat
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";

@Injectable()
export class StepFunFilesService {
  private readonly logger = new Logger(StepFunFilesService.name);
  private readonly apiBaseUrl = "https://api.stepfun.com/v1";
  private readonly maxFileSize = 128 * 1024 * 1024; // 128MB 限制

  constructor(private readonly configService: ConfigService) {}

  /**
   * 上传文件到 StepFun 存储
   * @param file 文件 Buffer 或 Multer 文件
   * @param filename 文件名
   * @param mimeType MIME 类型
   * @returns stepfile:// 格式的文件 ID
   */
  async uploadFile(
    file: Buffer | Express.Multer.File,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>("ai.apiKey");
    if (!apiKey) {
      throw new Error("API Key not configured");
    }

    // 获取文件内容
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      fileBuffer = file.buffer;
    }

    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

    // 检查文件大小（128MB 限制）
    if (fileBuffer.length > this.maxFileSize) {
      this.logger.error(`❌ 文件过大: ${fileSizeMB}MB，最大支持 128MB`);
      throw new Error(`文件太大 (${fileSizeMB}MB)。最大支持 128MB。`);
    }

    this.logger.log(`📤 开始上传文件到 StepFun: ${filename} (${fileSizeMB}MB)`);
    const startTime = Date.now();

    const formData = new FormData();
    formData.append("file", fileBuffer, { filename, contentType: mimeType });
    formData.append("purpose", "storage");

    try {
      // 监听上传进度
      const response = await axios.post(`${this.apiBaseUrl}/files`, formData, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            const uploadedMB = (progressEvent.loaded / 1024 / 1024).toFixed(2);
            const totalMB = (progressEvent.total / 1024 / 1024).toFixed(2);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // 每 10% 输出一次进度
            if (percentCompleted % 10 === 0 || percentCompleted === 100) {
              this.logger.log(
                `⏳ 上传进度: ${percentCompleted}% (${uploadedMB}/${totalMB}MB) - 耗时: ${elapsed}秒`,
              );
            }
          }
        },
      });

      const fileId = response.data.id;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`✅ 文件上传成功! ID: ${fileId}, 耗时: ${elapsed}秒`);

      return `stepfile://${fileId}`;
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.error(
        `❌ StepFun 上传失败 (耗时: ${elapsed}秒): ${error.message}`,
      );
      if (error.response?.data) {
        this.logger.error(`错误详情: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(
        `StepFun 文件上传失败: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * 上传本地视频文件到 StepFun 存储
   */
  async uploadLocalVideo(localPath: string): Promise<string> {
    if (!fs.existsSync(localPath)) {
      throw new Error(`文件不存在: ${localPath}`);
    }

    const filename = path.basename(localPath);
    const fileBuffer = fs.readFileSync(localPath);

    return this.uploadFile(fileBuffer, filename, "video/mp4");
  }

  /**
   * 上传音频 Buffer 到 StepFun 存储
   * @param audioBuffer 音频数据
   * @param filename 文件名
   * @param mimeType MIME 类型 (audio/wav, audio/mpeg, audio/mp4, audio/m4a)
   * @returns stepfile:// 格式的文件 ID
   */
  async uploadAudio(
    audioBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    return this.uploadFile(audioBuffer, filename, mimeType);
  }

  /**
   * 批量上传多个文件
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
    onProgress?: (current: number, total: number) => void,
  ): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = await this.uploadFile(
        file.buffer,
        file.filename,
        file.mimeType,
      );
      results.push(fileId);
      onProgress?.(i + 1, files.length);
    }

    return results;
  }

  /**
   * 检查文件是否已存在（通过文件名）
   */
  async checkFileExists(filename: string): Promise<string | null> {
    const apiKey = this.configService.get<string>("ai.apiKey");
    if (!apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/files`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const existingFile = response.data.data?.find(
        (f: any) => f.filename === filename,
      );
      return existingFile ? `stepfile://${existingFile.id}` : null;
    } catch {
      return null;
    }
  }

  /**
   * 删除 StepFun 存储中的文件
   */
  async deleteFile(fileId: string): Promise<void> {
    const apiKey = this.configService.get<string>("ai.apiKey");
    if (!apiKey) {
      throw new Error("API Key not configured");
    }

    // 移除 stepfile:// 前缀
    const actualId = fileId.replace("stepfile://", "");

    await axios.delete(`${this.apiBaseUrl}/files/${actualId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    this.logger.log(`文件已从 StepFun 删除: ${actualId}`);
  }

  /**
   * 将 stepfile:// URL 转换为消息内容格式
   * 用于发送给 AI API
   */
  formatAsVideoUrl(fileId: string): {
    type: string;
    video_url: { url: string };
  } {
    return {
      type: "video_url",
      video_url: { url: fileId },
    };
  }

  formatAsImageUrl(fileId: string): {
    type: string;
    image_url: { url: string };
  } {
    return {
      type: "image_url",
      image_url: { url: fileId },
    };
  }
}
