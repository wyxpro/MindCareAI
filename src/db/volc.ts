import ky from 'ky';

export interface VolcContentText { type: 'input_text'; text: string }
export interface VolcContentImage { type: 'input_image'; image_url: string }
export interface VolcMessage { role: 'user' | 'system' | 'assistant'; content: Array<VolcContentText | VolcContentImage> }

export async function volcResponses(payload: { model: string; input: VolcMessage[] }) {
  const resp = await ky.post('/innerapi/v1/volc/responses', {
    json: payload,
    timeout: 30000,
    throwHttpErrors: false
  });

  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await resp.json<any>() : await resp.text();

  if (!resp.ok) {
    const msg = isJson ? (data?.error || JSON.stringify(data)) : String(data);
    throw new Error(`VolcArk error ${resp.status}: ${msg}`);
  }

  const text = isJson
    ? (data?.output_text || data?.choices?.[0]?.delta?.content || data?.choices?.[0]?.message?.content?.[0]?.text || '')
    : String(data);

  return { raw: data, text };
}
