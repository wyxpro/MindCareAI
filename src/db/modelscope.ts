import ky from 'ky';

export interface ModelScopeMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export interface ModelScopeResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function modelScopeChat(payload: { model: string; messages: ModelScopeMessage[] }) {
  try {
    const body = {
      model: payload.model,
      messages: payload.messages,
      stream: false,
      temperature: 0.2,
      max_tokens: 128
    };
    const res = await ky.post('/innerapi/v1/modelscope/chat/completions', {
      json: body,
      timeout: 30000,
      throwHttpErrors: false
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json<any>() : await res.text();

    if (!res.ok) {
      const rawMsg = isJson ? (data?.error || data?.message || data) : data;
      const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
      const code = isJson ? (data?.code || '') : '';
      if (res.status === 400 && typeof code === 'string' && code === '-20081') {
        const smallRes = await ky.post('/innerapi/v1/modelscope/chat/completions', {
          json: { ...body, max_tokens: 64, temperature: 0 },
          timeout: 30000,
          throwHttpErrors: false
        });
        const ct = smallRes.headers.get('content-type') || '';
        const smallIsJson = ct.includes('application/json');
        const smallData = smallIsJson ? await smallRes.json<any>() : await smallRes.text();
        if (!smallRes.ok) {
          const smallMsg = smallIsJson ? (smallData?.error || smallData?.message || JSON.stringify(smallData)) : String(smallData);
          throw new Error(`ModelScope error ${smallRes.status}: ${smallMsg}`);
        }
        const text2 = smallData?.choices?.[0]?.message?.content || '';
        return { raw: smallData, text: text2 };
      }
      throw new Error(`ModelScope error ${res.status}: ${msg}`);
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return { raw: data, text };
  } catch (err: any) {
    throw new Error(String(err?.message || err));
  }
}

export async function modelScopeVisionChat(payload: { model: string; text: string; image_url: string }) {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const body = {
        model: payload.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: payload.text },
              { type: 'image_url', image_url: { url: payload.image_url } },
            ],
          },
        ],
        stream: false,
        temperature: 0,
        max_tokens: 256,
      };
      
      const res = await ky.post('/innerapi/v1/modelscope/chat/completions', {
        json: body,
        timeout: 90000, // 增加到90秒
        throwHttpErrors: false,
        retry: {
          limit: 0, // 我们自己控制重试
        }
      });
      
      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const data = isJson ? await res.json<any>() : await res.text();
      
      if (!res.ok) {
        const msg = isJson ? (data?.error || data?.message || JSON.stringify(data)) : String(data);
        throw new Error(`ModelScope error ${res.status}: ${msg}`);
      }
      
      const text = data?.choices?.[0]?.message?.content || '';
      return { raw: data, text };
      
    } catch (err: any) {
      lastError = err;
      console.warn(`Vision chat attempt ${attempt + 1} failed:`, err.message);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  // 所有重试都失败
  throw new Error(`Request timed out after ${maxRetries + 1} attempts: ${lastError?.message || lastError}`);
}
