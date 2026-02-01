import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
} from "class-validator";

/**
 * 情绪等级枚举
 */
export enum EmotionLevel {
  VERY_BAD = "very_bad",
  BAD = "bad",
  NEUTRAL = "neutral",
  GOOD = "good",
  VERY_GOOD = "very_good",
}

/**
 * 情绪等级类型
 */
export type EmotionLevelType =
  | "very_bad"
  | "bad"
  | "neutral"
  | "good"
  | "very_good";

/**
 * 创建情绪日记 DTO
 */
export class CreateEmotionDiaryDto {
  @ApiProperty({
    description: "用户 ID (可选，建议从 Token 获取)",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ description: "日记日期", example: "2024-01-15" })
  @IsDateString()
  @IsOptional()
  diary_date?: string;

  @ApiProperty({
    description: "情绪等级",
    enum: EmotionLevel,
    example: EmotionLevel.GOOD,
  })
  @IsEnum(EmotionLevel)
  emotion_level: EmotionLevelType;

  @ApiProperty({ description: "标题", required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: "内容", required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: "标签", required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: "图片 URL 列表",
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];
}

/**
 * 更新情绪日记 DTO
 */
export class UpdateEmotionDiaryDto {
  @ApiProperty({ description: "情绪等级", enum: EmotionLevel, required: false })
  @IsEnum(EmotionLevel)
  @IsOptional()
  emotion_level?: EmotionLevelType;

  @ApiProperty({ description: "标题", required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: "内容", required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: "标签", required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: "图片 URL 列表",
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];

  @ApiProperty({ description: "AI 分析结果", required: false })
  @IsOptional()
  ai_analysis?: Record<string, any>;
}

/**
 * 情绪日记响应 DTO
 */
export class EmotionDiaryDto {
  @ApiProperty({ description: "日记 ID" })
  id: string;

  @ApiProperty({ description: "用户 ID" })
  user_id: string;

  @ApiProperty({ description: "日记日期" })
  diary_date: string;

  @ApiProperty({ description: "情绪等级", enum: EmotionLevel })
  emotion_level: EmotionLevelType;

  @ApiProperty({ description: "标题", required: false })
  title?: string;

  @ApiProperty({ description: "内容", required: false })
  content?: string;

  @ApiProperty({ description: "标签", required: false, type: [String] })
  tags?: string[];

  @ApiProperty({
    description: "图片 URL 列表",
    required: false,
    type: [String],
  })
  image_urls?: string[];

  @ApiProperty({ description: "AI 分析结果", required: false })
  ai_analysis?: Record<string, any>;

  @ApiProperty({ description: "创建时间" })
  created_at: Date;

  @ApiProperty({ description: "更新时间" })
  updated_at: Date;
}
