import { Controller, Post, Body, Headers, Sse, MessageEvent, UseInterceptors, UploadedFile, Request, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AiService, Chunk, StepFunNonStreamResponse } from './ai.service';
import {
  TextChatDto,
  MultimodalAnalysisDto,
  SpeechRecognitionUploadDto,
  RagRetrievalDto,
  MultimodalFusionDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * AI 服务控制器
 * 处理所有 AI 相关的请求
 * 速率限制: 每分钟最多 20 次 AI 请求
 */
@ApiTags('ai')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  /**
   * 文本对话（流式）
   * 公开接口，实际使用中应该添加认证
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('text-chat')
  @ApiOperation({ summary: '文本对话（流式）', description: '发送文本消息，返回 AI 响应。支持流式和非流式两种模式。' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '成功返回 AI 响应' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @ApiResponse({ status: 500, description: 'AI 服务暂时不可用' })
  async textChat(@Body() textChatDto: TextChatDto): Promise<AsyncIterable<Chunk> | StepFunNonStreamResponse> {
    return this.aiService.textChat(textChatDto);
  }

  /**
   * 多模态分析
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('multimodal-analysis')
  @ApiOperation({ summary: '多模态分析（支持文本和图片）', description: '分析文本、图片等输入内容，返回 AI 分析结果。' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '成功返回分析结果' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @ApiResponse({ status: 500, description: 'AI 服务暂时不可用' })
  async multimodalAnalysis(@Body() multimodalAnalysisDto: MultimodalAnalysisDto) {
    return this.aiService.multimodalAnalysis(multimodalAnalysisDto);
  }

  /**
   * 语音识别
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('speech-recognition')
  @ApiOperation({ summary: '语音识别', description: '上传音频文件，返回识别的文本内容。支持 wav/m4a 格式，最大 10MB。' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '成功返回识别结果' })
  @ApiResponse({ status: 400, description: '文件验证失败或参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @ApiResponse({ status: 500, description: '语音识别服务暂时不可用' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async speechRecognition(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(wav|m4a|audio\/wav|audio\/m4a|audio\/mp4|audio\/x-m4a)$/i }),
        ],
        fileIsRequired: true,
        exceptionFactory: (error: any) => {
          throw new BadRequestException(`文件验证失败: ${error.message}`);
        },
      }),
    )
    file: Express.Multer.File,
    @Body() body: SpeechRecognitionUploadDto,
  ) {
    return this.aiService.speechRecognition(file, body);
  }

  /**
   * RAG 检索
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('rag-retrieval')
  @ApiOperation({ summary: 'RAG 检索', description: '基于知识库的检索增强生成，结合对话历史提供专业回复。' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '成功返回检索结果' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @ApiResponse({ status: 500, description: 'RAG 服务暂时不可用' })
  async ragRetrieval(@Body() ragRetrievalDto: RagRetrievalDto) {
    return this.aiService.ragRetrieval(ragRetrievalDto);
  }

  /**
   * 多模态融合
   */
  @Public()
  @Post('multimodal-fusion')
  @ApiOperation({ summary: '多模态融合分析', description: '融合文本、语音、图片等多种模态数据，生成综合评估报告。' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '成功返回融合分析结果' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @ApiResponse({ status: 500, description: '融合服务暂时不可用' })
  async multimodalFusion(@Body() multimodalFusionDto: MultimodalFusionDto) {
    return this.aiService.multimodalFusion(multimodalFusionDto);
  }

  /**
   * 文件上传
   */
  @Public()
  @Post('upload')
  @ApiOperation({ summary: '文件上传', description: '上传图片、音频、视频文件。支持 jpg/png/gif/webp/mp3/wav/m4a/mp4/webm 格式，最大 20MB。' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '文件上传成功，返回文件访问 URL' })
  @ApiResponse({ status: 400, description: '文件验证失败' })
  @ApiResponse({ status: 429, description: '请求过于频繁，请稍后重试' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|mp3|mp4|wav|m4a|webm)$/i }),
        ],
        fileIsRequired: true,
        exceptionFactory: (error: any) => {
          throw new BadRequestException(`文件验证失败: ${error.message}，支持图片（jpg/png/gif/webp）、音频（mp3/wav/m4a）、视频（mp4/webm），最大20MB`);
        },
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/${file.filename}`;
    return {
      url: publicUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
