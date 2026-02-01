/**
 * StepFun Files API 工具
 * 将视频上传到 StepFun 存储，避免重复下载和流量消耗
 */

const STEPFUN_API_BASE = 'https://api.stepfun.com/v1';

interface StepFunFileUploadResult {
  id: string;
  object: string;
  created: number;
  filename: string;
  purpose: string;
}

/**
 * 上传文件到 StepFun 存储
 * @param file 文件对象
 * @param apiKey StepFun API Key
 * @returns File ID (可用于 stepfile:// 前缀)
 */
export async function uploadToStepFunStorage(
  file: File,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'storage'); // storage 表示存储用途

  const response = await fetch(`${STEPFUN_API_BASE}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`StepFun 上传失败: ${error.error?.message || 'Unknown error'}`);
  }

  const result: StepFunFileUploadResult = await response.json();

  // 返回 stepfile:// 格式的 ID
  return `stepfile://${result.id}`;
}

/**
 * 批量上传多个文件到 StepFun 存储
 */
export async function uploadMultipleToStepFunStorage(
  files: File[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const fileId = await uploadToStepFunStorage(files[i], apiKey);
    results.push(fileId);
    onProgress?.(i + 1, files.length);
  }

  return results;
}

/**
 * 检查文件是否已上传（通过文件名）
 */
export async function checkFileExists(
  filename: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch(`${STEPFUN_API_BASE}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const existingFile = data.data?.find((f: any) => f.filename === filename);

    return existingFile ? `stepfile://${existingFile.id}` : null;
  } catch {
    return null;
  }
}

/**
 * 删除 StepFun 存储中的文件
 */
export async function deleteFromStepFunStorage(
  fileId: string,
  apiKey: string
): Promise<void> {
  // 移除 stepfile:// 前缀
  const actualId = fileId.replace('stepfile://', '');

  const response = await fetch(`${STEPFUN_API_BASE}/files/${actualId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('删除文件失败');
  }
}
