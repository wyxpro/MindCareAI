import ky from 'ky';

export interface SiliconFlowTranscriptionResponse {
  text: string;
  // x-siliconcloud-trace-id header is available in response
}

export async function transcribeAudio(audioFile: File | Blob, model: 'TeleAI/TeleSpeechASR' | 'FunAudioLLM/SenseVoiceSmall' = 'TeleAI/TeleSpeechASR'): Promise<SiliconFlowTranscriptionResponse> {
  const formData = new FormData();
  const file = (audioFile instanceof File) ? audioFile : new File([audioFile], 'audio.wav', { type: (audioFile as any)?.type || 'audio/wav' });
  formData.append('file', file, file.name);
  formData.append('model', model);

  try {
    const resp = await ky.post('/innerapi/v1/siliconflow/audio/transcriptions', {
      body: formData,
      timeout: 60000,
      throwHttpErrors: false
    });

    const ct = resp.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await resp.json<any>() : await resp.text();

    if (!resp.ok) {
      throw new Error(`SiliconFlow ASR error ${resp.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    }

    const text = (data as any)?.text || (typeof data === 'string' ? data : '');
    return { text } as SiliconFlowTranscriptionResponse;
  } catch (err: any) {
    throw new Error(String(err?.message || err));
  }
}
