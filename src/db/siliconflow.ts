import ky from 'ky';

export interface SiliconFlowTranscriptionResponse {
  text: string;
  // x-siliconcloud-trace-id header is available in response
}

export async function transcribeAudio(audioFile: File | Blob): Promise<SiliconFlowTranscriptionResponse> {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'FunAudioLLM/SenseVoiceSmall');

  try {
    const resp = await ky.post('/innerapi/v1/siliconflow/audio/transcriptions', {
      body: formData,
      timeout: 60000,
      throwHttpErrors: false
    });

    const data = await resp.json<any>();

    if (!resp.ok) {
      throw new Error(`SiliconFlow ASR error ${resp.status}: ${JSON.stringify(data)}`);
    }

    return data as SiliconFlowTranscriptionResponse;
  } catch (err: any) {
    throw new Error(String(err?.message || err));
  }
}
