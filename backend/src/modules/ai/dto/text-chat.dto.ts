import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * 聊天消息内容
 */
export class ChatMessageContent {
  @ApiProperty({
    description: "内容类型",
    enum: ["text", "image_url", "video_url", "input_audio"],
  })
  type: "text" | "image_url" | "video_url" | "input_audio";

  @ApiProperty({ description: "文本内容", required: false })
  text?: string;

  @ApiProperty({ description: "图片 URL 对象", required: false })
  image_url?: { url: string; detail?: "low" | "high" };

  @ApiProperty({ description: "视频 URL 对象", required: false })
  video_url?: { url: string };

  @ApiProperty({ description: "音频输入对象 (base64)", required: false })
  input_audio?: { data: string };
}

/**
 * 聊天消息
 */
export class ChatMessage {
  @ApiProperty({
    description: "角色",
    enum: ["system", "user", "assistant", "tool"],
  })
  role: "system" | "user" | "assistant" | "tool";

  @ApiProperty({
    description: "消息内容",
    oneOf: [
      { type: "string" },
      {
        type: "array",
        items: { $ref: "#/components/schemas/ChatMessageContent" },
      },
    ],
  })
  content: string | ChatMessageContent[];

  @ApiProperty({
    description: "执行函数的ID (仅针对 tool 角色)",
    required: false,
  })
  tool_call_id?: string;
}

/**
 * 文本对话请求 DTO
 */
export class TextChatDto {
  @ApiProperty({ description: "模型名称", default: "step-3", required: false })
  model?: string;

  @ApiProperty({
    description: "消息列表",
    type: [ChatMessage],
  })
  @IsArray()
  @IsNotEmpty({ message: "消息列表不能为空" })
  messages: ChatMessage[];

  @ApiProperty({ description: "是否流式生成", required: false, default: false })
  stream?: boolean;

  @ApiProperty({ description: "采样温度", required: false, default: 0.5 })
  temperature?: number;

  @ApiProperty({ description: "核心采样", required: false, default: 0.9 })
  top_p?: number;

  @ApiProperty({ description: "最大生成 token 数", required: false })
  max_tokens?: number;

  @ApiProperty({
    description: "是否启用思考模式 (StepFun 特有)",
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableThinking?: boolean;
}

/**
 * 多模态分析请求 DTO (通常映射到同一个 Chat Service)
 */
export class MultimodalAnalysisDto extends TextChatDto {}

/**
 * 语音识别上传 DTO（multipart 表单字段）
 */
export class SpeechRecognitionUploadDto {
  @ApiProperty({
    description: "音频格式",
    enum: ["wav", "m4a"],
    required: false,
    default: "wav",
  })
  @IsOptional()
  @IsIn(["wav", "m4a"])
  format?: "wav" | "m4a";

  @ApiProperty({
    description: "语言",
    required: false,
    default: "zh",
  })
  @IsOptional()
  @IsString()
  language?: string;
}

/**
 * RAG 检索请求 DTO
 */
export class RagRetrievalDto {
  @ApiProperty({ description: "查询文本" })
  @IsNotEmpty({ message: "查询文本不能为空" })
  query: string;

  @ApiProperty({
    description: "对话历史",
    required: false,
    type: [ChatMessage],
  })
  @IsArray()
  @IsOptional()
  conversation_history?: ChatMessage[];

  @ApiProperty({ description: "评估类型", required: false, default: "PHQ-9" })
  @IsString()
  @IsOptional()
  assessment_type?: string;

  @ApiProperty({
    description: "返回结果数量",
    required: false,
    default: 5,
  })
  topK?: number;
}

/**
 * 多模态融合请求 DTO
 */
export class MultimodalFusionDto {
  @ApiProperty({ description: "文本输入", required: false })
  @IsOptional()
  @IsString()
  textInput?: string;

  @ApiProperty({ description: "语音 URL", required: false })
  @IsOptional()
  @IsString()
  voiceUrl?: string;

  @ApiProperty({ description: "图片 URL", required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: "视频 URL", required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({
    description: "是否启用 AI 分析",
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableAI?: boolean = true;
}
