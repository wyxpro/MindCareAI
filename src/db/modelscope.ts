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
