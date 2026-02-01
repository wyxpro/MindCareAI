import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import {
  TextChatDto,
  MultimodalAnalysisDto,
  SpeechRecognitionUploadDto,
  RagRetrievalDto,
  MultimodalFusionDto,
  ChatMessage,
} from './dto';

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

  constructor(private readonly configService: ConfigService) { }
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
      console.log(`Using real AI analysis (model: ${payload.model})`);
      try {
        this.logger.log(
          `multimodalAnalysis request: model=${payload.model} messages=${payload.messages.length} media=${JSON.stringify(mediaStats)}`,
        );
        this.logger.log(`multimodalAnalysis payload preview: ${this.buildMessagePreview(payload.messages)}`);
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
        return this.normalizeNonStreamResponse(response.data);
      } catch (error) {
        this.logger.error(
          `multimodalAnalysis failed: status=${error.response?.status ?? 'unknown'}`,
          error.response?.data ? JSON.stringify(error.response?.data).slice(0, 800) : error.message,
        );
        throw new InternalServerErrorException('AI 分析服务暂时不可用');
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
