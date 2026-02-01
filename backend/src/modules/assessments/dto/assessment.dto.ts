import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * 评估对话消息 DTO
 */
export class AssessmentMessageDto {
  @ApiProperty({ description: "角色" })
  @IsString()
  role: string;

  @ApiProperty({ description: "内容" })
  @IsString()
  content: string;

  @ApiProperty({ description: "时间戳（ISO字符串）" })
  @IsString()
  timestamp: string;
}

/**
 * 创建评估记录 DTO
 */
export class CreateAssessmentDto {
  @ApiProperty({ description: "评估类型", default: "multimodal" })
  @IsString()
  @IsOptional()
  assessment_type?: string;

  @ApiProperty({ description: "对话历史", default: [] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssessmentMessageDto)
  conversation_history?: AssessmentMessageDto[];

  @ApiProperty({ description: "文本输入", required: false })
  @IsString()
  @IsOptional()
  text_input?: string;

  @ApiProperty({ description: "语音 URL", required: false })
  @IsString()
  @IsOptional()
  voice_input_url?: string;

  @ApiProperty({ description: "图片 URL", required: false })
  @IsString()
  @IsOptional()
  image_input_url?: string;

  @ApiProperty({ description: "视频 URL", required: false })
  @IsString()
  @IsOptional()
  video_input_url?: string;
}

/**
 * 更新评估记录 DTO
 */
export class UpdateAssessmentDto {
  @ApiProperty({ description: "对话历史", required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssessmentMessageDto)
  conversation_history?: AssessmentMessageDto[];

  @ApiProperty({ description: "文本输入", required: false })
  @IsString()
  @IsOptional()
  text_input?: string;

  @ApiProperty({ description: "语音 URL", required: false })
  @IsString()
  @IsOptional()
  voice_input_url?: string;

  @ApiProperty({ description: "图片 URL", required: false })
  @IsString()
  @IsOptional()
  image_input_url?: string;

  @ApiProperty({ description: "视频 URL", required: false })
  @IsString()
  @IsOptional()
  video_input_url?: string;

  @ApiProperty({ description: "AI 分析结果", required: false })
  @IsObject()
  @IsOptional()
  ai_analysis?: Record<string, any>;

  @ApiProperty({ description: "风险等级", required: false })
  @IsNumber()
  @IsOptional()
  risk_level?: number;

  @ApiProperty({ description: "得分", required: false })
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiProperty({ description: "报告", required: false })
  @IsObject()
  @IsOptional()
  report?: Record<string, any>;
}

/**
 * 评估记录响应 DTO
 */
export class AssessmentDto {
  @ApiProperty({ description: "评估 ID" })
  id: string;

  @ApiProperty({ description: "用户 ID" })
  user_id: string;

  @ApiProperty({ description: "评估类型" })
  assessment_type: string;

  @ApiProperty({ description: "对话历史" })
  conversation_history: Record<string, any>[];

  @ApiProperty({ description: "文本输入", required: false })
  text_input?: string;

  @ApiProperty({ description: "语音 URL", required: false })
  voice_input_url?: string;

  @ApiProperty({ description: "图片 URL", required: false })
  image_input_url?: string;

  @ApiProperty({ description: "视频 URL", required: false })
  video_input_url?: string;

  @ApiProperty({ description: "AI 分析结果", required: false })
  ai_analysis?: Record<string, any>;

  @ApiProperty({ description: "风险等级" })
  risk_level: number;

  @ApiProperty({ description: "得分", required: false })
  score?: number;

  @ApiProperty({ description: "报告", required: false })
  report?: Record<string, any>;

  @ApiProperty({ description: "创建时间" })
  created_at: Date;

  @ApiProperty({ description: "更新时间" })
  updated_at: Date;
}
