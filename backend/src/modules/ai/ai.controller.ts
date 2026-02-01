import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { diskStorage, memoryStorage } from "multer";
import { extname } from "path";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from "@nestjs/swagger";
import { AiService, Chunk, StepFunNonStreamResponse } from "./ai.service";
import { StepFunFilesService } from "./stepfun-files.service";
import {
  TextChatDto,
  MultimodalAnalysisDto,
  SpeechRecognitionUploadDto,
  RagRetrievalDto,
  MultimodalFusionDto,
} from "./dto";
import { Public } from "../../common/decorators/public.decorator";
import { FileExtensionValidator } from "../../common/validators/file-extension.validator";

/**
 * AI 服务控制器
 * 处理所有 AI 相关的请求
 * 速率限制: 每分钟最多 20 次 AI 请求
 */
@ApiTags("ai")
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Controller("ai")
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly stepFunFilesService: StepFunFilesService,
  ) {}

  /**
   * 文本对话（流式）
   * 公开接口，实际使用中应该添加认证
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post("text-chat")
  @ApiOperation({
    summary: "文本对话（流式）",
    description: "发送文本消息，返回 AI 响应。支持流式和非流式两种模式。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "成功返回 AI 响应" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "AI 服务暂时不可用" })
  async textChat(
    @Body() textChatDto: TextChatDto,
  ): Promise<AsyncIterable<Chunk> | StepFunNonStreamResponse> {
    return this.aiService.textChat(textChatDto);
  }

  /**
   * 多模态分析
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post("multimodal-analysis")
  @ApiOperation({
    summary: "多模态分析（支持文本和图片）",
    description: "分析文本、图片等输入内容，返回 AI 分析结果。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "成功返回分析结果" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "AI 服务暂时不可用" })
  async multimodalAnalysis(
    @Body() multimodalAnalysisDto: MultimodalAnalysisDto,
  ) {
    return this.aiService.multimodalAnalysis(multimodalAnalysisDto);
  }

  /**
   * 语音识别
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post("speech-recognition")
  @ApiOperation({
    summary: "语音识别",
    description:
      "上传音频文件，返回识别的文本内容。支持 wav/m4a 格式，最大 10MB。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "成功返回识别结果" })
  @ApiResponse({ status: 400, description: "文件验证失败或参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "语音识别服务暂时不可用" })
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async speechRecognition(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /(wav|m4a|audio\/wav|audio\/m4a|audio\/mp4|audio\/x-m4a)$/i,
          }),
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
   * 音频情绪分析
   * 使用语音识别 + 文本情绪分析
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post("audio-emotion-analysis")
  @ApiOperation({
    summary: "音频情绪分析",
    description:
      "上传音频文件，返回语音识别结果和情绪分析。支持 wav/m4a/webm/mp3 格式，最大 10MB。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "成功返回识别结果和情绪分析" })
  @ApiResponse({ status: 400, description: "文件验证失败或参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "音频分析服务暂时不可用" })
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async audioEmotionAnalysis(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /(wav|m4a|webm|mp3|audio\/wav|audio\/m4a|audio\/mp4|audio\/x-m4a|audio\/webm|audio\/mpeg)$/i,
          }),
        ],
        fileIsRequired: true,
        exceptionFactory: (error: any) => {
          throw new BadRequestException(`文件验证失败: ${error.message}`);
        },
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.aiService.audioEmotionAnalysis(file);
  }

  /**
   * RAG 检索
   */
  @Public() // 暂时公开，后续可以添加认证
  @Post("rag-retrieval")
  @ApiOperation({
    summary: "RAG 检索",
    description: "基于知识库的检索增强生成，结合对话历史提供专业回复。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "成功返回检索结果" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "RAG 服务暂时不可用" })
  async ragRetrieval(@Body() ragRetrievalDto: RagRetrievalDto) {
    return this.aiService.ragRetrieval(ragRetrievalDto);
  }

  /**
   * 多模态融合
   */
  @Public()
  @Post("multimodal-fusion")
  @ApiOperation({
    summary: "多模态融合分析",
    description: "融合文本、语音、图片等多种模态数据，生成综合评估报告。",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "成功返回融合分析结果" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "融合服务暂时不可用" })
  async multimodalFusion(@Body() multimodalFusionDto: MultimodalFusionDto) {
    return this.aiService.multimodalFusion(multimodalFusionDto);
  }

  /**
   * 文件上传
   */
  @Public()
  @Post("upload")
  @ApiOperation({
    summary: "文件上传",
    description:
      "上传图片、音频、视频文件。支持 jpg/png/gif/webp/mp3/wav/m4a/mp4/webm 格式，最大 20MB。",
  })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "文件上传成功，返回文件访问 URL" })
  @ApiResponse({ status: 400, description: "文件验证失败" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileExtensionValidator([
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "mp3",
            "mp4",
            "wav",
            "m4a",
            "webm",
          ]),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const fileType = file.mimetype.split("/")[0] || "file";
    const emoji =
      fileType === "image"
        ? "📷"
        : fileType === "video"
          ? "🎬"
          : fileType === "audio"
            ? "🎵"
            : "📄";

    this.logger.log(`========== 文件上传 ==========`);
    this.logger.log(`📁 文件名: ${file.originalname}`);
    this.logger.log(
      `📏 文件大小: ${fileSizeMB}MB (${file.size.toLocaleString()} 字节)`,
    );
    this.logger.log(`🎯 MIME 类型: ${file.mimetype}`);
    this.logger.log(`💾 保存路径: ./uploads/${file.filename}`);

    const protocol = req.protocol;
    const host = req.get("host");
    const publicUrl = `${protocol}://${host}/uploads/${file.filename}`;

    this.logger.log(`✅ 上传成功! URL: ${publicUrl}`);
    console.log(`====================================\n`);

    return {
      url: publicUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * 上传视频到 StepFun 存储
   * 用于视频理解功能，避免重复下载和流量消耗
   * 参考: https://platform.stepfun.com/docs/guide/video_chat
   */
  @Public()
  @Post("upload-to-stepfun")
  @ApiOperation({
    summary: "上传视频到 StepFun 存储",
    description:
      "将视频上传到 StepFun 的文件存储服务，返回 stepfile:// 格式的文件 ID。" +
      "视频将被存储在 StepFun 服务器上，避免重复下载，提升 AI 视频理解速度。" +
      "支持最大 128MB 的 MP4 视频文件。",
  })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({
    status: 200,
    description: "文件上传成功，返回 stepfile:// 文件 ID",
  })
  @ApiResponse({ status: 400, description: "文件验证失败或文件过大" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async uploadToStepFun(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 128 * 1024 * 1024 }), // 128MB
          new FileExtensionValidator(["mp4"]),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    this.logger.log(`========== StepFun 视频上传 ==========`);
    this.logger.log(`📁 文件名: ${file.originalname}`);
    this.logger.log(
      `📏 文件大小: ${fileSizeMB}MB (${file.size.toLocaleString()} 字节)`,
    );
    this.logger.log(`🎯 MIME 类型: ${file.mimetype}`);

    try {
      const fileId = await this.stepFunFilesService.uploadFile(
        file,
        file.originalname,
        file.mimetype,
      );

      this.logger.log(`🎉 上传完成! 返回 fileId: ${fileId}`);

      return {
        success: true,
        fileId,
        filename: file.originalname,
        size: file.size,
        message: "文件已上传到 StepFun 存储，可用于视频理解",
      };
    } catch (error) {
      this.logger.error(`❌ 上传失败: ${error.message}`);
      throw new BadRequestException(`上传失败: ${error.message}`);
    }
  }

  /**
   * 视频理解分析
   * 使用配置的多模态模型进行视频内容分析（默认 step-1o-turbo-vision）
   */
  @Public()
  @Post("video-understanding")
  @ApiOperation({
    summary: "视频理解分析",
    description:
      "使用配置的多模态模型理解视频内容并进行分析。" +
      "需要先通过 /upload-to-stepfun 端点上传视频到 StepFun 存储，" +
      "然后传入 stepfile:// 格式的文件 ID。",
  })
  @ApiResponse({
    status: 200,
    description: "分析成功，返回 AI 对视频内容的理解",
  })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 429, description: "请求过于频繁，请稍后重试" })
  @ApiResponse({ status: 500, description: "AI 服务暂时不可用" })
  async videoUnderstanding(
    @Body()
    body: {
      fileId: string; // stepfile:// 格式的文件 ID
      prompt?: string; // 自定义分析提示词
      questions?: string[]; // 针对视频的问题列表
    },
  ) {
    const { fileId, prompt, questions } = body;

    if (!fileId) {
      throw new BadRequestException("fileId 是必需的");
    }

    // 构建默认提示词
    const defaultPrompt =
      prompt ||
      "请详细分析这个视频中人物的面部表情、情绪状态和行为特征。" +
        "重点关注：1) 主要情绪（如高兴、悲伤、焦虑、平静等）" +
        "2) 情绪强度（低/中/高）" +
        "3) 是否有压力、焦虑或抑郁的微表情特征" +
        "4) 给出专业的心理健康评估建议。";

    // 构建消息内容
    const content = [
      {
        type: "video_url",
        video_url: { url: fileId },
      } as const,
      {
        type: "text",
        text: defaultPrompt,
      } as const,
    ];

    // 添加问题（如果有）
    if (questions && questions.length > 0) {
      content.push({
        type: "text",
        text:
          "\n\n请回答以下问题：\n" +
          questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      } as const);
    }

    return this.aiService.multimodalAnalysis({
      messages: [{ role: "user", content }] as any,
    });
  }
}
