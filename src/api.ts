import AnthropicAI from "@anthropic-ai/sdk";
import { OpenAI } from "openai";

// TODO: Proxy
export async function runAnthropicAI(options: {
  system: string,
  messages: AnthropicAI.Messages.MessageParam[],
  model: string,
  apiKey: string,
  onUpdate: (text: string, delta: string) => void,
}) {

  const baseURL = `${location.protocol}//${location.host}/anthropic-api/`
  const client = new AnthropicAI({
    apiKey: options.apiKey,
    baseURL: baseURL,
  });

  let result = '';
  // debugger;
  const stream = client.messages.stream({
    system: options.system,
    messages: options.messages as AnthropicAI.Messages.MessageParam[],
    model: options.model,
    max_tokens: 1024,
  }).on('text', (text) => {
    result += text;
    options.onUpdate(result, text);
  });
  const mes = await stream.finalMessage();
  return result;
}

export async function runOpenAI(opts: {
  model: string,
  system: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  onUpdate: (text: string, delta: string) => void,
}) {
  const openai = new OpenAI({
    apiKey: opts.apiKey,
    dangerouslyAllowBrowser: true
  });

  const response = await openai.chat.completions.create({
    model: opts.model,
    stream: true,
    messages: [
      { role: 'system', content: opts.system },
      ...opts.messages as any,
    ],
  });

  let result = '';
  for await (const chunk of response) {
    for (const line of chunk.choices) {
      if (!line.delta.content) continue;
      result += line.delta.content;
      opts.onUpdate(result, line.delta.content);
      // console.log(result);
    }
  }
  console.log(result);
  return result;
}

const DEBUG_MESSAGE_STREAM = [
  'こんにち',
  'は。デバッグ',
  'モードです。ああああ。xxx'
]
export async function runChatForDebug(opts: {
  system: string,
  messages: { role: string; content: string }[],
  onUpdate: (text: string, delta: string) => void,
}) {
  const messages = opts.messages;
  const system = opts.system;
  const onUpdate = opts.onUpdate;

  let result = '';
  for (const message of DEBUG_MESSAGE_STREAM) {
    result += message;
    onUpdate(result, message);
  }
  return result;
  // for (const message of messages) {
  //   if (message.role === 'system') {
  //     result += system;
  //     onUpdate(result, system);
  //   } else {
  //     result += message.content;
  //     onUpdate(result, message.content);
  //   }
  // }
  return result;
}

export async function transcript(wavBuffer: ArrayBuffer, options: { apiKey: string }): Promise<{ text: string }> {
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });

  const transcriptionFormData = new FormData();
  // transcriptionFormData.set("file", resource); // 音声データをセット
  transcriptionFormData.set("model", "whisper-1"); // モデルをwhisper-1にする
  transcriptionFormData.set("language", "ja"); // 言語を日本語にする
  transcriptionFormData.set("prompt", "テスト");
  transcriptionFormData.set("file", blob);
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
    },
    method: "POST",
    body: transcriptionFormData,
  });
  if (res.status === 429) {
    throw new Error('Rate Limit Exceeded');
  }
  const json = await res.json();
  // console.log(json);
  return json;
}

