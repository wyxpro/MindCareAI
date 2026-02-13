# 语音输入与识别集成教程

本文档介绍随手记/评估页的语音输入两种模式，以及如何为服务端识别配置 INTEGRATIONS_API_KEY。

## 模式说明
- 浏览器本地识别（Web Speech API）
  - 不需要 API Key；需 HTTPS 或 localhost；用户点击触发并授权麦克风；Chrome 支持最佳。
  - 代码位置：RecordPageNew.tsx 的 `handleStartRecording` 中优先使用 `SpeechRecognition`。
- 服务端识别（Supabase Edge Function）
  - 需要服务端密钥 `INTEGRATIONS_API_KEY`，由函数通过 `Deno.env.get('INTEGRATIONS_API_KEY')` 读取。
  - 代码位置：
    - 调用端：`src/db/api.ts` 的 `speechRecognition`
    - 边缘函数：`supabase/functions/speech-recognition/index.ts`

## 获取 INTEGRATIONS_API_KEY
项目默认通过“AI 网关/语音识别服务”进行服务器端识别。你可以选择下列来源之一：

1) 使用团队的 AI 网关（推荐）
- 在网关控制台创建应用/项目，生成专用密钥；复制该密钥作为 `INTEGRATIONS_API_KEY`。
- 若由管理员统一发放，请向管理员索取密钥。

2) 使用第三方语音识别（例如百度语音识别）
- 注册百度智能云并开通“语音识别”服务；在控制台创建应用，获取 `API Key`/`Secret Key`。
- 将 `API Key` 作为 `INTEGRATIONS_API_KEY`（如果你的网关直接代理百度服务，可以在网关侧配置百度的密钥）。
- 注意：当前函数默认使用 16kHz WAV 音频（`rate=16000`），请确保服务端支持该采样率。

## 在 Supabase 中配置密钥
你可以通过 CLI 或控制台设置 Edge Functions 的环境变量：

- CLI 方式（需要安装 Supabase CLI 并登录）：
  ```bash
  supabase login
  # 将 <project-ref> 替换为你的项目 ref（如 qpaavbtsyedbzgkblfns）
  supabase functions secrets set INTEGRATIONS_API_KEY="<你的密钥>" --project-ref <project-ref>
  ```

- 控制台方式：
  - 打开 Supabase 项目 → Settings/Function Secrets（或 Edge Functions 的 Secrets 管理页）
  - 新增 `INTEGRATIONS_API_KEY` 并保存

完成密钥配置后，部署/更新函数：
```bash
supabase functions deploy speech-recognition
```

## 前端与接口联调
- 前端调用：`src/db/api.ts` 中 `speechRecognition(audioBase64, 'wav', 16000, len)`
- 失败提示：
  - “语音识别未配置 API Key…” → Supabase 函数缺少 `INTEGRATIONS_API_KEY`
  - “麦克风权限被拒绝…” → 浏览器未授予权限
  - “浏览器语音识别需要在 HTTPS 下使用” → 非 localhost 的 http 环境

## 验证与排查
1) 本地浏览器识别
- 在 `http://localhost:5173/` 打开随手记 → 点击“语音”，浏览器弹出权限请求 → 说话 → 文本应实时出现。

2) 服务端识别
- 在随手记点击“语音”后停止录音，若浏览器不支持或失败，将上传至函数；成功后应追加识别文本。
- 也可直接调用函数测试：
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <anon_key>" \
    -H "apikey: <anon_key>" \
    -d '{"audioBase64":"data:audio/wav;base64,<...>","format":"wav","rate":16000}' \
    https://<project-ref>.supabase.co/functions/v1/speech-recognition
  ```

3) 常见问题
- 403/401：检查 `Authorization/apikey` 头是否为 Supabase anon key；在生产前端已自动注入。
- 500 且提示“API密钥未配置”：按本文档设置 `INTEGRATIONS_API_KEY`。
- `NotAllowedError`：用户拒绝麦克风权限；让用户在浏览器地址栏重新允许。
- iOS Safari 不稳定：优先使用“录音+服务端识别”路径。

## 安全建议
- `INTEGRATIONS_API_KEY` 仅在服务端（Edge Functions）保存与使用；不要在前端暴露或打包进代码。
- 若使用第三方厂商的密钥，建议通过自有网关代理，避免直接暴露供应商接口。

## 相关代码参考
- 前端页面：
  - 随手记语音按钮与流程：[RecordPageNew.tsx](file:///e:/Code/AI/Start/Web/Doctor%20AI/MindCareAI/src/pages/RecordPageNew.tsx#L193-L283)
  - 评估页语音输入（另一处实现）：[ScaleStep.tsx](file:///e:/Code/AI/Start/Web/Doctor%20AI/MindCareAI/src/components/assessment/ScaleStep.tsx#L64-L137)
- API 封装（错误分类与调用）：[api.ts](file:///e:/Code/AI/Start/Web/Doctor%20AI/MindCareAI/src/db/api.ts#L566-L580)
- Supabase 边缘函数：`speech-recognition` 的输入/输出与错误处理
  - [index.ts](file:///e:/Code/AI/Start/Web/Doctor%20AI/MindCareAI/supabase/functions/speech-recognition/index.ts)

