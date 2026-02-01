import { FileValidator, BadRequestException } from "@nestjs/common";
import { extname } from "path";

/**
 * 自定义文件扩展名验证器
 * 检查文件扩展名是否符合要求
 */
export class FileExtensionValidator extends FileValidator<{
  allowedExtensions: string[];
}> {
  constructor(private readonly allowedExtensions: string[]) {
    super({ allowedExtensions });
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    if (!file) {
      return false;
    }

    const fileExt = extname(file.originalname).toLowerCase().replace(".", "");
    return this.allowedExtensions.some((ext) => ext.toLowerCase() === fileExt);
  }

  buildErrorMessage(): string {
    return `不支持的文件格式。支持的格式: ${this.allowedExtensions.join(", ")}`;
  }
}
