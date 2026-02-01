import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import {
  TextChatDto,
  MultimodalAnalysisDto,
  SpeechRecognitionUploadDto,
  RagRetrievalDto,
  MultimodalFusionDto,
  ChatMessage,
} from './dto';
import { StepFunFilesService } from './stepfun-files.service';

/**
 * AI 服务
 * 处理所有 AI 相关的接口调用
 */
@Injectable()
export class AiService {
  private readonly bankedResponses = [
    '我理解你的感受，这确实是一个具有挑战性的情况。',
    '我们可以尝试从不同的角度来看待这个问题，你觉得呢？',
    '保持积极的心态对心理健康非常重要。',
    '如果你感到压力很大，试着深呼吸，放松自己。',
    '我在这里倾听，你愿意多分享一些关于这方面的细节吗？',
    '记录下你的情绪变化是一个很好的习惯。',
    '你的努力和坚持是非常宝贵的。',
    '记得给自己留出休息和放松的时间。',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly stepFunFilesService: StepFunFilesService,
  ) { }
  private readonly logger = new Logger(AiService.name);

  private buildChatPayload(
    dto: TextChatDto,
    streamOverride?: boolean,
  ): StepfunChatPayload {
    const payload: StepfunChatPayload = {
      model: dto.model || 'step-3',
      messages: dto.messages,
    };

    if (typeof streamOverride === 'boolean') {
      payload.stream = streamOverride;
    } else if (dto.stream !== undefined) {
      payload.stream = dto.stream;
    }

    if (dto.temperature !== undefined) {
      payload.temperature = dto.temperature;
    }
    if (dto.top_p !== undefined) {
      payload.top_p = dto.top_p;
    }
    if (dto.max_tokens !== undefined) {
      payload.max_tokens = dto.max_tokens;
    }

    return payload;
  }

  private normalizeNonStreamResponse<T extends {
    choices?: Array<{
      message?: { content?: string };
      delta?: { content?: string };
    }>;
  }>(response: T): T {
    if (!response?.choices?.length) {
      return response;
    }

    const choices = response.choices.map((choice) => {
      if (!choice.delta?.content && choice.message?.content) {
        return {
          ...choice,
          delta: { content: choice.message.content },
        };
      }
      return choice;
    });

    return {
      ...response,
      choices,
    };
  }

  /**
   * 文本对话（流式）
   */
  async textChat(textChatDto: TextChatDto): Promise<AsyncIterable<Chunk> | StepFunNonStreamResponse> {
    const aiConfig = this.configService.get<any>('ai');
    const shouldStream = Boolean(textChatDto.stream);
    const payload = this.buildChatPayload(textChatDto, shouldStream);
    const originalCount = payload.messages.length;
    payload.messages = this.normalizeMessages(payload.messages);
    if (payload.messages.length === 0) {
      throw new BadRequestException('messages不能为空');
    }
    if (payload.messages.length !== originalCount) {
      this.logger.warn(
        `textChat normalized messages: ${originalCount} -> ${payload.messages.length}`,
      );
    }

    if (aiConfig.useReal) {
      console.log(`Using real AI model: ${payload.model}`);
      if (shouldStream) {
        return this.performRealStreamChat(payload, aiConfig.stepfunApiUrl, aiConfig.apiKey);
      }

      try {
        this.logger.log(`textChat request: model=${payload.model} messages=${payload.messages.length}`);
        this.logger.log(`textChat payload preview: ${this.buildMessagePreview(payload.messages)}`);
        const response = await axios.post(
          aiConfig.stepfunApiUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiConfig.apiKey}`,
              ...(aiConfig.stepfunApiUrl.includes('gateway') ? { 'X-Gateway-Authorization': `Bearer ${aiConfig.apiKey}` } : {}),
            },
          }
        );
        this.logger.log('textChat success');
        return this.normalizeNonStreamResponse(response.data);
      } catch (error) {
        this.logger.error(
          `textChat failed: status=${error.response?.status ?? 'unknown'}`,
          error.response?.data ? JSON.stringify(error.response?.data).slice(0, 800) : error.message,
        );
        throw new InternalServerErrorException('AI 对话服务暂时不可用');
      }
    }

    console.log(`Using banked AI response (model: ${payload.model})`);
    const responseText = this.bankedResponses[Math.floor(Math.random() * this.bankedResponses.length)];
    if (shouldStream) {
      return this.generateMockStream(responseText);
    }

    return this.normalizeNonStreamResponse({
      id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
      object: 'chat.completion',
      created: Date.now(),
      model: 'banked-ai-model',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: responseText },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: responseText.length,
        total_tokens: responseText.length,
      },
    });
  }

  /**
   * 多模态分析
   */
  async multimodalAnalysis(multimodalAnalysisDto: MultimodalAnalysisDto): Promise<any> {
    const aiConfig = this.configService.get<any>('ai');
    const payload = this.buildChatPayload(multimodalAnalysisDto);
    const originalCount = payload.messages.length;
    payload.messages = this.normalizeMessages(payload.messages);
    if (payload.messages.length === 0) {
      throw new BadRequestException('messages不能为空');
    }
    if (payload.messages.length !== originalCount) {
      this.logger.warn(
        `multimodalAnalysis normalized messages: ${originalCount} -> ${payload.messages.length}`,
      );
    }
    if (!multimodalAnalysisDto.model) {
      payload.model = aiConfig.multimodalModel || payload.model;
    }
    const mediaStats = this.summarizeMultimodalMedia(payload.messages);
    if (mediaStats.imageDataUrls > 0) {
      this.logger.warn(
        `multimodalAnalysis using base64 image_url (${mediaStats.imageDataUrls}). Consider hosting files and passing URL for better performance.`,
      );
    }

    if (aiConfig.useReal) {
      console.log(`\n🤖 ========== multimodalAnalysis 开始 ==========`);
      console.log(`📋 模型: ${payload.model}`);
      console.log(`📊 消息数: ${payload.messages.length}`);
      console.log(`📎 媒体: ${JSON.stringify(mediaStats)}`);

      try {
        this.logger.log(
          `multimodalAnalysis request: model=${payload.model} messages=${payload.messages.length} media=${JSON.stringify(mediaStats)}`,
        );
        this.logger.log(`multimodalAnalysis payload preview: ${this.buildMessagePreview(payload.messages)}`);

        // 将本地图片 URL 转换为 base64
        for (const message of payload.messages) {
          if (Array.isArray(message.content)) {
            for (const item of message.content) {
              if (item.type === 'image_url' && typeof item.image_url?.url === 'string') {
                const base64 = await this.convertLocalUrlToBase64(item.image_url.url);
                if (base64) {
                  item.image_url.url = base64;
                  console.log(`🔄 已转换本地图片为 base64`);
                }
              }
            }
          }
        }

        // 将本地视频 URL 上传到 StepFun 存储并替换为 stepfile://
        for (const message of payload.messages) {
          if (!Array.isArray(message.content)) continue;
          for (const item of message.content) {
            if (item.type !== 'video_url' || typeof item.video_url?.url !== 'string') {
              continue;
            }
            const videoUrl = item.video_url.url;
            if (videoUrl.startsWith('stepfile://')) {
              continue;
            }
            if (!this.isLocalUploadUrl(videoUrl)) {
              continue;
            }
            const localPath = this.resolveLocalUploadPath(videoUrl);
            if (!localPath || !fs.existsSync(localPath)) {
              throw new BadRequestException('本地视频文件不存在，请重新上传');
            }
            const ext = path.extname(localPath).toLowerCase();
            if (ext !== '.mp4') {
              throw new BadRequestException('视频格式仅支持 mp4，请上传 mp4 文件');
            }

            const stepFileId = await this.stepFunFilesService.uploadLocalVideo(localPath);
            item.video_url.url = stepFileId;
            this.logger.log(`multimodalAnalysis uploaded video to StepFun: ${path.basename(localPath)} -> ${stepFileId}`);
          }
        }

        console.log(`📡 正在调用 StepFun AI API...`);

        const response = await axios.post(
          aiConfig.multimodalApiUrl || aiConfig.stepfunApiUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiConfig.apiKey}`,
              // 如果是 gateway URL，可能需要使用 X-Gateway-Authorization
              ...((aiConfig.multimodalApiUrl || aiConfig.stepfunApiUrl).includes('gateway') ? { 'X-Gateway-Authorization': `Bearer ${aiConfig.apiKey}` } : {}),
            },
          }
        );

        console.log(`✅ AI API 调用成功!`);
        console.log(`==========================================\n`);

        return this.normalizeNonStreamResponse(response.data);
      } catch (error) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorData = error.response?.data;

        // 确保错误显示在控制台
        console.error('\n❌ ========== multimodalAnalysis 错误 ==========');
        console.error(`状态码: ${status ?? 'unknown'}`);
        console.error(`错误消息: ${errorMessage}`);
        if (errorData) {
          console.error(`错误详情:`, errorData);
        }
        console.error(`完整错误:`, error);
        console.error('==========================================\n');

        if (status === 429) {
          throw new InternalServerErrorException('请求过于频繁，请稍后再试');
        }

        throw new InternalServerErrorException(`AI 分析服务暂时不可用: ${errorMessage}`);
      }
    }

    console.log(`Using banked AI analysis (model: ${multimodalAnalysisDto.model || 'step-3'})`);
    return this.normalizeNonStreamResponse({
      id: `analysis-${Math.random().toString(36).substring(7)}`,
      object: 'chat.completion',
      created: Date.now(),
      model: payload.model || 'banked-ai-model',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: '根据输入的多模态内容（文本/图片/视频/音频），系统分析结果显示目前用户情绪状态平稳，且对疗愈建议有积极反馈。建议继续参与目前的冥想练习。'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    });
  }

  /**
   * 音频情绪分析
   * 使用 step-asr 语音识别 + 文本情绪分析
   */
  async audioEmotionAnalysis(file: Express.Multer.File): Promise<{
    recognizedText: string;
    emotionAnalysis: string;
    duration: number;
  }> {
    const aiConfig = this.configService.get<any>('ai');

    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('音频文件不能为空');
    }

    this.logger.log(`\n🎵 ========== 音频情绪分析 ==========`);
    this.logger.log(`📁 文件名: ${file.originalname}`);
    this.logger.log(`📏 大小: ${(file.buffer.length / 1024).toFixed(2)}KB`);

    try {
      // 步骤 1: 使用 step-asr 进行语音识别
      this.logger.log(`📝 步骤 1: 语音识别...`);
      const transcribeResult = await this.speechRecognition(file, {});
      const recognizedText = transcribeResult.text || transcribeResult.content || '';

      this.logger.log(`✅ 识别文字: ${recognizedText.substring(0, 100)}${recognizedText.length > 100 ? '...' : ''}`);

      // 步骤 2: 使用文本分析情绪
      this.logger.log(`🧠 步骤 2: 情绪分析...`);

      // 确保使用非流式调用
      const analysisResponse = await this.textChat({
        model: 'step-3',
        messages: [
          {
            role: 'system',
            content: `你是灵愈AI心理助手，正在分析用户的语音情绪。

根据用户说话的内容，分析其情绪状态。评估维度：
1. 整体情绪倾向（积极/中性/消极）
2. 是否有焦虑、抑郁、压力等负面情绪的迹象
3. 语速、用词反映的心理状态
4. 给出专业的心理健康评估建议

请用简洁专业的语言总结（100字以内）。如果语音内容有明显特征，可以在分析中提及说话内容。`
          },
          {
            role: 'user',
            content: `用户说："${recognizedText}"\n\n请分析用户说话时的情绪状态和心理特征。`
          }
        ],
        stream: false, // 确保非流式
      });

      // 处理非流式响应
      let emotionAnalysis = '语音情绪分析完成。';
      if (analysisResponse && typeof analysisResponse === 'object') {
        if ('choices' in analysisResponse && Array.isArray(analysisResponse.choices)) {
          emotionAnalysis = analysisResponse.choices[0]?.message?.content ||
                          analysisResponse.choices[0]?.delta?.content ||
                          '语音情绪分析完成。';
        }
      }

      this.logger.log(`✅ 情绪分析完成`);
      this.logger.log(`==========================================\n`);

      return {
        recognizedText,
        emotionAnalysis,
        duration: file.buffer.length / 32000, // 粗略估算：假设 32kHz 采样率，2 字节/样本
      };
    } catch (error) {
      this.logger.error(`❌ 音频情绪分析失败: ${error.message}`);
      throw new InternalServerErrorException(`音频情绪分析失败: ${error.message}`);
    }
  }

  /**
   * 语音识别（模拟）
   */
  async speechRecognition(
    file: Express.Multer.File,
    options: SpeechRecognitionUploadDto,
  ): Promise<any> {
    const aiConfig = this.configService.get<any>('ai');

    if (aiConfig.useReal) {
      if (!file || !file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('音频文件不能为空');
      }

      const startedAt = Date.now();
      const baseUrl = this.getStepfunBaseUrl(aiConfig.stepfunApiUrl);
      const url = `${baseUrl}/audio/transcriptions`;
      const format = options?.format || this.inferAudioFormat(file) || 'wav';
      const language = options?.language || 'zh';

      this.logger.log(
        `speechRecognition start: format=${format} language=${language} bytes=${file.buffer.length}`,
      );

      const form = new FormData();
      form.append('model', 'step-asr');
      form.append('response_format', 'json');
      if (language) {
        form.append('language', language);
      }
      form.append('file', file.buffer, {
        filename: file.originalname || `audio.${format}`,
        contentType: file.mimetype || `audio/${format}`,
      });

      try {
        this.logger.log(`speechRecognition request: url=${url} model=step-asr`);
        const response = await axios.post(url, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${aiConfig.apiKey}`,
            ...(url.includes('gateway') ? { 'X-Gateway-Authorization': `Bearer ${aiConfig.apiKey}` } : {}),
          },
        });
        this.logger.log(`speechRecognition success: durationMs=${Date.now() - startedAt}`);
        return response.data;
      } catch (error) {
        this.logger.error(
          `speechRecognition failed: durationMs=${Date.now() - startedAt} status=${error.response?.status ?? 'unknown'}`,
          error.response?.data ? JSON.stringify(error.response?.data).slice(0, 500) : error.message,
        );
        throw new InternalServerErrorException('语音识别服务暂时不可用');
      }
    }

    this.logger.log('speechRecognition mock: AI_USE_REAL=false');
    return {
      text: '这是一个模拟的语音识别结果，显示用户正在分享近期的生活状态。',
      confidence: 0.98,
    };
  }

  /**
   * RAG 检索（模拟）
   */
  async ragRetrieval(ragRetrievalDto: RagRetrievalDto): Promise<any> {
    const aiConfig = this.configService.get<any>('ai');
    const history = Array.isArray(ragRetrievalDto.conversation_history)
      ? ragRetrievalDto.conversation_history.map((item) => ({
          role: item.role,
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        }))
      : [];

    const systemPrompt = [
      '你是灵愈AI心理助手，正在进行心理评估对话。',
      `评估量表：${ragRetrievalDto.assessment_type || 'PHQ-9'}`,
      '请结合对话历史给出温和、专业、简洁的回复。',
      '回复不超过150字。',
    ].join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: ragRetrievalDto.query },
    ];

    if (aiConfig.useReal) {
      const payload: TextChatDto = {
        model: 'step-3',
        messages,
        stream: false,
      };

      try {
        const response = await axios.post(
          aiConfig.stepfunApiUrl,
          this.buildChatPayload(payload),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiConfig.apiKey}`,
              ...(aiConfig.stepfunApiUrl.includes('gateway') ? { 'X-Gateway-Authorization': `Bearer ${aiConfig.apiKey}` } : {}),
            },
          }
        );
        return this.normalizeNonStreamResponse(response.data);
      } catch (error) {
        console.error('RAG Retrieval Error:', error.response?.data || error.message);
        throw new InternalServerErrorException('RAG 检索服务暂时不可用');
      }
    }

    const relevantInfo = [
      '心理健康对于整体健康至关重要。',
      '长期的压力可能会导致焦虑和抑郁，应当及时通过运动或咨询缓解。',
    ];
    const content = relevantInfo.map((item, index) => `${index + 1}. ${item}`).join('\n');

    return {
      choices: [{
        delta: { content },
      }],
      relevant_info: relevantInfo,
      source: 'Internal Knowledge Bank',
    };
  }

  /**
   * 多模态融合（模拟）
   */
  async multimodalFusion(multimodalFusionDto: MultimodalFusionDto): Promise<any> {
    return {
      integrated_report: '综合文字、语音和图像分析，用户的整体心理健康风险评级为“低”。',
      risk_score: 15,
      recommendation: '建议进行定期的放松练习。',
    };
  }

  /**
   * 执行真实的流式对话
   */
  private async *performRealStreamChat(
    payload: StepfunChatPayload,
    url: string,
    apiKey: string,
  ): AsyncIterable<Chunk> {
    try {
      const response = await axios.post(
        url,
        { ...payload, stream: true },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(url.includes('gateway') ? { 'X-Gateway-Authorization': `Bearer ${apiKey}` } : {}),
          },
          responseType: 'stream',
        }
      );

      const stream = response.data;

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              yield JSON.parse(data);
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Real AI Stream Error:', error.message);
      yield {
        choices: [{
          delta: { content: '抱歉，AI 服务暂时异常，请稍后再试。' },
          finish_reason: 'error'
        }]
      };
    }
  }

  /**
   * 生成模拟流式响应
   */
  private async *generateMockStream(text: string): AsyncIterable<Chunk> {
    const words = text.split('');
    const id = `chatcmpl-${Math.random().toString(36).substring(7)}`;

    for (let i = 0; i < words.length; i++) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 50));

      yield {
        id,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'banked-ai-model',
        choices: [{
          index: 0,
          delta: { content: words[i] },
          finish_reason: i === words.length - 1 ? 'stop' : null
        }]
      };
    }
  }

  private getStepfunBaseUrl(url: string): string {
    if (!url) {
      return 'https://api.stepfun.com/v1';
    }
    const normalized = url.replace(/\/+$/, '');
    return normalized.replace(/\/chat\/completions$/, '');
  }

  private inferAudioFormat(file: Express.Multer.File): 'wav' | 'm4a' | undefined {
    if (!file) return undefined;
    const name = file.originalname || '';
    if (name.endsWith('.m4a')) return 'm4a';
    if (name.endsWith('.wav')) return 'wav';
    if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/m4a') return 'm4a';
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/wave') return 'wav';
    return undefined;
  }

  private normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages
      .map((message) => {
        if (Array.isArray(message.content)) {
          const filtered = message.content
            .map((item) => {
              if (!item || !item.type) return null;
              switch (item.type) {
                case 'text':
                  if (typeof item.text === 'string' && item.text.trim()) {
                    return item;
                  }
                  return null;
                case 'image_url':
                  return item.image_url?.url ? item : null;
                case 'video_url':
                  return item.video_url?.url ? item : null;
                case 'input_audio':
                  return item.input_audio?.data ? item : null;
                default:
                  return null;
              }
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item));
          return {
            role: message.role,
            content: filtered,
          };
        }
        const content =
          typeof message.content === 'string'
            ? message.content
            : message.content == null
              ? ''
              : JSON.stringify(message.content);
        return {
          role: message.role,
          content,
        };
      })
      .filter((message) => {
        if (Array.isArray(message.content)) {
          return message.content.length > 0;
        }
        return message.content.trim().length > 0;
      });
  }

  private buildMessagePreview(messages: ChatMessage[]): string {
    const preview = messages.slice(0, 5).map((message) => {
      if (Array.isArray(message.content)) {
        return {
          role: message.role,
          contentType: 'array',
          items: message.content.map((item) => item.type),
        };
      }
      return {
        role: message.role,
        contentType: 'string',
        length: message.content.length,
      };
    });
    return JSON.stringify(preview);
  }

  private summarizeMultimodalMedia(messages: ChatMessage[]): {
    image: number;
    imageDataUrls: number;
    video: number;
    audio: number;
  } {
    const summary = {
      image: 0,
      imageDataUrls: 0,
      video: 0,
      audio: 0,
    };
    for (const message of messages) {
      if (!Array.isArray(message.content)) {
        continue;
      }
      for (const item of message.content) {
        if (!item) continue;
        if (item.type === 'image_url') {
          summary.image += 1;
          if (typeof item.image_url?.url === 'string' && item.image_url.url.startsWith('data:')) {
            summary.imageDataUrls += 1;
          }
        } else if (item.type === 'video_url') {
          summary.video += 1;
        } else if (item.type === 'input_audio') {
          summary.audio += 1;
        }
      }
    }
    return summary;
  }

  private isLocalUploadUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
      return isLocalHost && parsed.pathname.startsWith('/uploads/');
    } catch {
      return url.startsWith('/uploads/');
    }
  }

  private resolveLocalUploadPath(url: string): string | null {
    try {
      const parsed = new URL(url, 'http://localhost');
      if (!parsed.pathname.startsWith('/uploads/')) {
        return null;
      }
      const filename = path.basename(parsed.pathname);
      return path.resolve(process.cwd(), 'uploads', filename);
    } catch {
      return null;
    }
  }

  /**
   * 将本地文件 URL 转换为 base64
   * 用于 AI API 无法访问本地 URL 的情况
   */
  private async convertLocalUrlToBase64(url: string): Promise<string | null> {
    try {
      // 检查是否是本地 URL
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        return url; // 非本地 URL，直接返回
      }

      // 提取文件名
      const urlObj = new URL(url);
      const filename = path.basename(urlObj.pathname);

      // 构建本地文件路径
      const filePath = path.join(process.cwd(), 'uploads', filename);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ 文件不存在: ${filePath}`);
        return null;
      }

      // 读取文件并转换为 base64
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      let mimeType = 'image/jpeg';

      switch (ext) {
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.jpg':
        case '.jpeg':
        default:
          mimeType = 'image/jpeg';
          break;
      }

      return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
      console.error(`❌ 转换 URL to base64 失败: ${error.message}`);
      return null;
    }
  }
}

/**
 * 流式响应块接口
 */
export interface Chunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
}

interface StepfunChatPayload {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface StepFunNonStreamResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
