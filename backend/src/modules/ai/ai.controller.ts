import { Controller, Post, Body, Headers, Sse, MessageEvent, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
 */
@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  /**
   * 文本对话（流式）
   * 公开接口，实际使用中应该添加认证
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('text-chat')
  @ApiOperation({ summary: '文本对话（流式）' })
  @ApiBearerAuth('JWT-auth')
  async textChat(@Body() textChatDto: TextChatDto): Promise<AsyncIterable<Chunk> | StepFunNonStreamResponse> {
    return this.aiService.textChat(textChatDto);
  }

  /**
   * 多模态分析
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('multimodal-analysis')
  @ApiOperation({ summary: '多模态分析（支持文本和图片）' })
  @ApiBearerAuth('JWT-auth')
  async multimodalAnalysis(@Body() multimodalAnalysisDto: MultimodalAnalysisDto) {
    return this.aiService.multimodalAnalysis(multimodalAnalysisDto);
  }

  /**
   * 语音识别
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('speech-recognition')
  @ApiOperation({ summary: '语音识别' })
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async speechRecognition(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SpeechRecognitionUploadDto,
  ) {
    return this.aiService.speechRecognition(file, body);
  }

  /**
   * RAG 检索
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post('rag-retrieval')
  @ApiOperation({ summary: 'RAG 检索' })
  @ApiBearerAuth('JWT-auth')
  async ragRetrieval(@Body() ragRetrievalDto: RagRetrievalDto) {
    return this.aiService.ragRetrieval(ragRetrievalDto);
  }

  /**
   * 多模态融合
   */
  @Public()
  @Post('multimodal-fusion')
  @ApiOperation({ summary: '多模态融合分析' })
  @ApiBearerAuth('JWT-auth')
  async multimodalFusion(@Body() multimodalFusionDto: MultimodalFusionDto) {
    return this.aiService.multimodalFusion(multimodalFusionDto);
  }

  /**
   * 文件上传
   */
  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiOperation({ summary: '文件上传' })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    const protocol = req.protocol;
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/${file.filename}`;
    return {
      url: publicUrl,
      filename: file.filename,
    };
  }
}
