import { IsOptional, IsInt, Min, IsUUID, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class FindPostsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRecoveryStory?: boolean;
}
